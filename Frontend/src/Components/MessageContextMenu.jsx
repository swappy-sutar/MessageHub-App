import React, { useEffect, useRef } from "react";
import {
  Info,
  Reply,
  Copy,
  Download,
  CornerUpRight,
  Trash2,
  Star,
  Pin,
  Edit3,
} from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const MessageContextMenu = ({
  message,
  position,
  isMine,
  onClose,
  onOpenInfo,
  onReply,
  onForward,
  onDelete,
}) => {
  const menuRef = useRef(null);
  const { addReaction, pinMessage, setEditingMessage } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Text copied!");
    } else {
      toast.error("No text to copy");
    }
    onClose();
  };

  const handleDownload = () => {
    const url = message.image || message.video || message.document?.url;
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = message.document?.name || `attachment_${Date.now()}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloading attachment...");
    } else {
      toast.error("No media attachment found");
    }
    onClose();
  };

  const handleReactionClick = (emoji) => {
    addReaction(message._id, emoji);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: `${Math.min(position.y, window.innerHeight - 440)}px`,
        left: `${Math.min(position.x, window.innerWidth - 240)}px`,
      }}
      className="fixed z-50 bg-base-100 text-base-content border border-base-300 rounded-2xl w-56 py-2 shadow-2xl animate-fade-in text-sm font-sans transition-colors duration-300"
    >
      {/* Quick Reaction Emoji Row */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-base-300 mb-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReactionClick(emoji)}
            className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-base-200"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Info */}
      <button
        type="button"
        onClick={() => {
          if (onOpenInfo) onOpenInfo();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Info className="size-4 text-primary" />
        <span>Message info</span>
      </button>

      {/* Edit (Own text messages only) */}
      {isMine && message.text && !message.deletedForEveryone && (
        <button
          type="button"
          onClick={() => {
            setEditingMessage(message);
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
        >
          <Edit3 className="size-4 text-warning" />
          <span>Edit message</span>
        </button>
      )}

      {/* Pin / Unpin */}
      <button
        type="button"
        onClick={() => {
          pinMessage(message._id);
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Pin className="size-4 text-primary rotate-45" />
        <span>{message.pinnedAt ? "Unpin message" : "Pin message"}</span>
      </button>

      {/* Reply */}
      <button
        type="button"
        onClick={() => {
          if (onReply) onReply();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Reply className="size-4 text-base-content/70" />
        <span>Reply</span>
      </button>

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Copy className="size-4 text-base-content/70" />
        <span>Copy</span>
      </button>

      {/* Download */}
      {(message.image || message.video || message.document) && (
        <button
          type="button"
          onClick={handleDownload}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
        >
          <Download className="size-4 text-base-content/70" />
          <span>Download</span>
        </button>
      )}

      {/* Forward */}
      <button
        type="button"
        onClick={() => {
          if (onForward) onForward();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <CornerUpRight className="size-4 text-base-content/70" />
        <span>Forward</span>
      </button>

      <div className="h-[1px] bg-base-300 my-1" />

      {/* Delete */}
      <button
        type="button"
        onClick={() => {
          if (onDelete) onDelete();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-error/10 text-error transition-colors text-left font-medium"
      >
        <Trash2 className="size-4 text-error" />
        <span>Delete</span>
      </button>
    </div>
  );
};

export default MessageContextMenu;
