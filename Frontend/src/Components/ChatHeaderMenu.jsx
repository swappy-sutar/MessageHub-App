import React, { useEffect, useRef } from "react";
import { Search, CheckSquare, BellOff, User } from "lucide-react";

const ChatHeaderMenu = ({
  onClose,
  onOpenSearch,
  onSelectMessages,
  onToggleMute,
  onOpenContactInfo,
  isMuted,
}) => {
  const menuRef = useRef(null);

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

  return (
    <div
      ref={menuRef}
      className="absolute top-14 right-4 z-50 bg-base-100 text-base-content border border-base-300 rounded-2xl w-60 py-2 shadow-2xl animate-fade-in text-sm font-sans transition-colors duration-300"
    >
      {/* 1. Search */}
      <button
        type="button"
        onClick={() => {
          if (onOpenSearch) onOpenSearch();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <Search className="size-4 text-primary" />
        <span>Search</span>
      </button>

      {/* 2. Select messages */}
      <button
        type="button"
        onClick={() => {
          if (onSelectMessages) onSelectMessages();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <CheckSquare className="size-4 text-base-content/70" />
        <span>Select messages</span>
      </button>

      {/* 3. Mute notifications */}
      <button
        type="button"
        onClick={() => {
          if (onToggleMute) onToggleMute();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-base-200 transition-colors text-left font-medium"
      >
        <div className="flex items-center gap-3">
          <BellOff className={`size-4 ${isMuted ? "text-error" : "text-base-content/70"}`} />
          <span>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
        </div>
        <span className="text-xs opacity-50">▶</span>
      </button>

      <div className="h-[1px] bg-base-300 my-1" />

      {/* 4. Contact info */}
      <button
        type="button"
        onClick={() => {
          if (onOpenContactInfo) onOpenContactInfo();
          onClose();
        }}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-left font-medium"
      >
        <User className="size-4 text-base-content/70" />
        <span>Contact info</span>
      </button>
    </div>
  );
};

export default ChatHeaderMenu;
