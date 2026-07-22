import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Send, RotateCcw, Trash2, SwitchCamera, Sparkles } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="size-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-base-content">
              {capturedImage ? "Photo Preview" : "Take Photo"}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-base-300 text-base-content/70 hover:text-base-content transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Camera Viewport / Captured Preview */}
        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {isCameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2">
                  <span className="loading loading-spinner loading-md text-primary" />
                  <span className="text-xs">Initializing camera...</span>
                </div>
              )}

              {/* Camera Flip Button */}
              <button
                onClick={toggleFacingMode}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors"
                title="Switch camera"
              >
                <RotateCcw className="size-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer Actions: Send / Discard Options */}
        <div className="p-5 bg-base-100 flex flex-col gap-4">
          {capturedImage ? (
            <>
              {/* Recipient Selection Dropdown if no chat thread is currently active */}
              {!selectedUser && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-semibold text-base-content/70">
                      SELECT RECIPIENT CONTACT
                    </span>
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="select select-bordered select-sm w-full rounded-xl bg-base-200 text-xs text-base-content"
                  >
                    <option value="">-- Choose a contact --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons: Discard / Retake vs Send */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscardPhoto}
                  className="flex-1 btn btn-outline btn-error rounded-2xl gap-2 text-sm font-semibold"
                >
                  <Trash2 className="size-4" /> Discard
                </button>

                <button
                  type="button"
                  onClick={handleSendPhoto}
                  className="flex-1 btn btn-success text-white rounded-2xl gap-2 shadow-lg hover:scale-[1.02] transition-transform text-sm font-bold"
                >
                  <Send className="size-4" /> Send Photo
                </button>
              </div>
            </>
          ) : (
            /* Snap Shutter Button */
            <div className="flex items-center justify-center py-2">
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="size-16 rounded-full bg-white border-4 border-primary shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center group"
                title="Snap Photo"
              >
                <div className="size-12 rounded-full bg-primary group-hover:bg-primary-focus transition-colors flex items-center justify-center text-white">
                  <Camera className="size-6" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
