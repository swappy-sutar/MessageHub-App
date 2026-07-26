/**
 * useCallStore.js — Production WebRTC Call State Management
 *
 * Architecture:
 *  ┌─────────────┐   actions    ┌───────────────┐   WebRTC API
 *  │  CallModal  │ ──────────▶  │ useCallStore  │ ──────────▶ webrtcService
 *  │  ChatHeader │              │   (Zustand)   │
 *  └─────────────┘              └───────┬───────┘
 *                                       │ socket events
 *                                       ▼
 *                               Socket.IO signaling
 *
 * Key design decisions:
 *  - webrtcService is a singleton; the store is its orchestrator.
 *  - All socket listeners are registered once (initCallListeners).
 *  - ICE restart is automatic — triggered by webrtcService, relayed via socket.
 *  - callId is a UUID generated on the caller side, echoed through all events.
 *  - Call records are persisted on the backend (fire-and-forget from socket server).
 *  - Network quality is polled by webrtcService and stored here for UI.
 */

import { create } from "zustand";
import toast from "../utils/toast.js";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { ringtone } from "../utils/ringtone";
import { formatCallDuration } from "../utils/formatCallTime";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { pushNotifications } from "../utils/pushNotifications";
import { webrtcService } from "../utils/webrtc.service.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a UUID (v4) compatible with the crypto API available in modern browsers */
const generateCallId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback — browser compatibility
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/** Persist a call outcome as a chat message for the caller's conversation view. */
const sendCallLogMessage = async (type, status, durationSec = 0, targetUserObj = null) => {
  try {
    const { targetUser, incomingCallData } = useCallStore.getState();
    const peer = targetUserObj || targetUser || (incomingCallData ? { _id: incomingCallData.from } : null);
    if (!peer?._id) return;

    const icon  = type === "video" ? "📹" : "📞";
    const label = type === "video" ? "Video call" : "Voice call";
    let text    = "";

    if (status === "completed") {
      text = `${icon} ${label} • ${formatCallDuration(durationSec)}`;
    } else if (status === "missed") {
      text = `${icon} Missed ${label.toLowerCase()}`;
    } else if (status === "declined") {
      text = `${icon} ${label} declined`;
    } else if (status === "busy") {
      text = `${icon} ${label} — line busy`;
    }

    if (!text) return;

    const token = Cookies.get("token");
    const formData = new FormData();
    formData.append("text", text);

    const res = await axiosInstance.post(`/messages/send/${peer._id}`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    const newMsg = res.data?.data;
    if (newMsg) {
      newMsg.text = text;
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id === peer._id) {
        chatStore.setState({ messages: [...chatStore.messages, newMsg] });
      }
    }
  } catch (err) {
    console.error("[Call] Error logging call message:", err);
  }
};

// ─── Module-level timers (outside Zustand to avoid re-render loops) ──────────
let callTimerInterval  = null;
let autoCancelTimeout  = null;

const startCallTimer = (set) => {
  if (callTimerInterval) clearInterval(callTimerInterval);
  set({ callDuration: 0 });
  callTimerInterval = setInterval(() => {
    useCallStore.setState((s) => ({ callDuration: s.callDuration + 1 }));
  }, 1000);
};

const stopCallTimer = () => {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useCallStore = create((set, get) => ({
  // ── State ──
  callState:      "idle",   // 'idle' | 'calling' | 'incoming' | 'connected'
  callType:       "video",  // 'video' | 'audio'
  callId:         null,     // UUID for this call session
  targetUser:     null,     // User object for the remote participant
  incomingCallData: null,   // { from, offer, callType, callerInfo, callId }
  localStream:    null,
  remoteStream:   null,
  isMuted:        false,
  isVideoOff:     false,
  isScreenSharing: false,
  isMinimized:    false,
  isSwappedVideo: false,
  facingMode:     "user",   // "user" | "environment"
  callDuration:   0,
  isCaller:       false,
  networkQuality: "good",   // 'good' | 'fair' | 'poor'
  connectionState: "new",   // RTCPeerConnection connectionState
  remoteIsMuted:  false,    // Remote participant's mute state
  remoteVideoOff: false,    // Remote participant's camera state
  showPermissionModal: false, // Whether to show MediaPermissionModal
  permissionCallType: "video",
  permissionCallback: null,

  // ── Cleanup ───────────────────────────────────────────────────────────────
  cleanupCall: () => {
    ringtone.stop();
    stopCallTimer();

    if (autoCancelTimeout) {
      clearTimeout(autoCancelTimeout);
      autoCancelTimeout = null;
    }

    webrtcService.close();

    set({
      callState:      "idle",
      callType:       "video",
      callId:         null,
      targetUser:     null,
      incomingCallData: null,
      localStream:    null,
      remoteStream:   null,
      isMuted:        false,
      isVideoOff:     false,
      isScreenSharing: false,
      isMinimized:    false,
      isSwappedVideo: false,
      facingMode:     "user",
      callDuration:   0,
      isCaller:       false,
      networkQuality: "good",
      connectionState: "new",
      remoteIsMuted:  false,
      remoteVideoOff: false,
      showPermissionModal: false,
      permissionCallType: "video",
      permissionCallback: null,
    });
  },

  // ── Socket Listener Initialization ───────────────────────────────────────
  initCallListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove any stale listeners before (re-)attaching
    const events = [
      "incomingCall", "callAccepted", "callRejected", "callCancelled",
      "callEnded", "callBusy", "callFailed", "iceCandidate", "iceRestartOffer",
      "mute", "unmute", "videoOn", "videoOff",
      "screenShareStart", "screenShareStop", "networkQuality",
    ];
    events.forEach((e) => socket.off(e));

    // 1. Incoming Call
    socket.on("incomingCall", ({ from, offer, callType, callerInfo, callId }) => {
      if (get().callState !== "idle") {
        // Already in a call → signal busy
        socket.emit("rejectCall", { to: String(from), callId });
        return;
      }

      ringtone.playIncomingTone();

      pushNotifications.sendCallNotification({
        callerName: callerInfo?.firstName
          ? `${callerInfo.firstName} ${callerInfo.lastName}`
          : "Someone",
        callType,
      });

      set({
        callState:      "incoming",
        callType:       callType || "video",
        callId,
        targetUser:     callerInfo || { _id: from },
        incomingCallData: { from, offer, callType, callerInfo, callId },
        isCaller:       false,
      });
    });

    // 2. Call Accepted (caller receives answer from callee)
    socket.on("callAccepted", async ({ answer, callId }) => {
      ringtone.stop();
      if (autoCancelTimeout) { clearTimeout(autoCancelTimeout); autoCancelTimeout = null; }
      if (get().callId !== callId) return; // stale event

      try {
        await webrtcService.setRemoteAnswer(answer);
        startCallTimer(set);
        set({ callState: "connected" });
        toast.success("Call connected!");
      } catch (err) {
        console.error("[Call] setRemoteAnswer failed:", err);
        toast.error("Failed to connect call.");
        get().cleanupCall();
      }
    });

    // 3. Call Rejected
    socket.on("callRejected", ({ callId, reason } = {}) => {
      if (reason === "busy") {
        toast.error("User is busy on another call.");
        sendCallLogMessage(get().callType, "busy", 0, get().targetUser);
      } else {
        toast.error("Call was declined.");
        const { isCaller, callType, targetUser } = get();
        if (isCaller) sendCallLogMessage(callType, "declined", 0, targetUser);
      }
      get().cleanupCall();
    });

    // 4. Call Cancelled (caller cancelled before we answered)
    socket.on("callCancelled", () => {
      ringtone.stop();
      toast("Call was cancelled.");
      get().cleanupCall();
    });

    // 5. Call Ended (remote party ended the call)
    socket.on("callEnded", ({ reason } = {}) => {
      const { callState, callType, callDuration, isCaller, targetUser } = get();
      if (callState === "connected") {
        toast("Call ended.");
        if (isCaller) sendCallLogMessage(callType, "completed", callDuration, targetUser);
      } else if (reason === "peer_disconnected") {
        toast.error("Call ended — peer disconnected.");
      }
      get().cleanupCall();
    });

    // 6. Call Busy (callee is already in a call — from server)
    socket.on("callBusy", () => {
      toast.error("User is busy.");
      sendCallLogMessage(get().callType, "busy", 0, get().targetUser);
      get().cleanupCall();
    });

    // 7. Call Failed (server error)
    socket.on("callFailed", ({ reason } = {}) => {
      toast.error(`Call failed${reason ? `: ${reason}` : ""}.`);
      get().cleanupCall();
    });

    // 8. ICE Candidate from remote peer
    socket.on("iceCandidate", async ({ candidate, callId }) => {
      if (get().callId !== callId) return;
      await webrtcService.addIceCandidate(candidate);
    });

    // 9. ICE Restart offer from remote peer (callee receives; caller initiated restart)
    socket.on("iceRestartOffer", async ({ offer, callId }) => {
      if (get().callId !== callId) return;
      try {
        const answer = await webrtcService.applyIceRestartOffer(offer);
        socket.emit("answerCall", {
          to: String(get().incomingCallData?.from || get().targetUser?._id),
          answer,
          callId,
        });
        toast("🔄 Call reconnected.");
      } catch (err) {
        console.error("[Call] ICE restart answer failed:", err);
      }
    });

    // 10. Remote media state signals
    socket.on("mute",     () => set({ remoteIsMuted: true }));
    socket.on("unmute",   () => set({ remoteIsMuted: false }));
    socket.on("videoOff", () => set({ remoteVideoOff: true }));
    socket.on("videoOn",  () => set({ remoteVideoOff: false }));
    socket.on("screenShareStart", () => toast("📺 Peer is sharing their screen."));
    socket.on("screenShareStop",  () => toast("📺 Peer stopped sharing their screen."));

    // 11. Network quality from remote peer
    socket.on("networkQuality", ({ quality }) => {
      // We store the minimum of local + remote quality
      const current = get().networkQuality;
      const order   = { good: 0, fair: 1, poor: 2 };
      if (order[quality] > order[current]) set({ networkQuality: quality });
    });
  },

  // ── Start Call (caller) ───────────────────────────────────────────────────
  startCall: async (targetUser, type = "video", bypassPermissionCheck = false) => {
    const socket   = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket?.connected) return toast.error("Not connected to server.");
    if (!targetUser?._id)   return;
    if (get().callState !== "idle") return toast.error("Already in a call.");

    // Check permissions
    if (!bypassPermissionCheck) {
      let hasPermission = false;
      try {
        if (navigator.permissions?.query) {
          const micStatus = await navigator.permissions.query({ name: "microphone" });
          const camStatus = type === "video" ? await navigator.permissions.query({ name: "camera" }) : { state: "granted" };
          if (micStatus.state === "granted" && camStatus.state === "granted") {
            hasPermission = true;
          }
        }
      } catch (e) {}

      // On mobile or if not explicitly granted, prompt with our custom explanation modal
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (isMobile || !hasPermission) {
        set({
          showPermissionModal: true,
          permissionCallType: type,
          permissionCallback: () => {
            set({ showPermissionModal: false });
            get().startCall(targetUser, type, true);
          }
        });
        return;
      }
    }

    const callId = generateCallId();

    try {
      // Wire up webrtcService callbacks
      webrtcService.init({
        onRemoteStream: (stream) => set({ remoteStream: stream }),
        onIceCandidate: (candidate) => {
          socket.emit("iceCandidate", { to: String(targetUser._id), candidate, callId });
        },
        onConnectionChange: (state) => {
          set({ connectionState: state });
          if (state === "failed") {
            toast.error("Connection failed. Retrying…");
          }
        },
        onIceStateChange: (state) => {
          if (state === "connected" || state === "completed") {
            set({ networkQuality: "good" });
          }
        },
        onIceRestart: (offer) => {
          socket.emit("iceRestart", { to: String(targetUser._id), offer, callId });
          toast("🔄 Reconnecting call…");
        },
        onNetworkQuality: (quality) => {
          set({ networkQuality: quality });
          socket.emit("networkQuality", { to: String(targetUser._id), callId, quality });
        },
        onScreenShareEnded: () => {
          // Browser stop-share button was pressed
          get().toggleScreenShare();
        },
      });

      const stream = await webrtcService.acquireLocalMedia(type);

      set({
        localStream: stream,
        callState:   "calling",
        callType:    type,
        callId,
        targetUser,
        isCaller:    true,
        isVideoOff:  false,
        isMuted:     false,
      });

      ringtone.playCallingTone();

      // Auto-cancel after 35 s if unanswered
      autoCancelTimeout = setTimeout(() => {
        if (get().callState === "calling") {
          toast.error("No answer.");
          sendCallLogMessage(type, "missed", 0, targetUser);
          get().endCall();
        }
      }, 35_000);

      const offer = await webrtcService.createOffer();

      const callerInfo = (() => {
        const u = authUser?.data || authUser;
        return {
          _id: u._id, firstName: u.firstName,
          lastName: u.lastName, profilePic: u.profilePic,
        };
      })();

      socket.emit("callUser", {
        to: String(targetUser._id),
        offer,
        callType: type,
        callerInfo,
        callId,
      });
    } catch (err) {
      console.error("[Call] startCall error:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Microphone/Camera permission denied.");
      } else if (err.name === "NotFoundError") {
        toast.error("No microphone or camera found.");
      } else {
        toast.error("Failed to start call.");
      }
      get().cleanupCall();
    }
  },

  // ── Accept Call (callee) ──────────────────────────────────────────────────
  acceptCall: async (bypassPermissionCheck = false) => {
    ringtone.stop();
    const { incomingCallData } = get();
    const socket = useAuthStore.getState().socket;
    if (!incomingCallData || !socket) return;

    const { from, offer, callType, callId } = incomingCallData;

    // Check permissions
    if (!bypassPermissionCheck) {
      let hasPermission = false;
      try {
        if (navigator.permissions?.query) {
          const micStatus = await navigator.permissions.query({ name: "microphone" });
          const camStatus = callType === "video" ? await navigator.permissions.query({ name: "camera" }) : { state: "granted" };
          if (micStatus.state === "granted" && camStatus.state === "granted") {
            hasPermission = true;
          }
        }
      } catch (e) {}

      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (isMobile || !hasPermission) {
        set({
          showPermissionModal: true,
          permissionCallType: callType,
          permissionCallback: () => {
            set({ showPermissionModal: false });
            get().acceptCall(true);
          }
        });
        return;
      }
    }

    try {
      webrtcService.init({
        onRemoteStream: (stream) => set({ remoteStream: stream }),
        onIceCandidate: (candidate) => {
          socket.emit("iceCandidate", { to: String(from), candidate, callId });
        },
        onConnectionChange: (state) => set({ connectionState: state }),
        onIceStateChange: (state) => {
          if (state === "connected" || state === "completed") set({ networkQuality: "good" });
        },
        onIceRestart: (restartOffer) => {
          socket.emit("iceRestart", { to: String(from), offer: restartOffer, callId });
        },
        onNetworkQuality: (quality) => {
          set({ networkQuality: quality });
          socket.emit("networkQuality", { to: String(from), callId, quality });
        },
        onScreenShareEnded: () => get().toggleScreenShare(),
      });

      const stream = await webrtcService.acquireLocalMedia(callType);

      set({
        localStream: stream,
        callState:   "connected",
        callType,
        isVideoOff:  callType !== "video",
        isMuted:     false,
      });

      startCallTimer(set);

      const answer = await webrtcService.createAnswer(offer);

      socket.emit("answerCall", { to: String(from), answer, callId });
    } catch (err) {
      console.error("[Call] acceptCall error:", err);
      toast.error("Failed to connect call.");
      get().cleanupCall();
    }
  },

  // ── Reject Call (callee) ──────────────────────────────────────────────────
  rejectCall: () => {
    ringtone.stop();
    const { incomingCallData } = get();
    const socket = useAuthStore.getState().socket;

    if (incomingCallData && socket) {
      socket.emit("rejectCall", {
        to: String(incomingCallData.from),
        callId: incomingCallData.callId,
      });
    }

    get().cleanupCall();
  },

  // ── End Call (either party) ───────────────────────────────────────────────
  endCall: () => {
    ringtone.stop();
    const { targetUser, incomingCallData, callState, callType, callDuration, isCaller, callId } = get();
    const socket = useAuthStore.getState().socket;

    const peerId = targetUser?._id || incomingCallData?.from;

    if (peerId && socket) {
      socket.emit("endCall", { to: String(peerId), callId });
    }

    if (isCaller) {
      if (callState === "connected") {
        sendCallLogMessage(callType, "completed", callDuration, targetUser);
      } else if (callState === "calling") {
        sendCallLogMessage(callType, "missed", 0, targetUser);
      }
    }

    get().cleanupCall();
  },

  // ── Toggle Mute ───────────────────────────────────────────────────────────
  toggleAudio: () => {
    const { localStream, isMuted, targetUser, incomingCallData, callId } = get();
    const socket = useAuthStore.getState().socket;

    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = isMuted; // toggle
        const nextMuted = !isMuted;
        set({ isMuted: nextMuted });

        const peerId = targetUser?._id || incomingCallData?.from;
        if (peerId && socket) {
          socket.emit(nextMuted ? "mute" : "unmute", { to: String(peerId), callId });
        }
      }
    }
  },

  // ── Toggle Camera ─────────────────────────────────────────────────────────
  toggleVideo: () => {
    const { localStream, isVideoOff, targetUser, incomingCallData, callId } = get();
    const socket = useAuthStore.getState().socket;

    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoOff; // toggle
        const nextOff = !isVideoOff;
        set({ isVideoOff: nextOff });

        const peerId = targetUser?._id || incomingCallData?.from;
        if (peerId && socket) {
          socket.emit(nextOff ? "videoOff" : "videoOn", { to: String(peerId), callId });
        }
      }
    }
  },

  // ── Screen Share ──────────────────────────────────────────────────────────
  toggleScreenShare: async () => {
    const { isScreenSharing, localStream, targetUser, incomingCallData, callId } = get();
    const socket  = useAuthStore.getState().socket;
    const peerId  = targetUser?._id || incomingCallData?.from;

    try {
      if (!isScreenSharing) {
        await webrtcService.startScreenShare();
        set({ isScreenSharing: true });
        if (peerId && socket) socket.emit("screenShareStart", { to: String(peerId), callId });
        toast("📺 Screen sharing started.");
      } else {
        // Restore original camera track
        const cameraTrack = localStream?.getVideoTracks()[0];
        if (cameraTrack) await webrtcService.stopScreenShare(cameraTrack);
        set({ isScreenSharing: false });
        if (peerId && socket) socket.emit("screenShareStop", { to: String(peerId), callId });
        toast("📺 Screen sharing stopped.");
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("[Call] screen share error:", err);
        toast.error("Screen sharing failed.");
      }
      // If user cancelled the picker → silently reset
      set({ isScreenSharing: false });
    }
  },

  // ── Switch Camera (mobile) ────────────────────────────────────────────────
  switchCamera: async () => {
    const { facingMode, isVideoOff } = get();
    if (isVideoOff) return;

    const next = facingMode === "user" ? "environment" : "user";
    try {
      await webrtcService.switchCamera(next);
      set({ facingMode: next });
      toast.success(`Switched to ${next === "user" ? "front" : "rear"} camera.`);
    } catch (err) {
      console.error("[Call] switchCamera error:", err);
      toast.error("Camera switch not available on this device.");
    }
  },

  // ── UI helpers ────────────────────────────────────────────────────────────
  toggleMinimized:   () => set((s) => ({ isMinimized:   !s.isMinimized })),
  toggleSwappedVideo:() => set((s) => ({ isSwappedVideo: !s.isSwappedVideo })),
}));

export default useCallStore;
