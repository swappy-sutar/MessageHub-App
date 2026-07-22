import React, { useEffect, useRef } from "react";
import {
  Info,
  Reply,
  Copy,
  Download,
  CornerUpRight,
  Trash2,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

const MessageContextMenu = ({
  message,
  position,
  onClose,
  onOpenInfo,
  onReply,
  onForward,
  onDelete,
}) => {
  const menuRef = useRef(null);

  // Close menu on click outside
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
      toast.success("Text copied to clipboard!");
    } else {
      toast.error("No text to copy");
    }
    onClose();
  };

  const handleDownload = () => {
    if (message.image) {
      const link = document.createElement("a");
      link.href = message.image;
      link.download = `messagehub_image_${Date.now()}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloading image...");
    } else {
      toast.error("No image attachment found");
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: `${Math.min(position.y, window.innerHeight - 380)}px`,
        left: `${Math.min(position.x, window.innerWidth - 220)}px`,
      }}
      className="fixed z-50 bg-base-100 text-base-content border border-base-300 rounded-2xl w-52 py-2 shadow-2xl animate-fade-in text-sm font-sans transition-colors duration-300"
    >
      {/* 1. Message Info */}
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

      {/* 2. Reply */}
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

      {/* 3. Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Copy className="size-4 text-base-content/70" />
        <span>Copy</span>
      </button>

      {/* 4. Download (for images) */}
      {message.image && (
        <button
          type="button"
          onClick={handleDownload}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
        >
          <Download className="size-4 text-base-content/70" />
          <span>Download</span>
        </button>
      )}

      {/* 5. Forward */}
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

      {/* 6. Star */}
      <button
        type="button"
        onClick={() => {
          toast.success("Message starred!");
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Star className="size-4 text-base-content/70" />
        <span>Star</span>
      </button>

      <div className="h-[1px] bg-base-300 my-1" />

      {/* 7. Delete */}
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
