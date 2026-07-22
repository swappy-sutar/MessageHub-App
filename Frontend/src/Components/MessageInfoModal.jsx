import React from "react";
import { X, CheckCheck } from "lucide-react";
import { formatMessageTime } from "../utils/formatMessageTime";

const MessageInfoModal = ({ message, isMine, onClose }) => {
  if (!message) return null;

  const createdAtFormatted = message.createdAt
    ? `Today at ${formatMessageTime(message.createdAt)}`
    : "-";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 text-base-content border border-base-300 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col font-sans transition-colors duration-300"
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center gap-4 bg-base-200/60">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-base-300 text-base-content/60 hover:text-base-content transition-colors"
          >
            <X className="size-5" />
          </button>
          <h3 className="text-lg font-bold text-base-content">Message info</h3>
        </div>

        {/* Message Bubble Card Preview Section */}
        <div className="p-6 bg-base-200/30 border-b border-base-300 flex items-center justify-end">
          <div className="bg-primary text-primary-content p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-md relative">
            {message.image && (
              <img
                src={message.image}
                alt="preview"
                className="w-full max-h-[220px] object-cover rounded-xl mb-2"
              />
            )}
            {message.text && (
              <div className="text-sm font-normal break-words leading-relaxed">
                {message.text}
              </div>
            )}
            <div className="text-[10px] opacity-75 font-mono text-right mt-1 flex items-center justify-end gap-1">
              <span>{formatMessageTime(message.createdAt)}</span>
              <CheckCheck className={`size-3.5 ${message.isRead ? "text-info" : "opacity-75"}`} />
            </div>
          </div>
        </div>

        {/* Timeline Status Details Section */}
        <div className="p-6 space-y-6 bg-base-100">
          {/* Read Status */}
          <div className="flex items-start gap-4">
            <CheckCheck className="size-5 text-primary mt-0.5 flex-shrink-0 font-bold" />
            <div>
              <h4 className="text-base font-bold text-base-content">Read</h4>
              <p className="text-xs text-base-content/60 mt-1 font-mono">
                {message.isRead ? createdAtFormatted : "-"}
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-base-300 ml-9" />

          {/* Delivered Status */}
          <div className="flex items-start gap-4">
            <CheckCheck className="size-5 text-base-content/50 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-base font-bold text-base-content">Delivered</h4>
              <p className="text-xs text-base-content/60 mt-1 font-mono">
                {message.isDelivered || message.isRead ? createdAtFormatted : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
