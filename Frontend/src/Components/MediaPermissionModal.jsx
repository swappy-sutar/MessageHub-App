import React, { useState } from "react";
import { Mic, Video, MicOff, VideoOff, ShieldCheck, AlertTriangle, RefreshCw, X } from "lucide-react";

/**
 * MediaPermissionModal
 *
 * Shown BEFORE getUserMedia is called so the user understands WHY the browser
 * is about to ask for mic/camera access. Handles 3 states:
 *  - "prompt"  → explain + "Allow" CTA
 *  - "checking"→ spinner while we test the permission
 *  - "denied"  → clear fix instructions per platform
 *
 * Props:
 *  @param {"audio"|"video"} callType   — determines which icons/copy to show
 *  @param {() => void}       onAllow   — called after user clicks Allow & permissions succeed
 *  @param {() => void}       onCancel  — called when user dismisses without granting
 */
const MediaPermissionModal = ({ callType = "video", onAllow, onCancel }) => {
  const [phase, setPhase] = useState("prompt"); // "prompt" | "checking" | "denied"
  const [denialDetail, setDenialDetail] = useState("");
  const isVideo = callType === "video";

  const handleAllow = async () => {
    setPhase("checking");
    try {
      const constraints = {
        audio: true,
        video: isVideo
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the test stream immediately — the real call will re-acquire it
      stream.getTracks().forEach((t) => t.stop());
      onAllow(); // Permissions granted → proceed with call
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setDenialDetail("You denied access. Please enable it in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setDenialDetail(
          isVideo
            ? "No camera or microphone was found on this device."
            : "No microphone was found on this device."
        );
      } else if (err.name === "NotReadableError") {
        setDenialDetail(
          "Your microphone or camera is already in use by another app. Close it and try again."
        );
      } else {
        setDenialDetail(err.message || "An unknown error occurred.");
      }
      setPhase("denied");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-md bg-base-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10">

        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${isVideo ? "bg-gradient-to-r from-indigo-500 to-cyan-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`} />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-base-300" />
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-base-200 transition-colors text-base-content/50 hover:text-base-content"
        >
          <X className="size-5" />
        </button>

        <div className="p-6 sm:p-8">

          {/* ── PROMPT phase ── */}
          {(phase === "prompt" || phase === "checking") && (
            <>
              {/* Icon cluster */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`p-4 rounded-2xl ${isVideo ? "bg-indigo-500/10 text-indigo-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                  <Mic className="size-7" />
                </div>
                {isVideo && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <Video className="size-7" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-base-content text-center mb-2">
                {isVideo ? "Allow Camera & Microphone" : "Allow Microphone Access"}
              </h2>

              <p className="text-sm text-base-content/60 text-center mb-6 leading-relaxed">
                {isVideo
                  ? "MessageHub needs access to your camera and microphone to start the video call. Your media is sent directly to the other person — never through our servers."
                  : "MessageHub needs access to your microphone to start the voice call. Your audio is sent directly to the other person — never through our servers."}
              </p>

              {/* Permission items */}
              <div className="space-y-3 mb-7">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60">
                  <Mic className="size-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-base-content">Microphone</p>
                    <p className="text-xs text-base-content/50">So the other person can hear you</p>
                  </div>
                </div>
                {isVideo && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60">
                    <Video className="size-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-base-content">Camera</p>
                      <p className="text-xs text-base-content/50">So the other person can see you</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-base-content">End-to-End Encrypted</p>
                    <p className="text-xs text-base-content/50">Media never touches our servers</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllow}
                  disabled={phase === "checking"}
                  className={`btn btn-primary w-full rounded-2xl h-12 font-semibold text-base ${phase === "checking" ? "loading" : ""}`}
                >
                  {phase === "checking" ? "Requesting access…" : `Allow & Start ${isVideo ? "Video" : "Voice"} Call`}
                </button>
                <button
                  onClick={onCancel}
                  disabled={phase === "checking"}
                  className="btn btn-ghost w-full rounded-2xl h-12 font-medium text-base-content/60"
                >
                  Not now
                </button>
              </div>
            </>
          )}

          {/* ── DENIED phase ── */}
          {phase === "denied" && (
            <>
              <div className="flex items-center justify-center mb-5">
                <div className="p-4 rounded-2xl bg-error/10 text-error">
                  <AlertTriangle className="size-8" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-base-content text-center mb-2">
                Permission Blocked
              </h2>

              <p className="text-sm text-base-content/60 text-center mb-5 leading-relaxed">
                {denialDetail}
              </p>

              {/* Platform-specific instructions */}
              <div className="bg-base-200/60 rounded-2xl p-4 mb-6 space-y-2.5">
                <p className="text-xs font-bold text-base-content/70 uppercase tracking-widest mb-1">
                  How to fix
                </p>

                {/* Android Chrome */}
                <div className="flex gap-2 items-start">
                  <span className="text-base shrink-0">🤖</span>
                  <p className="text-xs text-base-content/70 leading-snug">
                    <strong>Android:</strong> Tap the lock icon in the address bar → Site settings → Allow Camera &amp; Microphone
                  </p>
                </div>

                {/* iOS Safari */}
                <div className="flex gap-2 items-start">
                  <span className="text-base shrink-0">🍎</span>
                  <p className="text-xs text-base-content/70 leading-snug">
                    <strong>iPhone / iPad:</strong> Settings → Safari → Camera &amp; Microphone → Allow
                  </p>
                </div>

                {/* Desktop Chrome */}
                <div className="flex gap-2 items-start">
                  <span className="text-base shrink-0">🖥️</span>
                  <p className="text-xs text-base-content/70 leading-snug">
                    <strong>Desktop:</strong> Click the camera icon in the address bar → Always allow on this site
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setPhase("prompt")}
                  className="btn btn-primary w-full rounded-2xl h-12 font-semibold gap-2"
                >
                  <RefreshCw className="size-4" />
                  Try Again
                </button>
                <button
                  onClick={onCancel}
                  className="btn btn-ghost w-full rounded-2xl h-12 font-medium text-base-content/60"
                >
                  Cancel Call
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPermissionModal;
