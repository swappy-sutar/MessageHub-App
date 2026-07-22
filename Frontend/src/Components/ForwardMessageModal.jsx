import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Send, Search } from "lucide-react";
import avatar from "../assets/avatar.png";
import toast from "react-hot-toast";

const ForwardMessageModal = ({ message, onClose }) => {
  const { users, forwardMessage } = useChatStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleForward = async () => {
    if (!selectedUser) {
      return toast.error("Select a contact to forward this message");
    }
    setIsSending(true);
    try {
      await forwardMessage(message, selectedUser._id);
      toast.success(`Message forwarded to ${selectedUser.firstName}`);
      onClose();
    } catch (err) {
      toast.error("Failed to forward message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 border border-base-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div>
            <h3 className="text-base font-bold text-base-content flex items-center gap-2">
              <span className="text-primary text-lg">↪</span> Forward message to...
            </h3>
            <p className="text-xs text-base-content/60">
              Select a contact to forward this message
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-3 bg-base-200/30 border-b border-base-300 flex items-center gap-3">
          {message.image && (
            <img
              src={message.image}
              alt="preview"
              className="size-10 rounded-lg object-cover border border-base-300"
            />
          )}
          <div className="text-xs text-base-content/80 truncate flex-1 font-medium">
            {message.text || "📷 Photo attachment"}
          </div>
        </div>

        {/* Contact Search Input */}
        <div className="p-3 border-b border-base-300">
          <div className="relative">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm w-full pl-9 bg-base-200/50 border-base-300 focus:outline-none rounded-xl"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-base-content/50">
              No contacts found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?._id === u._id;
              return (
                <div
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary text-primary-content font-medium shadow-md"
                      : "hover:bg-base-200/70"
                  }`}
                >
                  <img
                    src={u.profilePic || avatar}
                    alt={u.firstName}
                    className="size-10 rounded-full object-cover border border-base-300"
                  />
                  <div className="flex-1 truncate">
                    <div className="text-sm font-semibold truncate">
                      {u.firstName} {u.lastName}
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedUser(u)}
                    className="radio radio-primary radio-sm"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-base-300 bg-base-200/50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedUser || isSending}
            className="btn btn-primary btn-sm rounded-xl gap-2 px-5"
          >
            {isSending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                Send <Send className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
