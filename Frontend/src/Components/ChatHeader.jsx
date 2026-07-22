import React, { useState } from "react";
import { X, Phone, Video, ArrowLeft, Search, MoreVertical, BellOff } from "lucide-react";
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
  const [isMuted, setIsMuted] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser?._id);
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
    <div className="p-3 px-4 border-b border-base-300 bg-base-100/50 backdrop-blur-md flex items-center justify-between flex-shrink-0 transition-colors duration-300 relative z-30">
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

      {/* Right: Action buttons (Search, Video Call, Voice Call, 3-Dots Menu) */}
      <div className="flex items-center gap-1">
        {/* Quick Search Button */}
        <button
          onClick={toggleSearch}
          className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Search in chat"
        >
          <Search className="size-4" />
        </button>

        {/* Video Call */}
        <button
          onClick={() => startCall(selectedUser, "video")}
          className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Video Call"
        >
          <Video className="size-4" />
        </button>

        {/* Voice Call */}
        <button
          onClick={() => startCall(selectedUser, "audio")}
          className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Voice Call"
        >
          <Phone className="size-4" />
        </button>

        {/* WhatsApp 3-Dots Menu Trigger */}
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors"
          title="More options"
        >
          <MoreVertical className="size-4" />
        </button>

        {/* Close Chat (Desktop) */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden lg:flex btn btn-sm btn-ghost btn-circle text-error/70 hover:text-error hover:bg-error/10 transition-colors"
          title="Close Chat"
        >
          <X className="size-4" />
        </button>
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
