import React, { useEffect, useRef } from "react";
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
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    initCallListeners,
  } = useCallStore();

  const socket = useAuthStore((state) => state.socket);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Initialize socket signaling listeners when socket connects
  useEffect(() => {
    if (socket) {
      initCallListeners();
    }
  }, [socket, initCallListeners]);

  // Bind streams to video and audio elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.error("Remote video play error:", e));
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((e) => console.error("Remote audio play error:", e));
    }
  }, [remoteStream]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300 p-0 sm:p-4">
      {/* ── INCOMING CALL MODAL ── */}
      {callState === "incoming" && (
        <div className="bg-base-100 border border-base-300 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-fade-in-up m-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <img
              src={targetUser?.profilePic || avatar}
              alt={targetUser?.firstName}
              className="size-24 rounded-full object-cover relative z-10 border-4 border-primary shadow-xl"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold text-base-content">
              {targetUser?.firstName} {targetUser?.lastName}
            </h3>
            <p className="text-xs text-primary font-semibold mt-1 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Volume2 className="size-4 animate-bounce text-primary" />
              Incoming {callType === "video" ? "Video" : "Voice"} Call...
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              onClick={rejectCall}
              className="btn btn-error btn-circle size-14 shadow-lg hover:scale-110 transition-transform"
              title="Decline"
            >
              <PhoneOff className="size-6 text-white" />
            </button>

            <button
              onClick={acceptCall}
              className="btn btn-success btn-circle size-14 shadow-lg hover:scale-110 transition-transform animate-bounce"
              title="Accept"
            >
              <Phone className="size-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── CALLING (OUTGOING) MODAL ── */}
      {callState === "calling" && (
        <div className="bg-base-100 border border-base-300 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-fade-in-up m-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
            <img
              src={targetUser?.profilePic || avatar}
              alt={targetUser?.firstName}
              className="size-24 rounded-full object-cover relative z-10 border-4 border-base-300 shadow-xl"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold text-base-content">
              {targetUser?.firstName} {targetUser?.lastName}
            </h3>
            <p className="text-xs text-base-content/60 mt-1 flex items-center justify-center gap-1">
              <PhoneCall className="size-3.5 animate-bounce text-primary" />
              Ringing...
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={endCall}
              className="btn btn-error btn-circle size-14 shadow-lg hover:scale-110 transition-transform"
              title="Cancel Call"
            >
              <PhoneOff className="size-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONNECTED CALL VIEW ── */}
      {callState === "connected" && (
        <div className="relative w-full h-full sm:max-w-4xl sm:h-[85vh] bg-base-300 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-base-300">
          {/* Header Info Overlay */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 bg-base-100/80 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-base-300 shadow-lg">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-base-content truncate max-w-[120px] sm:max-w-none">
              {targetUser?.firstName} {targetUser?.lastName}
            </span>
            <span className="text-xs font-mono text-primary font-bold">
              {formatCallDuration(callDuration)}
            </span>
            <span className="hidden sm:flex text-[10px] text-base-content/50 items-center gap-1">
              <ShieldCheck className="size-3 text-success" />
              HD Encrypted
            </span>
          </div>

          {/* Main Video / Voice View */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {callType === "video" ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              /* Voice Call Screen with Animated Audio Equalizer Bars */
              <div className="flex flex-col items-center justify-center space-y-6 text-center">
                <audio ref={remoteAudioRef} autoPlay playsInline />

                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-125" />
                  <img
                    src={targetUser?.profilePic || avatar}
                    alt={targetUser?.firstName}
                    className="size-28 sm:size-32 rounded-full object-cover border-4 border-primary shadow-2xl relative z-10"
                  />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {targetUser?.firstName} {targetUser?.lastName}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono mt-1">
                    {formatCallDuration(callDuration)}
                  </p>
                </div>

                {/* Animated Equalizer Sound Waves */}
                <div className="flex items-center gap-1.5 h-6">
                  {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-primary animate-pulse"
                      style={{
                        height: `${h * 24}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* PiP Local Video (Only for Video Calls) */}
            {callType === "video" && (
              <div className="absolute top-4 right-4 w-28 h-40 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900 z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-base-200">
                    <VideoOff className="size-6 sm:size-8 text-base-content/40" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Footer Bar */}
          <div className="p-3 sm:p-4 bg-base-100/90 backdrop-blur-md flex items-center justify-center gap-3 sm:gap-4 border-t border-base-300 z-30">
            {/* Audio Mute Toggle */}
            <button
              onClick={toggleAudio}
              className={`btn btn-circle ${
                isMuted ? "btn-error" : "btn-ghost border border-base-300"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? (
                <MicOff className="size-5 text-white" />
              ) : (
                <Mic className="size-5 text-base-content" />
              )}
            </button>

            {/* Video Camera Toggle (Video Calls) */}
            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`btn btn-circle ${
                  isVideoOff ? "btn-error" : "btn-ghost border border-base-300"
                }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isVideoOff ? (
                  <VideoOff className="size-5 text-white" />
                ) : (
                  <Video className="size-5 text-base-content" />
                )}
              </button>
            )}

            {/* Screen Share Button (Video Calls) */}
            {callType === "video" && (
              <button
                onClick={toggleScreenShare}
                className={`btn btn-circle ${
                  isScreenSharing ? "btn-primary" : "btn-ghost border border-base-300"
                }`}
                title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              >
                <Monitor className="size-5 text-base-content" />
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="btn btn-error btn-circle size-12 shadow-lg hover:scale-105 transition-transform"
              title="End Call"
            >
              <PhoneOff className="size-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallModal;
