import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  CornerUpRight,
  X,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Star,
  Pin,
  Smile,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
} from "lucide-react";
import { formatMessageTime, formatMessageDate } from "../utils/formatMessageTime";
import { useChatStore } from "../store/useChatStore";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";

const MediaLightboxModal = ({
  message,
  onClose,
  onForward,
  currentUserId,
  selectedUser,
}) => {
  const { messages, sendMessage, setReplyingTo, pinMessage } = useChatStore();
  const [replyText, setReplyText] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Extract all media messages from chat history
  const allMediaMessages = (messages || []).filter(
    (m) => !m.deletedForEveryone && (m.image || m.video)
  );

  const initialIndex = allMediaMessages.findIndex(
    (m) => String(m._id) === String(message?._id)
  );
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const currentMedia = allMediaMessages[currentIndex] || message;

  useEffect(() => {
    // Reset zoom and rotation on slide change
    setZoomLevel(1);
    setRotation(0);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, allMediaMessages.length]);

  if (!currentMedia || (!currentMedia.image && !currentMedia.video)) return null;

  const mediaUrl = currentMedia.image || currentMedia.video;
  const isMine = String(currentMedia.senderId) === String(currentUserId);
  const senderName = isMine
    ? "You"
    : `${selectedUser?.firstName || "Contact"} ${selectedUser?.lastName || ""}`.trim();
  const senderPic = isMine
    ? (useChatStore.getState().authUser?.data?.profilePic || useChatStore.getState().authUser?.profilePic || avatar)
    : (selectedUser?.profilePic || avatar);

  const formattedDate = `${formatMessageDate(currentMedia.createdAt)} at ${formatMessageTime(currentMedia.createdAt)}`;

  const isVideo =
    typeof mediaUrl === "string" &&
    (mediaUrl.endsWith(".mp4") ||
      mediaUrl.endsWith(".webm") ||
      mediaUrl.endsWith(".mov") ||
      mediaUrl.includes("video"));

  const handlePrev = () => {
    if (allMediaMessages.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allMediaMessages.length - 1));
  };

  const handleNext = () => {
    if (allMediaMessages.length === 0) return;
    setCurrentIndex((prev) => (prev < allMediaMessages.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = async (mediaTargetUrl) => {
    const target = mediaTargetUrl || mediaUrl;
    try {
      const response = await fetch(target);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `media_${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Media downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download media.");
    }
  };

  const handleQuickReply = async (textToSend) => {
    const text = textToSend || replyText;
    if (!text.trim()) return;

    setReplyingTo(currentMedia);
    const formData = new FormData();
    formData.append("text", text);
    formData.append(
      "replyTo",
      JSON.stringify({
        messageId: currentMedia._id,
        senderName,
        text: currentMedia.text || (isVideo ? "🎥 Video" : "📷 Photo"),
      })
    );

    try {
      await sendMessage(formData);
      setReplyText("");
      setShowEmojiPicker(false);
      toast.success("Reply sent!");
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-fade-in text-white overflow-hidden font-sans">

      {/* ══════════════════════════════════════════════════════════════
          1. TOP CONTROL BAR TOOLBAR (Matching WhatsApp Web Screenshot)
      ══════════════════════════════════════════════════════════════ */}
      <div className="h-16 px-4 sm:px-6 bg-[#111b21] border-b border-white/10 flex items-center justify-between flex-shrink-0 z-30 shadow-md">
        {/* Left: Sender Avatar, Name, Timestamp */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close viewer"
          >
            <ArrowLeft className="size-5" />
          </button>

          <img
            src={senderPic}
            alt={senderName}
            className="size-9 rounded-full object-cover border border-white/20"
          />

          <div className="flex flex-col">
            <span className="font-bold text-sm text-white leading-snug">
              {senderName}
            </span>
            <span className="text-[11px] text-white/60 font-mono">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Right Toolbar Controls: Zoom, Rotate, Star, Pin, Reaction, Forward, Download, Close */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="size-4.5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="size-4.5" />
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Rotate"
          >
            <RotateCw className="size-4.5" />
          </button>

          <div className="h-5 w-[1px] bg-white/15 mx-1" />

          {/* Star */}
          <button
            type="button"
            onClick={() => toast("Starred media")}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Star message"
          >
            <Star className="size-4.5" />
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={() => pinMessage(currentMedia._id)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Pin message"
          >
            <Pin className="size-4.5" />
          </button>

          {/* Emoji Reactions Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
              showEmojiPicker ? "text-emerald-400 bg-white/10" : "text-white/70 hover:text-white"
            }`}
            title="React with emoji"
          >
            <Smile className="size-4.5" />
          </button>

          {/* Forward */}
          <button
            type="button"
            onClick={() => {
              if (onForward) onForward(currentMedia);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Forward media"
          >
            <CornerUpRight className="size-4.5" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={() => handleDownload()}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Download media"
          >
            <Download className="size-4.5" />
          </button>

          <div className="h-5 w-[1px] bg-white/15 mx-1" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN MEDIA VIEWPORT WITH PREV/NEXT NAVIGATION ARROWS
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative w-full h-full p-4 flex items-center justify-center overflow-hidden">
        {/* Left Arrow Navigation Button */}
        {allMediaMessages.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 z-30 size-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
            title="Previous media (Left Arrow)"
          >
            <ChevronLeft className="size-7" />
          </button>
        )}

        {/* Media Container */}
        <div
          className="relative max-h-[72vh] max-w-[90vw] flex items-center justify-center transition-all duration-300 ease-out"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Media content"
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-200"
            />
          )}
        </div>

        {/* Right Arrow Navigation Button */}
        {allMediaMessages.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 z-30 size-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
            title="Next media (Right Arrow)"
          >
            <ChevronRight className="size-7" />
          </button>
        )}

        {/* Emoji Quick Picker Floating Bar */}
        {showEmojiPicker && (
          <div className="absolute bottom-6 bg-[#111b21] border border-white/20 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl animate-fade-in z-40">
            {["❤️", "😂", "😮", "😢", "🙏", "👍", "🔥", "🎉"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReply(emoji)}
                className="text-xl hover:scale-125 transition-transform active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. BOTTOM THUMBNAIL CAROUSEL STRIP (Matching Image 3)
      ══════════════════════════════════════════════════════════════ */}
      {allMediaMessages.length > 0 && (
        <div className="h-20 bg-[#0f1418] border-t border-white/10 flex items-center justify-center px-4 py-2 z-20 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 scrollbar-none">
            {allMediaMessages.map((item, idx) => {
              const isActive = idx === currentIndex;
              const itemUrl = item.image || item.video;
              const itemIsVideo =
                typeof itemUrl === "string" &&
                (itemUrl.endsWith(".mp4") || itemUrl.endsWith(".webm") || itemUrl.includes("video"));

              return (
                <div
                  key={item._id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative size-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-200 group border ${
                    isActive
                      ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0b141a] scale-105 opacity-100 border-emerald-500"
                      : "opacity-60 hover:opacity-100 hover:scale-105 border-white/10"
                  }`}
                >
                  {itemIsVideo ? (
                    <video src={itemUrl} className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <img
                      src={itemUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Video Badge */}
                  {itemIsVideo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="size-3 text-white fill-white" />
                    </div>
                  )}

                  {/* Download Overlay Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(itemUrl);
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Download item"
                  >
                    <Download className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default MediaLightboxModal;
