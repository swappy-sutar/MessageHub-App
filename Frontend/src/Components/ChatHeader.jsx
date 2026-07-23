import React, { useState, useRef, useEffect } from "react";
import { X, Phone, Video, ArrowLeft, MoreVertical, BellOff, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import ChatHeaderMenu from "./ChatHeaderMenu";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers, toggleContactInfo, toggleSearch } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall } = useCallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showCallDropdown, setShowCallDropdown] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const callDropdownRef = useRef(null);

  // Close call dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        callDropdownRef.current &&
        !callDropdownRef.current.contains(event.target)
      ) {
        setShowCallDropdown(false);
      }
    };

    if (showCallDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallDropdown]);

  const isOnline = Boolean(
    selectedUser?._id &&
      onlineUsers.some((id) => String(id) === String(selectedUser._id))
  );
  const isTyping = typingUsers[selectedUser?._id];

  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    toast.success(
      nextState
        ? `Notifications muted for ${selectedUser?.firstName}`
        : `Notifications unmuted for ${selectedUser?.firstName}`
    );
  };

  return (
    <div className="p-3 px-4 border-b border-base-300 bg-base-100 flex items-center justify-between flex-shrink-0 transition-colors duration-300 relative z-30">
      {/* Left: Back Button + Avatar + Info */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setSelectedUser(null)}
          className="lg:hidden btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-base-content"
          title="Back to contacts"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div
          onClick={toggleContactInfo}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Click to view contact info"
        >
          <div className="relative">
            <img
              src={selectedUser?.profilePic || avatar}
              alt={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
              className="size-10 rounded-full object-cover border border-base-300 group-hover:scale-105 transition-transform"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-base-100 online-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </h3>
              {isMuted && <BellOff className="size-3 text-[#8696a0]" />}
            </div>

            {isTyping ? (
              <p className="text-xs font-semibold text-success animate-pulse italic">
                typing...
              </p>
            ) : (
              <p className={`text-xs flex items-center gap-1 ${isOnline ? "text-success" : "text-base-content/50"}`}>
                <span className={`size-1.5 rounded-full inline-block ${isOnline ? "bg-success" : "bg-base-content/30"}`} />
                {isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action buttons (Call Dropdown Pill, 3-Dots Menu, Red X) */}
      <div className="flex items-center gap-2">
        {/* WhatsApp Call Dropdown Pill Button */}
        <div className="relative" ref={callDropdownRef}>
          <button
            onClick={() => setShowCallDropdown((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-base-200/80 hover:bg-base-300 border border-base-300/50 text-base-content/80 hover:text-base-content transition-all cursor-pointer group shadow-sm"
            title="Video call options"
          >
            <Video className="size-5 group-hover:text-primary transition-colors" />
            <ChevronDown className="size-4 text-base-content/60 group-hover:text-base-content transition-transform duration-200" />
          </button>

          {/* Call Options Tooltip Popover */}
          {showCallDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-base-100 border border-base-300 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setShowCallDropdown(false);
                  startCall(selectedUser, "video");
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
              >
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Video className="size-4" />
                </div>
                <div className="text-left">
                  <div>Video Call</div>
                  <div className="text-[10px] text-base-content/50 font-normal">HD video call</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCallDropdown(false);
                  startCall(selectedUser, "audio");
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
              >
                <div className="size-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <Phone className="size-4" />
                </div>
                <div className="text-left">
                  <div>Voice Call</div>
                  <div className="text-[10px] text-base-content/50 font-normal">Clear audio call</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 3-Dots Menu Trigger with Tooltip */}
        <div className="tooltip tooltip-bottom" data-tip="More options">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="btn btn-md btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MoreVertical className="size-5" />
          </button>
        </div>

        {/* Close Chat Button with Red X Icon and Tooltip */}
        <div className="tooltip tooltip-bottom hidden lg:block" data-tip="Close chat">
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-md btn-ghost btn-circle hover:bg-red-500/10 transition-colors"
          >
            <X className="size-5 text-red-500 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* WhatsApp 3-Dots Dropdown Popover */}
      {showMenu && (
        <ChatHeaderMenu
          onClose={() => setShowMenu(false)}
          onOpenSearch={toggleSearch}
          onSelectMessages={() => toast("Select messages mode active!")}
          onToggleMute={handleToggleMute}
          onOpenContactInfo={toggleContactInfo}
          isMuted={isMuted}
        />
      )}
    </div>
  );
};

export default ChatHeader;
