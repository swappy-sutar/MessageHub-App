import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../utils/axios";
import {
  X,
  Image,
  Star,
  Clock,
  Shield,
  Lock,
  ChevronRight,
  Bell,
  Heart,
  FolderPlus,
  MinusCircle,
  Ban,
  ThumbsDown,
  Trash2,
  Edit3,
} from "lucide-react";
import avatar from "../assets/avatar.png";
import toast from "../utils/toast.js";
import MediaGalleryModal from "./MediaGalleryModal";
import MediaLightboxModal from "./MediaLightboxModal";

const ContactInfoPanel = ({ contact, onClose }) => {
  const { messages, setSelectedUser, getMessages } = useChatStore();
  const { authUser } = useAuthStore();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [lightboxMessage, setLightboxMessage] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'clear' | 'delete' | 'block' | null

  if (!contact) return null;

  const currentUserId = authUser?.data?._id || authUser?._id;

  // Filter all shared media
  const sharedMedia = messages.filter((m) => !m.deletedForEveryone && (m.image || m.video));

  const contactDisplayName = contact.firstName
    ? `${contact.firstName} ${contact.lastName || ""}`.trim()
    : contact.name || "Contact";

  // Fetch real privacy & contact status on mount
  useEffect(() => {
    if (!contact?._id) return;
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get(`/user/privacy-status/${contact._id}`);
        if (res.data.success) {
          setIsMuted(res.data.data.isMuted);
          setIsFavourite(res.data.data.isFavourite);
          setIsBlocked(res.data.data.isBlocked);
        }
      } catch (err) {
        console.error("Failed to fetch contact privacy status:", err);
      }
    };
    fetchStatus();
  }, [contact?._id]);

  const handleToggleMute = async () => {
    try {
      const res = await axiosInstance.post(`/user/mute/${contact._id}`);
      if (res.data.success) {
        setIsMuted(res.data.isMuted);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update mute status.");
    }
  };

  const handleToggleFavourite = async () => {
    try {
      const res = await axiosInstance.post(`/user/favourite/${contact._id}`);
      if (res.data.success) {
        setIsFavourite(res.data.isFavourite);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update favourite status.");
    }
  };

  const handleBlockUser = async () => {
    try {
      const res = await axiosInstance.post(`/user/block/${contact._id}`);
      if (res.data.success) {
        setIsBlocked(res.data.isBlocked);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update block status.");
    }
  };

  const handleReportUser = async () => {
    try {
      const res = await axiosInstance.post(`/user/report/${contact._id}`, { reason: "Spam or inappropriate behavior" });
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to submit report.");
    }
  };

  const handleClearChat = async () => {
    try {
      const res = await axiosInstance.delete(`/messages/clear-chat/${contact._id}`);
      if (res.data.success) {
        toast.success("Chat history cleared!");
        getMessages(contact._id);
      }
    } catch (err) {
      toast.error("Failed to clear chat history.");
    }
  };

  const handleDeleteChat = async () => {
    try {
      const res = await axiosInstance.delete(`/messages/delete-chat/${contact._id}`);
      if (res.data.success) {
        toast.success("Chat deleted successfully!");
        getMessages(contact._id);
        setSelectedUser(null);
        if (onClose) onClose();
      }
    } catch (err) {
      toast.error("Failed to delete chat.");
    }
  };

  return (
    <div className="w-full sm:w-[380px] lg:w-[400px] border-l border-base-300 bg-base-100 flex-shrink-0 h-full flex flex-col transition-all duration-300 z-20 font-sans relative">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-100 h-16 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
            title="Close"
          >
            <X className="size-5" />
          </button>
          <h3 className="text-base font-bold text-base-content">Contact info</h3>
        </div>
        <button
          onClick={() => toast("Edit contact details")}
          className="p-1.5 rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
          title="Edit contact"
        >
          <Edit3 className="size-4.5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Large Centered Profile Card */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <img
            src={contact.profilePic || avatar}
            alt={contactDisplayName}
            className="size-28 rounded-full object-cover border-4 border-base-200 shadow-md"
          />
          <div>
            <h2 className="text-xl font-extrabold text-base-content">
              {contactDisplayName}
            </h2>
            <p className="text-xs text-base-content/60 mt-1 font-mono">
              {contact.email}
            </p>
            {contact.inviteCode && (
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
                Code: {contact.inviteCode}
              </span>
            )}
          </div>
        </div>

        <div className="h-[1px] bg-base-300" />

        {/* Media, Links and Docs Section */}
        <div className="space-y-3">
          <div
            onClick={() => setIsMediaModalOpen(true)}
            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Image className="size-5 text-base-content/70 group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                Media, links and docs
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-base-content/60 font-mono">
              <span>{sharedMedia.length}</span>
              <ChevronRight className="size-4 group-hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Thumbnail Gallery Preview */}
          {sharedMedia.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 px-1">
              {sharedMedia.slice(0, 4).map((msg, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxMessage(msg);
                  }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-base-300 shadow-xs hover:scale-105 transition-transform cursor-pointer group"
                >
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="media"
                      className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                    />
                  ) : msg.video ? (
                    <video
                      src={msg.video}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => setIsMediaModalOpen(true)}
              className="p-3 text-center text-xs text-base-content/50 italic bg-base-200/40 rounded-xl cursor-pointer hover:bg-base-200 transition-colors"
            >
              No shared media yet
            </div>
          )}
        </div>

        <div className="h-[1px] bg-base-300" />

        {/* Settings & Privacy Options List */}
        <div className="space-y-1">
          {/* Starred Messages */}
          <div
            onClick={() => toast("Starred messages feature active!")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-sm font-semibold text-base-content"
          >
            <Star className="size-5 text-base-content/70" />
            <span>Starred messages</span>
          </div>

          {/* Mute Notifications Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 transition-colors">
            <div className="flex items-center gap-3.5">
              <Bell className="size-5 text-base-content/70" />
              <span className="text-sm font-semibold text-base-content">Mute notifications</span>
            </div>
            <input
              type="checkbox"
              checked={isMuted}
              onChange={handleToggleMute}
              className="toggle toggle-success toggle-sm"
            />
          </div>

          {/* Disappearing Messages */}
          <div
            onClick={() => toast("Disappearing messages: Off")}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Clock className="size-5 text-base-content/70" />
              <div>
                <p className="text-sm font-semibold text-base-content">Disappearing messages</p>
                <p className="text-xs text-base-content/50">Off</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-base-content/40" />
          </div>

          {/* Advanced Chat Privacy */}
          <div
            onClick={() => toast("Advanced chat privacy: Off")}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Shield className="size-5 text-base-content/70" />
              <div>
                <p className="text-sm font-semibold text-base-content">Advanced chat privacy</p>
                <p className="text-xs text-base-content/50">Off</p>
              </div>
            </div>
          </div>

          {/* End-to-End Encryption */}
          <div
            onClick={() => toast("End-to-end encrypted with Web Crypto SubtleCrypto")}
            className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
          >
            <Lock className="size-5 text-base-content/70 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-base-content">Encryption</p>
              <p className="text-xs text-base-content/50 leading-relaxed mt-0.5">
                Messages are end-to-end encrypted. Click to verify.
              </p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-base-300" />

        {/* Action Buttons Section */}
        <div className="space-y-1">
          <div
            onClick={handleToggleFavourite}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-sm font-semibold text-base-content"
          >
            <Heart className={`size-5 ${isFavourite ? "fill-red-500 text-red-500" : "text-base-content/70"}`} />
            <span>{isFavourite ? "Remove from favourites" : "Add to favourites"}</span>
          </div>

          <div
            onClick={() => toast("Added contact to list")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-sm font-semibold text-base-content"
          >
            <FolderPlus className="size-5 text-base-content/70" />
            <span>Add to list</span>
          </div>

          {/* Clear Chat Button */}
          <div
            onClick={() => setConfirmAction("clear")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
          >
            <MinusCircle className="size-5" />
            <span>Clear chat</span>
          </div>

          {/* Block User Button */}
          <div
            onClick={() => setConfirmAction("block")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
          >
            <Ban className="size-5" />
            <span>{isBlocked ? `Unblock ${contactDisplayName}` : `Block ${contactDisplayName}`}</span>
          </div>

          {/* Report User Button */}
          <div
            onClick={handleReportUser}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
          >
            <ThumbsDown className="size-5" />
            <span>Report {contactDisplayName}</span>
          </div>

          {/* Delete Chat Button */}
          <div
            onClick={() => setConfirmAction("delete")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
          >
            <Trash2 className="size-5" />
            <span>Delete chat</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Popup for Clear Chat, Delete Chat, or Block User */}
      {confirmAction && (
        <div
          onClick={() => setConfirmAction(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-base-100 border border-base-300 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center cursor-default animate-scale-up"
          >
            <div className="size-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              {confirmAction === "clear" ? (
                <MinusCircle className="size-6" />
              ) : confirmAction === "block" ? (
                <Ban className="size-6" />
              ) : (
                <Trash2 className="size-6" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-base-content">
                {confirmAction === "clear"
                  ? "Clear this chat?"
                  : confirmAction === "block"
                  ? `${isBlocked ? "Unblock" : "Block"} ${contactDisplayName}?`
                  : "Delete this chat?"}
              </h3>
              <p className="text-xs text-base-content/60 mt-1.5 leading-relaxed">
                {confirmAction === "clear"
                  ? `Are you sure you want to clear all message history with ${contactDisplayName}? This action cannot be undone.`
                  : confirmAction === "block"
                  ? isBlocked
                    ? `Do you want to unblock ${contactDisplayName}? They will be able to send you messages again.`
                    : `Blocked contacts will no longer be able to call you or send you messages.`
                  : `Are you sure you want to delete your conversation with ${contactDisplayName}? All messages will be permanently removed.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn btn-ghost flex-1 rounded-2xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === "clear") handleClearChat();
                  else if (action === "block") handleBlockUser();
                  else if (action === "delete") handleDeleteChat();
                }}
                className="btn btn-error text-white flex-1 rounded-2xl text-xs font-bold shadow-md hover:scale-[1.02] transition-transform"
              >
                {confirmAction === "clear"
                  ? "Clear Chat"
                  : confirmAction === "block"
                  ? isBlocked
                    ? "Unblock"
                    : "Block"
                  : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media, Links and Docs Drawer Side Panel */}
      <MediaGalleryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        messages={messages}
        contactName={contactDisplayName}
      />

      {/* Fullscreen WhatsApp Web Media Lightbox Modal */}
      {lightboxMessage && (
        <MediaLightboxModal
          message={lightboxMessage}
          currentUserId={currentUserId}
          selectedUser={contact}
          onClose={() => setLightboxMessage(null)}
        />
      )}
    </div>
  );
};

export default ContactInfoPanel;
