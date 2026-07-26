import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatCallDuration } from "../utils/formatCallTime";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneCall,
  Volume2,
  Monitor,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import avatar from "../assets/avatar.png";

const CallModal = () => {
  const {
    callState,
    callType,
    targetUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isMinimized,
    isSwappedVideo,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleMinimized,
    toggleSwappedVideo,
    switchCamera,
    initCallListeners,
  } = useCallStore();

  const socket = useAuthStore((state) => state.socket);

  // ── Audio ref — always-mounted hidden <audio> element ────────────────
  // (Only audio needs to be always-mounted; video elements use callback refs.)
  const remoteAudioRef = useRef(null);

  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideControlsTimer = useRef(null);

  // ── Socket listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (socket) initCallListeners();
  }, [socket, initCallListeners]);

  // ── REMOTE AUDIO — bind stream imperatively whenever it changes ───────
  useEffect(() => {
    if (!remoteStream || !remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream;
    remoteAudioRef.current.muted  = false; // imperative, bypasses React muted attr bug
    remoteAudioRef.current.volume = 1.0;
    remoteAudioRef.current
      .play()
      .catch((e) => console.warn("Remote audio play blocked:", e));
  }, [remoteStream]);

  // ── CALLBACK REFS for video elements ─────────────────────────────────
  // useCallback ensures the ref callback is called again whenever the stream
  // changes (new function ref → React unmounts old ref with null, then calls
  // new ref with the element → srcObject is re-assigned to the live element).

  // Remote video main view
  const setRemoteVideoRef = useCallback((el) => {
    if (!el) return;
    if (remoteStream && el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch((e) => console.warn("Remote video play blocked:", e));
    }
  }, [remoteStream]);

  // Local video (self-view / PiP)
  const setLocalVideoRef = useCallback((el) => {
    if (!el) return;
    if (localStream && el.srcObject !== localStream) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  // Mini remote video for desktop floating widget
  const setMiniRemoteVideoRef = useCallback((el) => {
    if (!el) return;
    if (remoteStream && el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch((e) => console.warn("Mini remote video play blocked:", e));
    }
  }, [remoteStream]);

  // ── Auto-hide controls in active video call ───────────────────────────
  const resetControlsTimer = useCallback(() => {
    setIsControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (callState === "connected" && callType === "video") {
      hideControlsTimer.current = setTimeout(() => setIsControlsVisible(false), 4000);
    }
  }, [callState, callType]);

  useEffect(() => {
    if (callState === "connected" && callType === "video") {
      resetControlsTimer();
    } else {
      setIsControlsVisible(true);
    }
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [callState, callType, resetControlsTimer]);

  // ── Fullscreen ────────────────────────────────────────────────────────
  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen &&
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(() => {});
    }
  };

  // ── Early-exit only AFTER all hooks have run ─────────────────────────
  // The hidden media elements are rendered below even when callState==="idle"
  // so refs are always valid whenever a stream arrives.
  const isIdle = callState === "idle";

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ALWAYS-MOUNTED HIDDEN AUDIO
          Only the <audio> element needs to be always in the DOM so the
          remote audio stream can be bound before the connected view renders.
          Video elements use callback refs instead — no hidden duplicates.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hidden" aria-hidden="true">
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </div>

      {/* Nothing else rendered when idle */}
      {!isIdle && (
        <>
          {/* ══════════════════════════════════════════════════════════
              MINIMIZED FLOATING CALL WIDGET
          ══════════════════════════════════════════════════════════ */}
          {isMinimized && (
            <>
              {/* Mobile sticky bar */}
              <div className="sm:hidden fixed top-3 left-3 right-3 z-50 call-glass-panel rounded-2xl p-2.5 flex items-center justify-between shadow-2xl animate-fade-in-up">
                <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={toggleMinimized}>
                  <div className="relative">
                    <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                      className="size-10 rounded-full object-cover border-2 border-primary" />
                    <span className="absolute bottom-0 right-0 size-3 bg-success rounded-full ring-2 ring-base-100 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate max-w-[110px]">
                      {targetUser?.firstName} {targetUser?.lastName}
                    </h4>
                    <p className="text-[10px] font-mono text-emerald-400 font-semibold">
                      {callState === "connected" ? formatCallDuration(callDuration) : "Ringing..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={toggleAudio}
                    className={`p-2 rounded-full ${isMuted ? "bg-error text-white" : "bg-white/10 text-white"}`}>
                    {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>
                  <button onClick={toggleMinimized}
                    className="p-2 rounded-full bg-primary/20 text-primary border border-primary/30">
                    <Maximize2 className="size-4" />
                  </button>
                  <button onClick={endCall}
                    className="p-2 rounded-full bg-error text-white shadow-md">
                    <PhoneOff className="size-4" />
                  </button>
                </div>
              </div>

              {/* Desktop floating corner widget */}
              <div className="hidden sm:flex fixed bottom-6 right-6 z-50 call-glass-panel rounded-3xl p-3 w-72 flex-col gap-3 shadow-2xl animate-fade-in-up border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-semibold text-white truncate">
                      {targetUser?.firstName} {targetUser?.lastName}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {callState === "connected" ? formatCallDuration(callDuration) : "Calling..."}
                  </span>
                </div>

                {/* Mini preview */}
                <div onClick={toggleMinimized}
                  className="relative h-32 w-full rounded-2xl bg-black/60 overflow-hidden cursor-pointer group flex items-center justify-center border border-white/10">
                  {callType === "video" && remoteStream ? (
                    <video ref={setMiniRemoteVideoRef} autoPlay playsInline
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                        className="size-12 rounded-full object-cover border-2 border-primary" />
                      <div className="flex gap-1 h-3 items-center">
                        {[0.4, 0.9, 0.6, 1, 0.5].map((h, i) => (
                          <span key={i} className="w-1 bg-primary rounded-full animate-sound-wave"
                            style={{ height: `${h * 12}px`, animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Maximize2 className="size-6 text-white drop-shadow-md" />
                    <span className="text-xs font-medium text-white">Expand</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button onClick={toggleAudio}
                    className={`p-2.5 rounded-full call-control-btn ${isMuted ? "bg-error text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    {isMuted ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                  </button>
                  {callType === "video" && (
                    <button onClick={toggleVideo}
                      className={`p-2.5 rounded-full call-control-btn ${isVideoOff ? "bg-error text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                      {isVideoOff ? <VideoOff className="size-4.5" /> : <Video className="size-4.5" />}
                    </button>
                  )}
                  <button onClick={toggleMinimized}
                    className="p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30 call-control-btn">
                    <Maximize2 className="size-4.5" />
                  </button>
                  <button onClick={endCall}
                    className="p-2.5 rounded-full bg-error text-white shadow-lg call-control-btn">
                    <PhoneOff className="size-4.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              FULL CALL MODAL (incoming / calling / connected)
          ══════════════════════════════════════════════════════════ */}
          {!isMinimized && (
            <div
              onMouseMove={resetControlsTimer}
              onTouchStart={resetControlsTimer}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl transition-all duration-300 p-0 sm:p-4 select-none"
            >
              {/* ── INCOMING ── */}
              {callState === "incoming" && (
                <div className="call-glass-panel rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-fade-in-up m-4 border border-white/15">
                  <div className="relative inline-block">
                    <div className="absolute -inset-3 rounded-full bg-primary/30 animate-ping opacity-75" />
                    <div className="absolute -inset-6 rounded-full bg-primary/10 animate-pulse" />
                    <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                      className="size-28 rounded-full object-cover relative z-10 border-4 border-primary shadow-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-wide">
                      {targetUser?.firstName} {targetUser?.lastName}
                    </h3>
                    <p className="text-xs text-primary font-semibold mt-2 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Volume2 className="size-4 animate-bounce text-primary" />
                      Incoming {callType === "video" ? "Video" : "Voice"} Call
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-8 pt-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <button onClick={rejectCall}
                        className="btn btn-circle bg-error hover:bg-error/90 text-white size-16 shadow-2xl call-control-btn border-none">
                        <PhoneOff className="size-7" />
                      </button>
                      <span className="text-xs text-white/60 font-medium">Decline</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <button onClick={acceptCall}
                        className="btn btn-circle bg-success hover:bg-success/90 text-white size-16 shadow-2xl call-control-btn border-none animate-bounce">
                        <Phone className="size-7" />
                      </button>
                      <span className="text-xs text-white/60 font-medium">Accept</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CALLING / OUTGOING ── */}
              {callState === "calling" && (
                <div className="call-glass-panel rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-fade-in-up m-4 border border-white/15">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 rounded-full bg-primary/20 animate-pulse" />
                    <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                      className="size-28 rounded-full object-cover relative z-10 border-4 border-white/20 shadow-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-wide">
                      {targetUser?.firstName} {targetUser?.lastName}
                    </h3>
                    <p className="text-xs text-primary font-semibold mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                      <PhoneCall className="size-4 animate-bounce text-primary" />
                      Ringing...
                    </p>
                  </div>
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <button onClick={endCall}
                      className="btn btn-circle bg-error hover:bg-error/90 text-white size-16 shadow-2xl call-control-btn border-none">
                      <PhoneOff className="size-7" />
                    </button>
                    <span className="text-xs text-white/60 font-medium">Cancel</span>
                  </div>
                </div>
              )}

              {/* ── CONNECTED ── */}
              {callState === "connected" && (
                <div className="relative w-full h-full sm:max-w-5xl sm:h-[88vh] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-white/10">

                  {/* Header overlay */}
                  <div className={`absolute top-4 left-4 right-4 z-30 flex items-center justify-between transition-all duration-300 ${
                    isControlsVisible || callType === "audio" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                  }`}>
                    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/15 shadow-xl">
                      <span className="size-2.5 rounded-full bg-success animate-pulse" />
                      <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[130px] sm:max-w-xs">
                        {targetUser?.firstName} {targetUser?.lastName}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {formatCallDuration(callDuration)}
                      </span>
                      <span className="hidden md:flex text-[11px] text-slate-400 items-center gap-1.5 border-l border-white/10 pl-2">
                        <ShieldCheck className="size-3.5 text-emerald-400" />
                        HD Encrypted
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMinimized}
                        className="p-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl text-white/80 hover:text-white border border-white/15 shadow-xl call-control-btn"
                        title="Minimize">
                        <ChevronDown className="size-5" />
                      </button>
                      <button onClick={toggleFullscreenMode}
                        className="hidden sm:flex p-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl text-white/80 hover:text-white border border-white/15 shadow-xl call-control-btn"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
                      </button>
                    </div>
                  </div>

                  {/* ── Main stage ── */}
                  <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">

                    {callType === "video" ? (
                      /* ── VIDEO CALL ── */
                      <div className="relative w-full h-full">
                        {/* MAIN view */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                          {/* Remote video (default main) */}
                          <video ref={setRemoteVideoRef} autoPlay playsInline
                            className={`w-full h-full object-cover ${isSwappedVideo ? "hidden" : "block"}`} />
                          {/* Local video (main when swapped) */}
                          <video ref={setLocalVideoRef} autoPlay playsInline muted
                            className={`w-full h-full object-cover ${isSwappedVideo ? "block" : "hidden"}`} />
                          {/* Camera-off placeholder */}
                          {isVideoOff && (
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4">
                              <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                                className="size-28 rounded-full object-cover border-4 border-white/10 shadow-2xl" />
                              <p className="text-sm font-medium text-slate-300">Camera turned off</p>
                            </div>
                          )}
                        </div>

                        {/* PiP thumbnail */}
                        <div onClick={toggleSwappedVideo}
                          className="absolute top-16 right-4 sm:top-20 sm:right-6 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-900 z-20 cursor-pointer group hover:scale-105 transition-transform"
                          title="Tap to swap main / PiP view">
                          {/* PiP: local self-view by default, remote when swapped */}
                          <video
                            ref={isSwappedVideo ? setRemoteVideoRef : setLocalVideoRef}
                            autoPlay playsInline muted
                            className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                          />
                          {isVideoOff && (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                              <VideoOff className="size-7" />
                              <span className="text-[10px] mt-1">Camera Off</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            Swap view
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── VOICE CALL ── */
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                        {/* Ambient blurred background */}
                        <img src={targetUser?.profilePic || avatar} alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125" />
                        <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md w-full">
                          {/* Glowing avatar */}
                          <div className="relative">
                            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary via-indigo-500 to-cyan-400 opacity-60 animate-call-ring blur-md" />
                            <div className="absolute -inset-8 rounded-full bg-primary/20 animate-pulse" />
                            <img src={targetUser?.profilePic || avatar} alt={targetUser?.firstName}
                              className="size-32 sm:size-40 rounded-full object-cover border-4 border-white/20 shadow-2xl relative z-10" />
                          </div>
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                              {targetUser?.firstName} {targetUser?.lastName}
                            </h3>
                            <p className="text-sm font-mono text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1.5">
                              <Sparkles className="size-4 text-emerald-400 animate-pulse" />
                              HD Voice Connected • {formatCallDuration(callDuration)}
                            </p>
                          </div>
                          {/* Equalizer bars */}
                          <div className="flex items-end justify-center gap-1.5 h-10 px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            {[0.3, 0.7, 1.0, 0.5, 0.9, 0.4, 0.8, 0.6, 0.9].map((h, idx) => (
                              <div key={idx}
                                className="w-1.5 rounded-full bg-gradient-to-t from-primary to-cyan-400 animate-sound-wave"
                                style={{ height: `${h * 32}px`, animationDelay: `${idx * 0.12}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom controls */}
                  <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 pointer-events-auto ${
                    isControlsVisible || callType === "audio"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6 pointer-events-none"
                  }`}>
                    <div className="call-glass-panel px-4 py-3 rounded-full flex items-center gap-3 sm:gap-5 shadow-2xl border border-white/20">
                      {/* Mic */}
                      <button onClick={toggleAudio}
                        className={`p-3 sm:p-4 rounded-full call-control-btn ${isMuted ? "bg-error text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                        title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <MicOff className="size-5 sm:size-6" /> : <Mic className="size-5 sm:size-6" />}
                      </button>
                      {/* Camera toggle */}
                      {callType === "video" && (
                        <button onClick={toggleVideo}
                          className={`p-3 sm:p-4 rounded-full call-control-btn ${isVideoOff ? "bg-error text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                          title={isVideoOff ? "Camera On" : "Camera Off"}>
                          {isVideoOff ? <VideoOff className="size-5 sm:size-6" /> : <Video className="size-5 sm:size-6" />}
                        </button>
                      )}
                      {/* Camera flip */}
                      {callType === "video" && (
                        <button onClick={switchCamera}
                          className="p-3 sm:p-4 rounded-full bg-white/10 text-white hover:bg-white/20 call-control-btn"
                          title="Flip Camera">
                          <RefreshCw className="size-5 sm:size-6" />
                        </button>
                      )}
                      {/* Screen share (desktop) */}
                      {callType === "video" && (
                        <button onClick={toggleScreenShare}
                          className={`hidden sm:flex p-3 sm:p-4 rounded-full call-control-btn ${isScreenSharing ? "bg-primary text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}>
                          <Monitor className="size-5 sm:size-6" />
                        </button>
                      )}
                      {/* End call */}
                      <button onClick={endCall}
                        className="p-3.5 sm:p-4 rounded-full bg-error hover:bg-error/90 text-white shadow-xl call-control-btn border-none"
                        title="End Call">
                        <PhoneOff className="size-6 sm:size-7" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CallModal;
