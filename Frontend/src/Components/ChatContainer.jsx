import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ForwardMessageModal from "./ForwardMessageModal";
import MessageContextMenu from "./MessageContextMenu";
import MessageInfoModal from "./MessageInfoModal";
import DeleteMessageModal from "./DeleteMessageModal";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../utils/formatMessageTime.js";
import avatar from "../assets/avatar.png";
import { Phone, Video, PhoneMissed, Reply, CornerUpRight, Check, CheckCheck, MoreVertical, Ban } from "lucide-react";

function ChatContainer() {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    setReplyingTo,
    typingUsers,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const currentUserId = authUser?.data?._id || authUser?._id;

  const [forwardModalMessage, setForwardModalMessage] = useState(null);
  const [deleteModalMessage, setDeleteModalMessage] = useState(null);
  const [contextMenuState, setContextMenuState] = useState(null);
  const [infoModalMessage, setInfoModalMessage] = useState(null);

  const isTyping = typingUsers[selectedUser?._id];

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
  }, [selectedUser?._id, socket, getMessages, subscribeToMessages]);

  useEffect(() => {
    if (messageEndRef.current && (messages?.length || isTyping)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-base-100 w-full">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Open Context Menu on Click or Right Click
  const handleOpenContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuState({
      message,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // Render Status Ticks
  const renderMessageTicks = (message) => {
    if (message.isRead) {
      return <CheckCheck className="size-3.5 text-[#53bdeb] font-bold" title="Read" />;
    }
    if (message.isDelivered) {
      return <CheckCheck className="size-3.5 text-base-content/60" title="Delivered" />;
    }
    return <Check className="size-3.5 text-base-content/50" title="Sent (Receiver Offline)" />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100 transition-colors duration-300 relative w-full h-full">
      <ChatHeader />

      {/* Messages area with strict vertical-only scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 w-full">
        {messages.map((message) => {
          const isMine = String(message.senderId) === String(currentUserId);
          const currentUserPic = authUser?.data?.profilePic || authUser?.profilePic;
          const isCallLog =
            message.text &&
            (message.text.startsWith("📹") || message.text.startsWith("📞"));
          const isMissed = message.text && message.text.includes("Missed");
          const isDeclined = message.text && message.text.includes("declined");

          // Compact padding & fit-content sizing for sleek WhatsApp aesthetic
          const isImageOnly = message.image && !message.text && !message.replyTo && !message.isForwarded;
          const bubblePadding = isImageOnly ? "p-1" : "p-2 px-3";

          return (
            <div
              key={message._id}
              id={`msg-${message._id}`}
              ref={messageEndRef}
              className={`chat ${isMine ? "chat-end" : "chat-start"} message-animate group relative w-full transition-all duration-300`}
            >
              {/* Profile Avatar */}
              <div className="chat-image avatar">
                <div className="size-8 rounded-full border border-base-300 shadow-sm">
                  <img
                    src={
                      isMine
                        ? currentUserPic || avatar
                        : selectedUser?.profilePic || avatar
                    }
                    alt="profile"
                  />
                </div>
              </div>

              {/* Message Bubble + Action Buttons Container */}
              <div className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"} max-w-[85%] sm:max-w-[70%]`}>
                {/* Bubble Content - w-fit for compact WhatsApp sizing */}
                <div
                  onContextMenu={(e) => handleOpenContextMenu(e, message)}
                  className={`chat-bubble flex flex-col ${bubblePadding} rounded-2xl relative shadow-md w-fit max-w-full overflow-hidden select-none ${
                    message.deletedForEveryone
                      ? "bg-base-200/60 text-base-content/60 border border-base-300 italic"
                      : isCallLog
                      ? isMissed || isDeclined
                        ? "bg-error/10 text-error border border-error/20"
                        : "bg-base-200 text-base-content border border-base-300"
                      : isMine
                      ? "bg-primary text-primary-content rounded-tr-none"
                      : "bg-base-200 text-base-content rounded-tl-none border border-base-300"
                  }`}
                >
                  {/* Deleted for Everyone View */}
                  {message.deletedForEveryone ? (
                    <div className="flex items-center gap-2 text-xs py-1 text-base-content/60">
                      <Ban className="size-4 text-base-content/40" />
                      <span>This message was deleted</span>
                      <span className="text-[10px] font-mono ml-auto opacity-75">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Forwarded Label Tag */}
                      {message.isForwarded && (
                        <div className="flex items-center gap-1 text-[10px] italic opacity-70 mb-1">
                          <CornerUpRight className="size-3" /> Forwarded
                        </div>
                      )}

                      {/* Quoted Reply Embedded Card */}
                      {message.replyTo && (
                        <div
                          className={`mb-2 p-2 rounded-xl border-l-4 text-xs ${
                            isMine
                              ? "bg-black/15 border-primary-content/80 text-primary-content"
                              : "bg-base-300/80 border-primary text-base-content"
                          }`}
                        >
                          <span className="font-bold block text-[11px]">
                            {message.replyTo.senderName || "Reply"}
                          </span>
                          <span className="opacity-90 truncate block">
                            {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : "Attachment")}
                          </span>
                        </div>
                      )}

                      {/* Image Attachment View with WhatsApp Overlaid Time & Ticks */}
                      {message.image && (
                        <div
                          onClick={(e) => handleOpenContextMenu(e, message)}
                          className="relative rounded-xl overflow-hidden w-full max-w-[280px] sm:max-w-[340px] cursor-pointer group/img"
                        >
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="w-full max-h-[300px] sm:max-h-[360px] object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-[1.01]"
                          />

                          {/* WhatsApp Style Overlaid Time & Ticks on Image Bottom Right */}
                          <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] flex items-center gap-1 font-mono shadow-md">
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {isMine && renderMessageTicks(message)}
                          </div>
                        </div>
                      )}

                      {/* Text Message Content & Inline Time/Ticks */}
                      {message.text && (
                        <div className="inline-flex items-end flex-wrap gap-x-2.5 gap-y-0.5 max-w-full">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {isCallLog && (
                              <div className="p-1 rounded-full bg-base-100/50 flex-shrink-0">
                                {isMissed ? (
                                  <PhoneMissed className="size-4 text-error" />
                                ) : message.text.startsWith("📹") ? (
                                  <Video className="size-4 text-primary" />
                                ) : (
                                  <Phone className="size-4 text-success" />
                                )}
                              </div>
                            )}
                            <span className="text-sm font-normal leading-relaxed break-words">
                              {message.text}
                            </span>
                          </div>

                          {/* Inline Timestamp and Status Ticks */}
                          {!message.image && (
                            <div className="inline-flex items-center gap-1 text-[10px] opacity-75 font-mono ml-auto whitespace-nowrap self-end pb-0.5 flex-shrink-0">
                              <span>{formatMessageTime(message.createdAt)}</span>
                              {isMine && renderMessageTicks(message)}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Inline Hover Action Buttons */}
                {!message.deletedForEveryone && (
                  <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleOpenContextMenu(e, message)}
                      className="btn btn-circle btn-xs btn-ghost bg-base-200/80 border border-base-300 shadow-sm hover:scale-110"
                      title="Message Options"
                    >
                      <MoreVertical className="size-3 text-base-content/70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(message)}
                      className="btn btn-circle btn-xs btn-ghost bg-base-200/80 border border-base-300 shadow-sm hover:scale-110"
                      title="Reply"
                    >
                      <Reply className="size-3 text-base-content/70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setForwardModalMessage(message)}
                      className="btn btn-circle btn-xs btn-ghost bg-base-200/80 border border-base-300 shadow-sm hover:scale-110"
                      title="Forward"
                    >
                      <CornerUpRight className="size-3 text-base-content/70" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* WhatsApp Animated Bouncing Dots Typing Bubble */}
        {isTyping && (
          <div className="chat chat-start message-animate">
            <div className="chat-image avatar">
              <div className="size-8 rounded-full border border-base-300 shadow-sm">
                <img
                  src={selectedUser?.profilePic || avatar}
                  alt="profile"
                />
              </div>
            </div>
            <div className="chat-bubble bg-base-200 text-base-content border border-base-300 rounded-2xl rounded-tl-none p-3 shadow-md flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <MessageInput />

      {/* WhatsApp Message Popover Context Menu */}
      {contextMenuState && (
        <MessageContextMenu
          message={contextMenuState.message}
          position={contextMenuState.position}
          onClose={() => setContextMenuState(null)}
          onOpenInfo={() => setInfoModalMessage(contextMenuState.message)}
          onReply={() => setReplyingTo(contextMenuState.message)}
          onForward={() => setForwardModalMessage(contextMenuState.message)}
          onDelete={() => setDeleteModalMessage(contextMenuState.message)}
        />
      )}

      {/* WhatsApp Delete Message Confirmation Modal */}
      {deleteModalMessage && (
        <DeleteMessageModal
          message={deleteModalMessage}
          isMine={String(deleteModalMessage.senderId) === String(currentUserId)}
          onClose={() => setDeleteModalMessage(null)}
        />
      )}

      {/* WhatsApp Message Info Modal */}
      {infoModalMessage && (
        <MessageInfoModal
          message={infoModalMessage}
          isMine={String(infoModalMessage.senderId) === String(currentUserId)}
          onClose={() => setInfoModalMessage(null)}
        />
      )}

      {/* Forward Message Contact Picker Modal */}
      {forwardModalMessage && (
        <ForwardMessageModal
          message={forwardModalMessage}
          onClose={() => setForwardModalMessage(null)}
        />
      )}
    </div>
  );
}

export default ChatContainer;
