import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const DeleteMessageModal = ({ message, isMine, onClose }) => {
  const { deleteMessage } = useChatStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (deleteType) => {
    setIsDeleting(true);
    try {
      await deleteMessage(message._id, deleteType);
      toast.success(
        deleteType === "everyone"
          ? "Message deleted for everyone"
          : "Message deleted for you"
      );
      onClose();
    } catch (err) {
      toast.error("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 border border-base-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 font-sans text-base-content transition-colors duration-300"
      >
        {/* Title */}
        <h3 className="text-xl font-bold text-base-content">Delete message?</h3>

        {/* Buttons Stack */}
        <div className="flex flex-col items-end space-y-2.5 pt-2">
          {/* Delete for Everyone (Sender only) */}
          {isMine && !message.deletedForEveryone && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => handleDelete("everyone")}
              className="btn btn-outline btn-primary btn-sm rounded-full px-6 font-medium text-sm transition-transform hover:scale-105"
            >
              Delete for everyone
            </button>
          )}

          {/* Delete for Me */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => handleDelete("me")}
            className="btn btn-outline btn-primary btn-sm rounded-full px-6 font-medium text-sm transition-transform hover:scale-105"
          >
            Delete for me
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm rounded-full text-base-content/70 hover:text-base-content px-6 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
