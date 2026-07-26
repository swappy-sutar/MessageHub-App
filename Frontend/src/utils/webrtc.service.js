/**
 * webrtc.service.js — Production WebRTC Peer Connection Service
 *
 * Responsibilities:
 *  - RTCPeerConnection lifecycle (create, offer, answer, close)
 *  - ICE candidate queue with deferred flush
 *  - Automatic ICE restart on connection failure
 *  - Connection state monitoring → callbacks to store
 *  - Network quality estimation via getStats()
 *  - Proper track & event cleanup (no memory leaks)
 *
 * This is a plain ES module (no React) so it can be used anywhere.
 */

// ─── ICE Server Configuration ─────────────────────────────────────────────────
// Generates the full Metered.ca ICE server list:
//   1 × STUN  (stun.relay.metered.ca:80)
//   4 × TURN  (UDP/80, TCP/80, UDP/443, TLS/443)
//
// Falls back to Google public STUN servers when env vars are not set
// (covers ~85% of connections that don't need relay).
export const buildIceServers = () => {
  const host  = import.meta.env.VITE_TURN_HOST;
  const user  = import.meta.env.VITE_TURN_USERNAME;
  const cred  = import.meta.env.VITE_TURN_CREDENTIAL;

  if (host && user && cred) {
    return [
      // STUN — Metered's own STUN endpoint
      { urls: "stun:stun.relay.metered.ca:80" },

      // TURN UDP port 80 (works through most firewalls)
      { urls: `turn:${host}:80`,               username: user, credential: cred },

      // TURN TCP port 80 (fallback when UDP is blocked)
      { urls: `turn:${host}:80?transport=tcp`, username: user, credential: cred },

      // TURN UDP port 443 (some firewalls only allow 443)
      { urls: `turn:${host}:443`,              username: user, credential: cred },

      // TURNS TLS port 443 (encrypted relay — most restrictive network fallback)
      { urls: `turns:${host}:443?transport=tcp`, username: user, credential: cred },
    ];
  }

  // Local dev / no TURN configured → Google public STUN only
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];
};

const RTC_CONFIG = {
  iceServers: buildIceServers(),
  iceTransportPolicy: "all",       // "relay" to force TURN
  bundlePolicy: "max-bundle",      // BUNDLE all m-lines into one DTLS association
  rtcpMuxPolicy: "require",        // Require RTCP multiplexing
  iceCandidatePoolSize: 10,        // Pre-gather N candidates before offer
};

// ─── Audio constraints — production voice quality ─────────────────────────────
export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl:  true,
};

// ─── Video constraints by quality tier ───────────────────────────────────────
export const VIDEO_CONSTRAINTS = {
  hd: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
  sd: { width: { ideal: 640  }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 24 } },
  lo: { width: { ideal: 320  }, height: { ideal: 240 }, frameRate: { ideal: 10, max: 15 } },
};

// ─── WebRTCService class ──────────────────────────────────────────────────────
export class WebRTCService {
  /** @type {RTCPeerConnection | null} */
  pc = null;

  /** @type {MediaStream | null} */
  localStream = null;

  /** Deferred ICE candidates received before remote description is set. */
  _iceCandidateQueue = [];

  /** Timer handle for stats polling. */
  _statsTimer = null;

  /** Callbacks injected by the store. */
  _callbacks = {
    onRemoteStream:       null, // (stream: MediaStream) => void
    onIceCandidate:       null, // (candidate: RTCIceCandidate) => void
    onConnectionChange:   null, // (state: string) => void
    onIceStateChange:     null, // (state: string) => void
    onNegotiationNeeded: null,  // () => void
    onNetworkQuality:     null, // (quality: 'good'|'fair'|'poor') => void
  };

  /**
   * Initialize the RTCPeerConnection and bind all event handlers.
   * @param {object} callbacks
   */
  init(callbacks = {}) {
    this.close(); // Teardown any existing PC first

    this._callbacks = { ...this._callbacks, ...callbacks };
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    // ── Track event: remote media arrives ──
    this.pc.ontrack = (evt) => {
      if (!this._callbacks.onRemoteStream) return;
      const stream = evt.streams?.[0] ?? (() => {
        const s = new MediaStream();
        s.addTrack(evt.track);
        return s;
      })();
      this._callbacks.onRemoteStream(stream);
    };

    // ── ICE candidate gathered locally ──
    this.pc.onicecandidate = (evt) => {
      if (evt.candidate && this._callbacks.onIceCandidate) {
        this._callbacks.onIceCandidate(evt.candidate);
      }
    };

    // ── ICE connection state ──
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc?.iceConnectionState;
      this._callbacks.onIceStateChange?.(state);

      if (state === "failed") {
        console.warn("[WebRTC] ICE failed → triggering ICE restart");
        this._triggerIceRestart();
      }
      if (state === "disconnected") {
        // Give 5 s to recover before declaring failure
        this._iceRecoveryTimer = setTimeout(() => {
          if (this.pc?.iceConnectionState === "disconnected") {
            console.warn("[WebRTC] ICE disconnected 5s → triggering restart");
            this._triggerIceRestart();
          }
        }, 5000);
      } else {
        clearTimeout(this._iceRecoveryTimer);
      }
    };

    // ── Overall connection state ──
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      this._callbacks.onConnectionChange?.(state);
    };

    // ── Renegotiation needed (e.g. after track replacement) ──
    this.pc.onnegotiationneeded = () => {
      this._callbacks.onNegotiationNeeded?.();
    };

    // ── Start periodic getStats quality polling ──
    this._startStatsPolling();

    return this;
  }

  /**
   * Acquire and add local media tracks to the peer connection.
   * @param {"video"|"audio"} callType
   * @param {"user"|"environment"} facingMode
   * @returns {Promise<MediaStream>}
   */
  async acquireLocalMedia(callType, facingMode = "user") {
    const constraints = {
      audio: AUDIO_CONSTRAINTS,
      video: callType === "video"
        ? { ...VIDEO_CONSTRAINTS.hd, facingMode }
        : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Fallback to SD if HD fails
      if (callType === "video" && err.name !== "NotAllowedError") {
        constraints.video = { ...VIDEO_CONSTRAINTS.sd, facingMode };
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        throw err;
      }
    }

    this.localStream.getTracks().forEach((track) => this.pc?.addTrack(track, this.localStream));
    return this.localStream;
  }

  /**
   * Create and set an SDP offer (caller side).
   * @returns {Promise<RTCSessionDescriptionInit>} plain offer
   */
  async createOffer() {
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return { type: offer.type, sdp: offer.sdp };
  }

  /**
   * Set the remote offer and create an SDP answer (callee side).
   * @param {{ type: string, sdp: string }} remoteOffer
   * @returns {Promise<RTCSessionDescriptionInit>} plain answer
   */
  async createAnswer(remoteOffer) {
    await this.pc.setRemoteDescription(remoteOffer);
    await this._flushIceCandidateQueue();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return { type: answer.type, sdp: answer.sdp };
  }

  /**
   * Set the remote answer (caller side, after callee answers).
   * @param {{ type: string, sdp: string }} remoteAnswer
   */
  async setRemoteAnswer(remoteAnswer) {
    await this.pc.setRemoteDescription(remoteAnswer);
    await this._flushIceCandidateQueue();
  }

  /**
   * Add a remote ICE candidate (queued if remote description not set yet).
   * @param {RTCIceCandidateInit} candidate
   */
  async addIceCandidate(candidate) {
    if (!this.pc) return;
    if (!this.pc.remoteDescription?.type) {
      this._iceCandidateQueue.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[WebRTC] addIceCandidate error:", err.message);
    }
  }

  /**
   * Replace the outgoing video track (used for camera flip / screen share).
   * @param {MediaStreamTrack} newTrack
   */
  async replaceVideoTrack(newTrack) {
    const sender = this.pc
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(newTrack);
  }

  /**
   * Replace the outgoing audio track.
   * @param {MediaStreamTrack} newTrack
   */
  async replaceAudioTrack(newTrack) {
    const sender = this.pc
      ?.getSenders()
      .find((s) => s.track?.kind === "audio");
    if (sender) await sender.replaceTrack(newTrack);
  }

  /**
   * Trigger an ICE restart by creating a new offer with iceRestart: true.
   * The caller must be identified externally to pick the right path.
   */
  async _triggerIceRestart() {
    if (!this.pc || this.pc.signalingState === "closed") return;
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      this._callbacks.onIceRestart?.({ type: offer.type, sdp: offer.sdp });
    } catch (err) {
      console.error("[WebRTC] ICE restart offer creation failed:", err.message);
    }
  }

  /**
   * Apply the ICE restart offer from the remote peer (callee side).
   * @param {{ type: string, sdp: string }} restartOffer
   * @returns {Promise<RTCSessionDescriptionInit>} answer
   */
  async applyIceRestartOffer(restartOffer) {
    await this.pc.setRemoteDescription(restartOffer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return { type: answer.type, sdp: answer.sdp };
  }

  /**
   * Switch the front/rear camera on mobile.
   * @param {"user"|"environment"} facingMode
   * @returns {Promise<MediaStreamTrack>} the new video track
   */
  async switchCamera(facingMode) {
    const constraints = { video: { ...VIDEO_CONSTRAINTS.hd, facingMode }, audio: false };

    let newStream;
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: { ...constraints.video, facingMode: { exact: facingMode } },
        audio: false,
      });
    } catch {
      newStream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    const newTrack = newStream.getVideoTracks()[0];
    const oldTrack = this.localStream?.getVideoTracks()[0];

    if (oldTrack) {
      this.localStream.removeTrack(oldTrack);
      oldTrack.stop();
    }

    this.localStream?.addTrack(newTrack);
    await this.replaceVideoTrack(newTrack);
    return newTrack;
  }

  /**
   * Start screen sharing and replace the video sender track.
   * @returns {Promise<MediaStream>} the screen capture stream
   */
  async startScreenShare() {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor" },
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    await this.replaceVideoTrack(screenTrack);

    // Auto-restore camera when user stops sharing from the browser UI
    screenTrack.onended = () => {
      this._callbacks.onScreenShareEnded?.();
    };

    return screenStream;
  }

  /**
   * Stop screen sharing and restore the camera track.
   * @param {MediaStreamTrack} cameraTrack — original camera track to restore
   */
  async stopScreenShare(cameraTrack) {
    await this.replaceVideoTrack(cameraTrack);
  }

  // ─── Stats: periodic network quality estimation ───────────────────────
  _startStatsPolling() {
    this._statsTimer = setInterval(async () => {
      if (!this.pc || !this._callbacks.onNetworkQuality) return;
      try {
        const stats = await this.pc.getStats();
        let rtt = null;
        let packetsLost = 0;
        let totalPackets = 0;

        stats.forEach((report) => {
          if (report.type === "remote-inbound-rtp") {
            if (report.roundTripTime != null) rtt = report.roundTripTime;
            packetsLost  += report.packetsLost  ?? 0;
            totalPackets += (report.packetsReceived ?? 0) + (report.packetsLost ?? 0);
          }
        });

        const lossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;
        let quality = "good";
        if (rtt > 0.3 || lossRate > 0.05) quality = "fair";
        if (rtt > 0.6 || lossRate > 0.15) quality = "poor";

        this._callbacks.onNetworkQuality(quality);
      } catch { /* stats unavailable — ignore */ }
    }, 5000);
  }

  // ─── Flush queued ICE candidates after remote description is set ──────
  async _flushIceCandidateQueue() {
    while (this._iceCandidateQueue.length > 0) {
      const cand = this._iceCandidateQueue.shift();
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn("[WebRTC] flushing ICE queue error:", err.message);
      }
    }
  }

  /**
   * Stop all local media tracks and close the peer connection.
   */
  close() {
    clearInterval(this._statsTimer);
    clearTimeout(this._iceRecoveryTimer);
    this._statsTimer = null;
    this._iceCandidateQueue = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.pc) {
      this.pc.ontrack                    = null;
      this.pc.onicecandidate             = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.onconnectionstatechange    = null;
      this.pc.onnegotiationneeded        = null;
      this.pc.close();
      this.pc = null;
    }
  }
}

/** Singleton instance shared across the app. */
export const webrtcService = new WebRTCService();
