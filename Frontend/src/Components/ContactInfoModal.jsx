import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
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
} from "lucide-react";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";
import MediaGalleryModal from "./MediaGalleryModal";
import MediaLightboxModal from "./MediaLightboxModal";

const ContactInfoModal = ({ contact, onClose }) => {
  const { messages, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [lightboxMessage, setLightboxMessage] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  if (!contact) return null;

  const currentUserId = authUser?.data?._id || authUser?._id;

  // Filter all shared media items
  const sharedMedia = messages.filter((m) => !m.deletedForEveryone && (m.image || m.video));

  const contactDisplayName = contact.firstName
    ? `${contact.firstName} ${contact.lastName || ""}`.trim()
    : contact.name || "Contact";

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
  };

  const handleToggleFavourite = () => {
    setIsFavourite(!isFavourite);
    toast.success(isFavourite ? "Removed from favourites" : "Added to favourites ❤️");
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-base-100 text-base-content border border-base-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-sans transition-colors duration-300"
        >
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex items-center gap-3 bg-base-200/50">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-base-300 text-base-content/60 hover:text-base-content transition-colors"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-bold text-base-content">Contact info</h3>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Profile Card Section */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <img
                  src={contact.profilePic || avatar}
                  alt={contactDisplayName}
                  className="size-28 sm:size-32 rounded-full object-cover border-4 border-base-300 shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-base-content">
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

              {/* Thumbnail Row Preview (Clicking opens Lightbox viewer directly!) */}
              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 px-1">
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

            {/* Settings Options List */}
            <div className="space-y-1">
              <div
                onClick={() => toast("Starred messages feature active!")}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-sm font-semibold text-base-content"
              >
                <Star className="size-5 text-base-content/70" />
                <span>Starred messages</span>
              </div>

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

              <div
                onClick={() => toast("Disappearing messages: Off")}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Clock className="size-5 text-base-content/70" />
                  <div>
                    <span className="text-sm font-semibold text-base-content block">
                      Disappearing messages
                    </span>
                    <span className="text-xs text-base-content/60">Off</span>
                  </div>
                </div>
              </div>

              <div
                onClick={() => toast("Advanced chat privacy active")}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Shield className="size-5 text-base-content/70" />
                  <div>
                    <span className="text-sm font-semibold text-base-content block">
                      Advanced chat privacy
                    </span>
                    <span className="text-xs text-base-content/60">Off</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-base-200/40">
                <Lock className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-bold text-base-content block">
                    Encryption
                  </span>
                  <span className="text-xs text-base-content/70 leading-relaxed block mt-0.5">
                    Messages are end-to-end encrypted. Click to verify.
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-base-300" />

            {/* Actions List */}
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

              <div
                onClick={() => toast.success("Chat history cleared")}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
              >
                <MinusCircle className="size-5" />
                <span>Clear chat</span>
              </div>

              <div
                onClick={() => toast.error(`Blocked ${contactDisplayName}`)}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
              >
                <Ban className="size-5" />
                <span>Block {contactDisplayName}</span>
              </div>

              <div
                onClick={() => toast.error(`Reported ${contactDisplayName}`)}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
              >
                <ThumbsDown className="size-5" />
                <span>Report {contactDisplayName}</span>
              </div>

              <div
                onClick={() => {
                  setSelectedUser(null);
                  onClose();
                  toast.success("Chat deleted");
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-colors text-sm font-semibold text-red-500"
              >
                <Trash2 className="size-5" />
                <span>Delete chat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default ContactInfoModal;
