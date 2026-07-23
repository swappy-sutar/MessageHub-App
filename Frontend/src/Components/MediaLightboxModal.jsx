import React, { useState } from "react";
import {
  ArrowLeft,
  Download,
  CornerUpRight,
  X,
  Send,
} from "lucide-react";
import { formatMessageTime, formatMessageDate } from "../utils/formatMessageTime";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const MediaLightboxModal = ({
  message,
  onClose,
  onForward,
  currentUserId,
  selectedUser,
}) => {
  const [replyText, setReplyText] = useState("");
  const { sendMessage, setReplyingTo } = useChatStore();

  if (!message || !message.image) return null;

  const isMine = String(message.senderId) === String(currentUserId);
  const senderName = isMine
    ? "You"
    : `${selectedUser?.firstName || "Contact"} ${selectedUser?.lastName || ""}`.trim();

  const formattedDate = `${formatMessageDate(message.createdAt)}, ${formatMessageTime(message.createdAt)}`;

  const isVideo =
    typeof message.image === "string" &&
    (message.image.endsWith(".mp4") ||
      message.image.endsWith(".webm") ||
      message.image.endsWith(".mov") ||
      message.image.includes("video"));

  const handleDownload = async () => {
    try {
      const response = await fetch(message.image);
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

    setReplyingTo(message);
    const formData = new FormData();
    formData.append("text", text);
    formData.append(
      "replyTo",
      JSON.stringify({
        messageId: message._id,
        senderName,
        text: message.text || "📷 Photo",
      })
    );

    try {
      await sendMessage(formData);
      setReplyText("");
      toast.success("Reply sent!");
      onClose();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fade-in text-white overflow-hidden">
      {/* 1. Top Control Bar (Sender Name, Time, Download, Forward, Close) */}
      <div className="h-16 px-4 sm:px-6 bg-[#111b21] border-b border-white/10 flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Back button + Sender Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close viewer"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base text-white leading-snug">
              {senderName}
            </span>
            <span className="text-[11px] text-white/60 font-mono">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Right: Actions (Download, Forward, Close) */}
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Download media"
          >
            <Download className="size-5" />
          </button>

          {/* Forward Button */}
          <button
            type="button"
            onClick={() => {
              if (onForward) onForward(message);
              onClose();
            }}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Forward media"
          >
            <CornerUpRight className="size-5" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Media Viewport */}
      <div className="flex-1 relative w-full h-full p-4 flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            src={message.image}
            controls
            autoPlay
            className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <img
            src={message.image}
            alt="Media preview"
            className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl animate-fade-in"
          />
        )}
      </div>

      {/* 3. Bottom Control Bar (Quick Reply & Emoji Reactions) */}
      <div className="p-3 sm:p-4 bg-[#111b21] border-t border-white/10 flex items-center gap-3 z-20 max-w-3xl mx-auto w-full">
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickReply();
            }}
            placeholder="Reply..."
            className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/10 text-white text-xs placeholder:text-white/40 border border-white/15 focus:border-emerald-500 focus:outline-none transition-all"
          />

          <button
            type="button"
            onClick={() => handleQuickReply()}
            className="absolute right-2 p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
            title="Send reply"
          >
            <Send className="size-3.5" />
          </button>
        </div>

        {/* Quick Reaction Emojis */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickReply("❤️")}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-transform active:scale-90 cursor-pointer"
            title="React ❤️"
          >
            ❤️
          </button>
          <button
            type="button"
            onClick={() => handleQuickReply("😂")}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-transform active:scale-90 cursor-pointer"
            title="React 😂"
          >
            😂
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaLightboxModal;
