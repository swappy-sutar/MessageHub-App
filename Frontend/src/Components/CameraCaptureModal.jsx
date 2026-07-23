import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Send, RotateCcw, Trash2, SwitchCamera, Sparkles } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";

const CameraCaptureModal = ({ isOpen, onClose, onSendCapturedPhoto }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { selectedUser, users, sendMessage, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  // Start webcam stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsCameraLoading(true);
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Unable to access camera: " + (err.message || "Permission denied"));
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleDiscardPhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSendPhoto = async () => {
    if (!capturedImage) return;

    // Convert base64 dataUrl to File
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const photoFile = new File([blob], `camera_photo_${Date.now()}.jpg`, { type: "image/jpeg" });

    if (onSendCapturedPhoto) {
      await onSendCapturedPhoto(photoFile);
      handleClose();
      return;
    }

    // Determine target recipient (active chat or selected recipient from dropdown)
    const targetUser = selectedUser || users.find((u) => String(u._id) === String(selectedRecipientId));

    if (!targetUser) {
      toast.error("Please select a recipient contact to send this photo.");
      return;
    }

    const toastId = toast.loading(`Sending photo to ${targetUser.firstName}...`);
    try {
      const formData = new FormData();
      formData.append("image", photoFile);

      if (!selectedUser) {
        setSelectedUser(targetUser);
      }

      await sendMessage(formData);
      toast.success("Photo sent successfully!", { id: toastId });
      handleClose();
    } catch (err) {
      toast.error("Failed to send photo.", { id: toastId });
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setSelectedRecipientId("");
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-80 lg:top-14 z-[60] bg-[#0b141a] flex flex-col select-none overflow-hidden animate-fade-in border-l border-white/10">
      {/* Top Header Bar */}
      <div className="bg-[#111b21] border-b border-white/10 flex flex-col flex-shrink-0 z-20 text-white">
        {/* Selected Contact Bar (if active chat thread) */}
        {selectedUser && (
          <div className="px-4 sm:px-6 py-2.5 bg-[#182229] border-b border-white/5 flex items-center gap-3">
            <img
              src={selectedUser.profilePic || avatar}
              alt={selectedUser.firstName}
              className="size-8 object-cover rounded-full border border-white/10"
            />
            <span className="font-semibold text-sm text-white flex items-center gap-1.5">
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
          </div>
        )}

        {/* Take Photo Action Header Row */}
        <div className="h-12 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Close camera"
            >
              <X className="size-5" />
            </button>
            <span className="font-semibold text-sm sm:text-base text-white tracking-wide">
              {capturedImage ? "Photo Preview" : "Take photo"}
            </span>
          </div>

          {!capturedImage && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Switch camera"
            >
              <SwitchCamera className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Camera Viewport / Captured Preview Area */}
      <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured preview"
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />

            {isCameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3 z-10">
                <span className="loading loading-spinner loading-lg text-emerald-500" />
                <span className="text-sm font-medium tracking-wide text-white/80">
                  Initializing camera...
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Control Bar */}
      {capturedImage ? (
        <div className="p-4 pb-8 sm:p-6 bg-[#111b21] border-t border-white/10 flex flex-col gap-4 flex-shrink-0 z-20">
          {/* Recipient Selection Dropdown if no active chat */}
          {!selectedUser && (
            <div className="max-w-md mx-auto w-full">
              <label className="block text-xs font-semibold text-white/70 mb-1">
                SELECT RECIPIENT CONTACT
              </label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-white/10 text-white text-xs border-white/20 focus:border-emerald-500"
              >
                <option value="" className="bg-neutral-900 text-white">
                  -- Choose a contact --
                </option>
                {users.map((u) => (
                  <option key={u._id} value={u._id} className="bg-neutral-900 text-white">
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons: Retake / Discard vs Send */}
          <div className="max-w-md mx-auto w-full flex items-center gap-4">
            <button
              type="button"
              onClick={handleDiscardPhoto}
              className="flex-1 btn btn-outline border-white/20 text-white hover:bg-error hover:border-error rounded-2xl gap-2 text-sm font-semibold"
            >
              <Trash2 className="size-4" /> Retake
            </button>

            <button
              type="button"
              onClick={handleSendPhoto}
              className="flex-1 btn bg-[#00a884] hover:bg-[#008f70] text-white border-none rounded-2xl gap-2 shadow-lg text-sm font-bold"
            >
              <Send className="size-4" /> Send Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="py-5 pb-8 sm:py-4 bg-[#111b21] border-t border-white/10 flex flex-col items-center justify-center gap-2.5 flex-shrink-0 z-20 px-4">
          {/* Center Large Green Camera Shutter Button */}
          <button
            type="button"
            onClick={handleCapturePhoto}
            className="size-14 sm:size-16 rounded-full bg-[#00a884] hover:bg-[#008f70] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-[#00a884]/30"
            title="Take Photo"
          >
            <Camera className="size-7 sm:size-8 text-white" />
          </button>

          {/* Mode Indicator Tag */}
          <div className="px-3.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold tracking-wide shadow-sm">
            Photo
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCaptureModal;
