import React from "react";
import { useChatStore } from "../store/useChatStore";
import {
  X,
  Image,
  Star,
  Clock,
  Shield,
  Lock,
  ChevronRight,
} from "lucide-react";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";

const ContactInfoModal = ({ contact, onClose }) => {
  const { messages } = useChatStore();

  if (!contact) return null;

  // Filter all shared images in current conversation
  const sharedMedia = messages.filter((m) => m.image && !m.deletedForEveryone);

  return (
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
                alt={contact.firstName}
                className="size-28 sm:size-32 rounded-full object-cover border-4 border-base-300 shadow-xl"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">
                {contact.firstName} {contact.lastName}
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
              onClick={() => toast.success(`Showing ${sharedMedia.length} shared media items`)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Image className="size-5 text-base-content/70" />
                <span className="text-sm font-semibold text-base-content">
                  Media, links and docs
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-base-content/60 font-mono">
                <span>{sharedMedia.length}</span>
                <ChevronRight className="size-4" />
              </div>
            </div>

            {/* Thumbnail Row Preview */}
            {sharedMedia.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 px-1">
                {sharedMedia.slice(0, 4).map((msg, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-base-300 shadow-sm">
                    <img
                      src={msg.image}
                      alt="media"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-base-content/50 italic bg-base-200/30 rounded-xl">
                No shared media yet
              </div>
            )}
          </div>

          <div className="h-[1px] bg-base-300" />

          {/* Settings Options List */}
          <div className="space-y-1">
            {/* Starred Messages */}
            <div
              onClick={() => toast("Starred messages feature active!")}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-sm font-semibold text-base-content"
            >
              <Star className="size-5 text-base-content/70" />
              <span>Starred messages</span>
            </div>

            {/* Disappearing Messages */}
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

            {/* Advanced Chat Privacy */}
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

            {/* End-to-End Encryption */}
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
        </div>
      </div>
    </div>
  );
};

export default ContactInfoModal;
