import React from "react";
import { Pin, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const PinnedMessageBar = () => {
  const { pinnedMessages, pinMessage } = useChatStore();

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const currentPin = pinnedMessages[0];

  const getPinPreview = (msg) => {
    if (msg.text) return msg.text;
    if (msg.image) return "📷 Photo attachment";
    if (msg.video) return "🎥 Video attachment";
    if (msg.document) return `📄 ${msg.document.name || "Document"}`;
    return "Pinned message";
  };

  return (
    <div className="bg-base-200/90 backdrop-blur-md px-4 py-2 border-b border-base-300 flex items-center justify-between z-10 transition-all">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Pin className="size-4 text-primary shrink-0 rotate-45" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-primary truncate">Pinned Message</p>
          <p className="text-xs text-base-content/80 truncate">{getPinPreview(currentPin)}</p>
        </div>
      </div>

      <button
        onClick={() => pinMessage(currentPin._id)}
        className="p-1 hover:bg-base-300 rounded-full text-base-content/50 hover:text-base-content transition-colors shrink-0"
        title="Unpin message"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default PinnedMessageBar;
