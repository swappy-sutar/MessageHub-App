import React, { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X, Calendar, CheckCheck, Check } from "lucide-react";
import { formatMessageTime } from "../utils/formatMessageTime";

const InChatSearchPanel = ({ onClose }) => {
  const { messages } = useChatStore();
  const { authUser } = useAuthStore();
  const currentUserId = authUser?.data?._id || authUser?._id;

  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);

  // Filter non-deleted messages
  let searchResults = messages.filter((m) => !m.deletedForEveryone && m.text);

  // Filter by Date if selected
  if (selectedDate) {
    searchResults = searchResults.filter((m) => {
      const msgDate = new Date(m.createdAt).toISOString().split("T")[0];
      return msgDate === selectedDate;
    });
  }

  // Filter by Search Text
  if (query.trim()) {
    searchResults = searchResults.filter((m) =>
      m.text.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Group search results by date heading
  const formatHeaderDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return formatMessageTime(dateStr);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return d.toLocaleDateString("en-US", { weekday: "long" });
    }
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  // Green term highlighting utility matching screenshot
  const renderHighlightedText = (text, searchQuery) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="text-emerald-500 font-bold underline">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleScrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-primary", "rounded-2xl");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "rounded-2xl");
      }, 2000);
    }
  };

  return (
    <div className="w-full sm:w-[380px] lg:w-[400px] border-l border-base-300 bg-base-100 flex-shrink-0 h-full flex flex-col transition-all duration-300 z-20 font-sans">
      {/* Search Header Bar matching screenshot */}
      <div className="p-3 border-b border-base-300 flex items-center gap-2 bg-base-100 h-16 flex-shrink-0">
        {/* Calendar Date Picker Button */}
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="p-2 rounded-xl hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors relative"
          title="Filter by date"
        >
          <Calendar className="size-5 text-primary" />
          <input
            ref={dateInputRef}
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </button>

        {/* Search Input Pill matching screenshot */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-base-200/90 rounded-full border border-base-300 focus-within:border-primary transition-colors">
          <Search className="size-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-base-content placeholder:text-base-content/40"
            autoFocus
          />
          {(query || selectedDate) && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedDate("");
              }}
              className="p-0.5 rounded-full hover:bg-base-300 text-base-content/60 hover:text-base-content"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
          title="Close search"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Date Filter Badge if selected */}
      {selectedDate && (
        <div className="px-4 py-1.5 bg-primary/10 border-b border-base-300 flex items-center justify-between text-xs text-primary font-mono">
          <span>Filtering date: {selectedDate}</span>
          <button onClick={() => setSelectedDate("")} className="hover:underline font-bold">
            Clear
          </button>
        </div>
      )}

      {/* Search Results Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {searchResults.length === 0 ? (
          <div className="py-12 text-center text-xs text-base-content/50 italic">
            No messages found
          </div>
        ) : (
          searchResults.map((message) => {
            const isMine = String(message.senderId) === String(currentUserId);
            const dateLabel = formatHeaderDate(message.createdAt);

            return (
              <div
                key={message._id}
                onClick={() => handleScrollToMessage(message._id)}
                className="p-3 rounded-2xl bg-base-200/40 hover:bg-base-200 border border-base-300/60 cursor-pointer transition-all space-y-1.5 group"
              >
                {/* Date Header */}
                <div className="text-[11px] font-mono text-base-content/50">
                  {dateLabel}
                </div>

                {/* Message Snippet with Status Ticks & Green Highlighting */}
                <div className="flex items-center gap-1.5 text-sm text-base-content font-medium break-words">
                  {isMine && (
                    <CheckCheck className={`size-3.5 flex-shrink-0 ${message.isRead ? "text-info" : "text-base-content/50"}`} />
                  )}
                  <div className="flex-1 truncate group-hover:text-primary transition-colors">
                    {renderHighlightedText(message.text, query)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InChatSearchPanel;
