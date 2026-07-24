import React, { useState } from "react";
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
import MediaGalleryModal from "./MediaGalleryModal";

const ContactInfoPanel = ({ contact, onClose }) => {
  const { messages } = useChatStore();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  if (!contact) return null;

  // Filter all shared media, docs, links
  const sharedMedia = messages.filter((m) => !m.deletedForEveryone && (m.image || m.video));

  const contactDisplayName = contact.firstName
    ? `${contact.firstName} ${contact.lastName || ""}`.trim()
    : contact.name || "Contact";

  return (
    <div className="w-full sm:w-[380px] lg:w-[400px] border-l border-base-300 bg-base-100 flex-shrink-0 h-full flex flex-col transition-all duration-300 z-20 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center gap-4 bg-base-100 h-16 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
          title="Close"
        >
          <X className="size-5" />
        </button>
        <h3 className="text-base font-bold text-base-content">Contact info</h3>
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Large Centered Profile Card */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src={contact.profilePic || avatar}
            alt={contactDisplayName}
            className="size-32 rounded-full object-cover border-4 border-base-200 shadow-md"
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
            <div
              onClick={() => setIsMediaModalOpen(true)}
              className="grid grid-cols-3 sm:grid-cols-4 gap-2 px-1 cursor-pointer"
            >
              {sharedMedia.slice(0, 4).map((msg, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-base-300 shadow-xs hover:scale-105 transition-transform">
                  <img
                    src={msg.image || msg.video}
                    alt="media"
                    className="w-full h-full object-cover"
                  />
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
                <p className="text-sm font-semibold text-base-content">Disappearing messages</p>
                <p className="text-xs text-base-content/50">Off</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-base-content/40" />
          </div>

          {/* Encryption info */}
          <div
            onClick={() => toast("End-to-end encrypted with Web Crypto SubtleCrypto")}
            className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-base-200 cursor-pointer transition-colors text-xs text-base-content/60"
          >
            <Lock className="size-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-bold text-base-content">Encryption</p>
              <p className="text-[11px] text-base-content/50">Messages and calls are end-to-end encrypted.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Media, Links and Docs Drawer Modal */}
      <MediaGalleryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        messages={messages}
        contactName={contactDisplayName}
      />
    </div>
  );
};

export default ContactInfoPanel;
