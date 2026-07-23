import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useMemo, Fragment } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ForwardMessageModal from "./ForwardMessageModal";
import MessageContextMenu from "./MessageContextMenu";
import MessageInfoModal from "./MessageInfoModal";
import DeleteMessageModal from "./DeleteMessageModal";
import MediaLightboxModal from "./MediaLightboxModal";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, formatMessageDate, isSameDay } from "../utils/formatMessageTime.js";
import { extractFirstUrl, getLinkPreviewData } from "../utils/linkPreview.js";
import avatar from "../assets/avatar.png";
import { Phone, Video, PhoneMissed, Reply, CornerUpRight, Check, CheckCheck, MoreVertical, Ban } from "lucide-react";

/* Swipeable Message Item for Mobile Touch Gestures & Desktop Hover */
function SwipeableMessageItem({
  message,
  currentUserId,
  authUser,
  selectedUser,
  isHighlighted,
  messageEndRef,
  handleOpenContextMenu,
  handleScrollToMessage,
  getReplyTargetId,
  renderMessageTicks,
  setReplyingTo,
  setForwardModalMessage,
  onOpenLightbox,
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0, isHorizontal: false });

  const isMine = String(message.senderId) === String(currentUserId);
  const detectedUrl = extractFirstUrl(message.text);
  const linkPreviewData = detectedUrl ? getLinkPreviewData(detectedUrl) : null;

  const renderTextWithLinks = (rawText) => {
    if (!rawText) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const parts = rawText.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${
              isMine
                ? "text-white hover:text-white/90 drop-shadow-sm font-semibold"
                : "text-primary hover:text-primary/90 font-semibold"
            } underline break-all select-text transition-colors`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };
  const isCallLog =
    message.text &&
    (message.text.startsWith("📹") || message.text.startsWith("📞"));
  const isMissed = message.text && message.text.includes("Missed");
  const isDeclined = message.text && message.text.includes("declined");

  const isImageOnly =
    message.image && !message.text && !message.replyTo && !message.isForwarded;
  const bubblePadding = isImageOnly ? "p-1" : "py-1.5 px-3 sm:py-2 sm:px-3.5";

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      isHorizontal: false,
    };
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current.x) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;

    if (!touchStartRef.current.isHorizontal) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        touchStartRef.current.isHorizontal = true;
      }
    }

    if (touchStartRef.current.isHorizontal) {
      const maxSwipe = 85;
      const clampedX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      setSwipeOffset(clampedX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -40) {
      // Swipe Left -> Forward Modal
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(30);
      setForwardModalMessage(message);
    } else if (swipeOffset > 40) {
      // Swipe Right -> Reply
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(30);
      setReplyingTo(message);
    }
    setSwipeOffset(0);
    touchStartRef.current = { x: 0, y: 0, isHorizontal: false };
  };

  return (
    <div
      id={`msg-${message._id}`}
      ref={messageEndRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex ${isMine ? "justify-end" : "justify-start"} message-animate group relative w-full transition-all duration-300 py-0.5 px-1 ${
        isHighlighted ? "whatsapp-row-highlight" : ""
      }`}
    >
      {/* Swipe Left Indicator -> Forward */}
      {swipeOffset < -15 && (
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full border shadow-md transition-all duration-200 z-20 ${
            swipeOffset < -40
              ? "bg-primary text-primary-content scale-110 border-primary shadow-primary/30"
              : "bg-base-200 text-base-content/70 scale-90 border-base-300"
          }`}
        >
          <CornerUpRight className="size-4" />
        </div>
      )}

      {/* Swipe Right Indicator -> Reply */}
      {swipeOffset > 15 && (
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full border shadow-md transition-all duration-200 z-20 ${
            swipeOffset > 40
              ? "bg-primary text-primary-content scale-110 border-primary shadow-primary/30"
              : "bg-base-200 text-base-content/70 scale-90 border-base-300"
          }`}
        >
          <Reply className="size-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        style={{
          transform: swipeOffset ? `translateX(${swipeOffset}px)` : "none",
          transition: swipeOffset ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"} max-w-[85%] sm:max-w-[72%] md:max-w-[65%]`}
      >
        {/* Bubble Content */}
        <div
          onContextMenu={(e) => handleOpenContextMenu(e, message)}
          className={`chat-bubble flex flex-col ${bubblePadding} rounded-2xl relative shadow-md w-fit max-w-full overflow-hidden select-none transition-all duration-300 ${
            isHighlighted ? "whatsapp-bubble-highlight ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""
          } ${
            message.deletedForEveryone
              ? "bg-base-200/60 text-base-content/60 border border-base-300 italic"
              : isCallLog
              ? isMissed || isDeclined
                ? "bg-error/15 text-error border border-error/20"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetId = getReplyTargetId(message.replyTo);
                    if (targetId) handleScrollToMessage(targetId);
                  }}
                  className={`mb-1.5 p-1.5 px-2.5 rounded-xl border-l-4 text-xs cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all select-none ${
                    isMine
                      ? "bg-black/20 border-primary-content/80 text-primary-content hover:bg-black/30"
                      : "bg-base-300/80 border-primary text-base-content hover:bg-base-300"
                  }`}
                  title="Click to view original message"
                >
                  <span className="font-bold block text-[11px]">
                    {message.replyTo.senderName || "Reply"}
                  </span>
                  <span className="opacity-90 truncate block">
                    {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : "Attachment")}
                  </span>
                </div>
              )}

              {/* Image Attachment View */}
              {message.image && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenLightbox) onOpenLightbox(message);
                  }}
                  onContextMenu={(e) => handleOpenContextMenu(e, message)}
                  className="relative rounded-xl overflow-hidden w-full max-w-[280px] sm:max-w-[340px] cursor-pointer group/img"
                >
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="w-full max-h-[300px] sm:max-h-[360px] object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-[1.01]"
                  />

                  {/* Overlaid Time & Ticks */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] flex items-center gap-1 font-mono shadow-md">
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isMine && renderMessageTicks(message)}
                  </div>
                </div>
              )}

              {/* Rich Link Preview Card (WhatsApp Style) */}
              {linkPreviewData && (
                <a
                  href={linkPreviewData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`block mb-2 p-2.5 rounded-xl border-l-4 text-xs transition-colors select-text group/link ${
                    isMine
                      ? "bg-black/30 border-white/90 text-white hover:bg-black/40"
                      : "bg-base-300/70 border-primary text-base-content hover:bg-base-300"
                  }`}
                >
                  <div
                    className={`font-bold text-sm leading-snug mb-1 group-hover/link:underline ${
                      isMine ? "text-white drop-shadow-sm" : "text-primary"
                    }`}
                  >
                    {linkPreviewData.title}
                  </div>
                  <div
                    className={`text-[11.5px] leading-relaxed mb-1 line-clamp-2 ${
                      isMine ? "text-white/90" : "text-base-content/85"
                    }`}
                  >
                    {linkPreviewData.description}
                  </div>
                  <div
                    className={`text-[10px] font-mono ${
                      isMine ? "text-white/70" : "text-base-content/60"
                    }`}
                  >
                    {linkPreviewData.domain}
                  </div>
                </a>
              )}

              {/* Text Message Content & Inline Time/Ticks */}
              {message.text && (
                <div className="inline-flex items-end flex-wrap gap-x-2 gap-y-0.5 max-w-full">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isCallLog && (
                      <div className="p-0.5 rounded-full bg-base-100/50 flex-shrink-0">
                        {isMissed ? (
                          <PhoneMissed className="size-3.5 text-error" />
                        ) : message.text.startsWith("📹") ? (
                          <Video className="size-3.5 text-primary" />
                        ) : (
                          <Phone className="size-3.5 text-success" />
                        )}
                      </div>
                    )}
                    <span className="text-[13.5px] sm:text-sm font-normal leading-snug break-words">
                      {isCallLog
                        ? message.text.replace(/^[^a-zA-Z0-9]+/, "").trim()
                        : renderTextWithLinks(message.text)}
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

        {/* Message Bubble */}
      </div>
    </div>
  );
}

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
  const [lightboxMediaMessage, setLightboxMediaMessage] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const isTyping = typingUsers[selectedUser?._id];

  const getReplyTargetId = (replyTo) => {
    if (!replyTo) return null;
    if (typeof replyTo.messageId === "object" && replyTo.messageId !== null) {
      return String(replyTo.messageId._id || replyTo.messageId.id || "");
    }
    if (replyTo.messageId) {
      return String(replyTo.messageId);
    }
    if (replyTo._id) {
      return String(replyTo._id);
    }
    return null;
  };

  const handleScrollToMessage = (targetId) => {
    if (!targetId) return;
    const cleanId = String(targetId);
    const targetElement = document.getElementById(`msg-${cleanId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(cleanId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

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

  // Group consecutive messages by date into day sections for WhatsApp sticky date headers
  const messageGroups = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const dateLabel = formatMessageDate(message.createdAt);
      if (!currentGroup || currentGroup.dateLabel !== dateLabel) {
        currentGroup = {
          dateLabel,
          key: message._id || dateLabel,
          messages: [message],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  }, [messages]);

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
      return (
        <CheckCheck
          className="size-3.5 text-[#38bdf8] stroke-[2.5] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
          title="Read"
        />
      );
    }
    if (message.isDelivered) {
      return <CheckCheck className="size-3.5 opacity-80 stroke-[2] filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" title="Delivered" />;
    }
    return <Check className="size-3.5 opacity-70 stroke-[2] filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" title="Sent" />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden whatsapp-chat-bg transition-colors duration-300 relative w-full h-full">
      <ChatHeader />

      {/* Messages area with strict vertical-only scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-2 sm:space-y-3 w-full">
        {messageGroups.map((group) => (
          <div key={group.key} className="relative space-y-3">
            {/* WhatsApp Floating Sticky Date Header bounded within its day section */}
            <div className="sticky top-2 z-10 flex justify-center my-2 pointer-events-none">
              <div className="whatsapp-date-badge shadow-md pointer-events-auto">
                {group.dateLabel}
              </div>
            </div>

            {group.messages.map((message) => (
              <SwipeableMessageItem
                key={message._id}
                message={message}
                currentUserId={currentUserId}
                authUser={authUser}
                selectedUser={selectedUser}
                isHighlighted={highlightedMessageId && String(highlightedMessageId) === String(message._id)}
                messageEndRef={messageEndRef}
                handleOpenContextMenu={handleOpenContextMenu}
                handleScrollToMessage={handleScrollToMessage}
                getReplyTargetId={getReplyTargetId}
                renderMessageTicks={renderMessageTicks}
                setReplyingTo={setReplyingTo}
                setForwardModalMessage={setForwardModalMessage}
                onOpenLightbox={(msg) => setLightboxMediaMessage(msg)}
              />
            ))}
          </div>
        ))}

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

      {/* WhatsApp Fullscreen Media Lightbox Viewer Modal */}
      {lightboxMediaMessage && (
        <MediaLightboxModal
          message={lightboxMediaMessage}
          currentUserId={currentUserId}
          selectedUser={selectedUser}
          onClose={() => setLightboxMediaMessage(null)}
          onForward={(msg) => setForwardModalMessage(msg)}
        />
      )}
    </div>
  );
}

export default ChatContainer;
