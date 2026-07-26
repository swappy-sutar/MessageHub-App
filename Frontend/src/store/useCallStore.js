import { create } from "zustand";
import toast from "../utils/toast.js";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { ringtone } from "../utils/ringtone";
import { formatCallDuration } from "../utils/formatCallTime";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { pushNotifications } from "../utils/pushNotifications";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

let callTimerInterval = null;
let autoCancelTimeout = null;
let pendingIceCandidates = [];

const processPendingIceCandidates = async (pc) => {
  if (!pc || !pc.remoteDescription) return;
  while (pendingIceCandidates.length > 0) {
    const cand = pendingIceCandidates.shift();
    try {
      await pc.addIceCandidate(new RTCIceCandidate(cand));
    } catch (e) {
      console.error("Error processing queued ICE candidate:", e);
    }
  }
};

// Helper to log call outcome as a chat message
const sendCallLogMessage = async (type, status, durationSec = 0, targetUserObj = null) => {
  try {
    const { targetUser, incomingCallData } = useCallStore.getState();
    const peer = targetUserObj || targetUser || (incomingCallData ? { _id: incomingCallData.from } : null);
    if (!peer?._id) return;

    const icon = type === "video" ? "📹" : "📞";
    const label = type === "video" ? "Video call" : "Voice call";
    let text = "";

    if (status === "completed") {
      const timeStr = formatCallDuration(durationSec);
      text = `${icon} ${label} • ${timeStr}`;
    } else if (status === "missed") {
      text = `${icon} Missed ${label.toLowerCase()}`;
    } else if (status === "declined") {
      text = `${icon} ${label} declined`;
    }

    if (!text) return;

    const token = Cookies.get("token");
    const formData = new FormData();
    formData.append("text", text);

    const res = await axiosInstance.post(
      `/messages/send/${peer._id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );

    const newMsg = res.data?.data;
    if (newMsg) {
      newMsg.text = text;
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id === peer._id) {
        chatStore.setState({ messages: [...chatStore.messages, newMsg] });
      }
    }
  } catch (err) {
    console.error("Error logging call message to chat:", err);
  }
};

export const useCallStore = create((set, get) => ({
  callState: "idle", // 'idle' | 'calling' | 'incoming' | 'connected'
  callType: "video", // 'video' | 'audio'
  targetUser: null, // User object for the other participant
  incomingCallData: null, // { from, offer, callType, callerInfo }
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isMinimized: false,
  isSwappedVideo: false,
  facingMode: "user", // "user" | "environment"
  callDuration: 0,
  peerConnection: null,
  isCaller: false,

    // Helper to cleanup media, timers, ringtone and peer connection
  cleanupCall: () => {
    ringtone.stop();

    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }

    if (autoCancelTimeout) {
      clearTimeout(autoCancelTimeout);
      autoCancelTimeout = null;
    }

    pendingIceCandidates = [];

    const { localStream, peerConnection } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
    }

    set({
      callState: "idle",
      callType: "video",
      targetUser: null,
      incomingCallData: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isMinimized: false,
      isSwappedVideo: false,
      facingMode: "user",
      callDuration: 0,
      peerConnection: null,
      isCaller: false,
    });
  },

  // Setup Socket listeners for WebRTC signaling
  initCallListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("iceCandidate");

    // 1. Incoming Call Event
    socket.on("incomingCall", ({ from, offer, callType, callerInfo }) => {
      const currentState = get().callState;
      if (currentState !== "idle") {
        socket.emit("rejectCall", { to: from });
        return;
      }

      ringtone.playIncomingTone();

      // Dispatch native PC Desktop Call Alert
      pushNotifications.sendCallNotification({
        callerName: callerInfo?.firstName ? `${callerInfo.firstName} ${callerInfo.lastName}` : "Someone",
        callType: callType,
      });

      set({
        callState: "incoming",
        callType: callType || "video",
        targetUser: callerInfo || { _id: from, firstName: "Incoming", lastName: "Call" },
        incomingCallData: { from, offer, callType, callerInfo },
        isCaller: false,
      });
    });

    // 2. Call Accepted Event (Caller side)
    socket.on("callAccepted", async ({ answer }) => {
      ringtone.stop();

      if (autoCancelTimeout) {
        clearTimeout(autoCancelTimeout);
        autoCancelTimeout = null;
      }

      const { peerConnection } = get();
      if (peerConnection && answer) {
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })
          );
          await processPendingIceCandidates(peerConnection);

          // Start call duration timer
          set({ callState: "connected", callDuration: 0 });
          callTimerInterval = setInterval(() => {
            set((state) => ({ callDuration: state.callDuration + 1 }));
          }, 1000);

          toast.success("Call connected!");
        } catch (err) {
          console.error("Error setting remote description on answer:", err);
        }
      }
    });

    // 3. Call Rejected Event
    socket.on("callRejected", () => {
      toast.error("Call was declined.");
      const { isCaller, callType, targetUser } = get();

      if (isCaller) {
        sendCallLogMessage(callType, "declined", 0, targetUser);
      }
      get().cleanupCall();
    });

    // 4. Call Ended Event
    socket.on("callEnded", () => {
      toast("Call ended.");
      const { callState, callType, callDuration, isCaller, targetUser } = get();

      if (isCaller) {
        if (callState === "connected") {
          sendCallLogMessage(callType, "completed", callDuration, targetUser);
        } else {
          sendCallLogMessage(callType, "missed", 0, targetUser);
        }
      }

      get().cleanupCall();
    });

    // 5. ICE Candidate Received Event
    socket.on("iceCandidate", async ({ candidate }) => {
      const { peerConnection } = get();
      if (peerConnection && candidate) {
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        } else {
          pendingIceCandidates.push(candidate);
        }
      }
    });
  },

  // Initiate a Call (Caller)
  startCall: async (targetUser, type = "video") => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !socket.connected) {
      return toast.error("Socket is not connected. Cannot start call.");
    }
    if (!targetUser?._id) return;

    try {
      const constraints = {
        audio: true,
        video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({
        localStream: stream,
        callState: "calling",
        callType: type,
        targetUser,
        isVideoOff: type !== "video",
        isMuted: false,
        isCaller: true,
      });

      // Play ringback tone for caller
      ringtone.playCallingTone();

      // Auto-cancel call after 35s if unanswered
      autoCancelTimeout = setTimeout(() => {
        if (get().callState === "calling") {
          toast.error("No answer.");
          sendCallLogMessage(type, "missed", 0, targetUser);
          get().endCall();
        }
      }, 35000);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      set({ peerConnection: pc });

      // Add local tracks to PC
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Remote stream handler
      pc.ontrack = (event) => {
        let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
        if (!stream) {
          const currentRemote = get().remoteStream || new MediaStream();
          currentRemote.addTrack(event.track);
          stream = currentRemote;
        }
        set({ remoteStream: stream });
      };

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Create SDP Offer & send as plain object
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callerUserObj = authUser?.data || authUser;

      const plainOffer = {
        type: offer.type,
        sdp: offer.sdp,
      };

      socket.emit("callUser", {
        to: String(targetUser._id),
        offer: plainOffer,
        callType: type,
        callerInfo: {
          _id: callerUserObj._id,
          firstName: callerUserObj.firstName,
          lastName: callerUserObj.lastName,
          profilePic: callerUserObj.profilePic,
        },
      });

    } catch (err) {
      console.error("Error accessing media devices / starting call:", err);
      toast.error("Microphone or Camera access denied / unavailable.");
      get().cleanupCall();
    }
  },

  // Accept an Incoming Call (Callee)
  acceptCall: async () => {
    ringtone.stop();
    const { incomingCallData } = get();
    const socket = useAuthStore.getState().socket;
    if (!incomingCallData || !socket) return;

    try {
      const type = incomingCallData.callType || "video";

      const constraints = {
        audio: true,
        video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({
        localStream: stream,
        callState: "connected",
        callDuration: 0,
        isVideoOff: type !== "video",
        isMuted: false,
      });

      // Start call duration timer
      if (callTimerInterval) clearInterval(callTimerInterval);
      callTimerInterval = setInterval(() => {
        set((state) => ({ callDuration: state.callDuration + 1 }));
      }, 1000);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      set({ peerConnection: pc });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
        if (!stream) {
          const currentRemote = get().remoteStream || new MediaStream();
          currentRemote.addTrack(event.track);
          stream = currentRemote;
        }
        set({ remoteStream: stream });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            to: incomingCallData.from,
            candidate: event.candidate,
          });
        }
      };

      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: incomingCallData.offer.type,
          sdp: incomingCallData.offer.sdp,
        })
      );
      await processPendingIceCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const plainAnswer = {
        type: answer.type,
        sdp: answer.sdp,
      };

      socket.emit("answerCall", {
        to: String(incomingCallData.from),
        answer: plainAnswer,
      });

    } catch (err) {
      console.error("Error accepting call:", err);
      toast.error("Failed to connect call.");
      get().cleanupCall();
    }
  },

  // Reject Call
  rejectCall: () => {
    ringtone.stop();
    const { incomingCallData } = get();
    const socket = useAuthStore.getState().socket;

    if (incomingCallData && socket) {
      socket.emit("rejectCall", { to: String(incomingCallData.from) });
    }

    get().cleanupCall();
  },

  // End Call
  endCall: () => {
    ringtone.stop();
    const { targetUser, incomingCallData, callState, callType, callDuration, isCaller } = get();
    const socket = useAuthStore.getState().socket;

    const peerId = targetUser?._id || incomingCallData?.from;

    if (peerId && socket) {
      socket.emit("endCall", { to: String(peerId) });
    }

    // Log call entry to chat
    if (isCaller) {
      if (callState === "connected") {
        sendCallLogMessage(callType, "completed", callDuration, targetUser);
      } else if (callState === "calling") {
        sendCallLogMessage(callType, "missed", 0, targetUser);
      }
    }

    get().cleanupCall();
  },

  // Toggle Mute Audio
  toggleAudio: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        set({ isMuted: !isMuted });
      }
    }
  },

  // Toggle Video Camera
  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        set({ isVideoOff: !isVideoOff });
      }
    }
  },

  // Toggle Screen Sharing
  toggleScreenShare: async () => {
    const { peerConnection, isScreenSharing } = get();
    if (!peerConnection) return;

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          get().toggleScreenShare();
        };

        set({ isScreenSharing: true });
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];

        const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }

        set({ isScreenSharing: false });
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  },

  // Toggle Minimized Call Widget
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),

  // Toggle Swapped Main / Secondary Video Streams
  toggleSwappedVideo: () => set((state) => ({ isSwappedVideo: !state.isSwappedVideo })),

  // Switch Front/Back Camera (Mobile Device Camera Flip)
  switchCamera: async () => {
    const { localStream, peerConnection, facingMode, isVideoOff } = get();
    if (!localStream || isVideoOff) return;

    try {
      const nextFacingMode = facingMode === "user" ? "environment" : "user";
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacingMode } },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStream.getVideoTracks()[0];

      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }

      localStream.addTrack(newVideoTrack);

      if (peerConnection) {
        const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      set({ facingMode: nextFacingMode, localStream });
      toast.success(`Switched camera to ${nextFacingMode === "user" ? "front" : "rear"}`);
    } catch (err) {
      console.warn("Exact facingMode switch failed, trying fallback:", err);
      try {
        const nextFacingMode = facingMode === "user" ? "environment" : "user";
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacingMode },
          audio: false,
        });
        const newVideoTrack = fallbackStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(newVideoTrack);
        if (peerConnection) {
          const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }
        set({ facingMode: nextFacingMode, localStream });
      } catch (fallbackErr) {
        console.error("Camera switch failed:", fallbackErr);
        toast.error("Camera flip not available on this device.");
      }
    }
  },
}));

export default useCallStore;
