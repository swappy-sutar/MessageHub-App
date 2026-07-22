import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Delete,
  Smile,
  Sticker,
  Clock,
  Compass,
  Coffee,
  Activity,
  Car,
} from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    id: "recents",
    label: "Recents",
    icon: Clock,
    emojis: [
      "😅", "🙌", "🤗", "😂", "❤️", "👏", "✨", "🤦", "😱", "😒",
      "🫠", "😇", "🙏", "🙄", "🥹", "🤭", "🥱", "🥵", "😳", "🤣",
      "🥺", "🫣", "👅", "👍", "🤤", "😵", "🥶", "😁", "🤪", "😘",
      "👋", "😭", "🔥", "😐",
    ],
  },
  {
    id: "smileys",
    label: "Smileys & People",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲",
      "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
      "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
      "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟",
      "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤",
      "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
    ],
  },
  {
    id: "nature",
    label: "Animals & Nature",
    icon: Compass,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔",
      "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺",
      "🐴", "🦄", "🐝", "🪲", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟",
    ],
  },
  {
    id: "food",
    label: "Food & Drink",
    icon: Coffee,
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
      "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠",
      "🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🍳", "🧇", "🥞", "🧈",
    ],
  },
  {
    id: "sports",
    label: "Activities & Sports",
    icon: Activity,
    emojis: [
      "⚽️", "🏀", "🏈", "baseball", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥊", "🥋", "🎮", "🎯",
      "🎲", "♟️", "🎨", "🎭", "🎸", "🎷", "🥁", "🎤", "🎧", "🚗",
    ],
  },
  {
    id: "travel",
    label: "Travel & Places",
    icon: Car,
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🏣", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🚚", "🚛", "🚜", "🛵", "🏍️", "🚨", "🚔", "✈️", "🛫", "🚀",
      "🛸", "🚁", "🛶", "⛵️", "🛥️", "🚤", "⛴️", "🛳️", "⚓️", "🗺️",
    ],
  },
];

const SAMPLE_GIFS = [
  { id: "1", title: "Party", url: "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif" },
  { id: "2", title: "Funny Dance", url: "https://media.giphy.com/media/l3V0lsGtTMSB5YNgc/giphy.gif" },
  { id: "3", title: "Love Heart", url: "https://media.giphy.com/media/l41JwO6Wbg68ePqIE/giphy.gif" },
  { id: "4", title: "Applause", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3y/giphy.gif" },
  { id: "5", title: "Fire", url: "https://media.giphy.com/media/26tP213v68p1N2Mhi/giphy.gif" },
  { id: "6", title: "High Five", url: "https://media.giphy.com/media/3oEJHV0z8S7WM4MwnK/giphy.gif" },
];

const SAMPLE_STICKERS = [
  { id: "s1", emoji: "🐱", title: "Kitty Magic" },
  { id: "s2", emoji: "🐶", title: "Happy Doge" },
  { id: "s3", emoji: "🚀", title: "To The Moon" },
  { id: "s4", emoji: "❤️", title: "Lots of Love" },
  { id: "s5", emoji: "🔥", title: "Super Hot" },
  { id: "s6", emoji: "✨", title: "Sparkle Time" },
  { id: "s7", emoji: "🎉", title: "Party Celebration" },
  { id: "s8", emoji: "🥳", title: "Woohoo" },
];

export default function EmojiPickerSheet({
  isOpen,
  onClose,
  onSelectEmoji,
  onDeleteChar,
}) {
  const [activeTab, setActiveTab] = useState("emojis"); // 'emojis' | 'gifs' | 'stickers'
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const categoryRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scrollToCategory = (catId) => {
    if (categoryRefs.current[catId]) {
      categoryRefs.current[catId].scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 left-0 right-0 sm:left-3 sm:right-auto sm:w-[420px] bg-base-100 border border-base-300 rounded-t-3xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col h-[380px] animate-fade-in-up transition-all select-none"
    >
      {/* Top Handle bar */}
      <div className="w-10 h-1 bg-base-300 rounded-full mx-auto mt-2 mb-1" />

      {/* WhatsApp Header Bar (Search | Tabs | Backspace) */}
      <div className="p-2.5 border-b border-base-300 bg-base-200/50 flex items-center justify-between gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-2 py-1 input input-bordered input-xs bg-base-100 text-xs rounded-xl text-base-content focus:input-primary"
          />
        </div>

        {/* Tab Selector: Emoji | GIF | Sticker */}
        <div className="flex items-center bg-base-300/60 p-0.5 rounded-xl border border-base-300 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("emojis")}
            className={`px-3 py-1 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "emojis"
                ? "bg-base-100 text-primary shadow-xs"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <Smile className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gifs")}
            className={`px-3 py-1 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "gifs"
                ? "bg-base-100 text-primary shadow-xs"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <span className="font-bold text-[11px]">GIF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stickers")}
            className={`px-3 py-1 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "stickers"
                ? "bg-base-100 text-primary shadow-xs"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <Sticker className="size-4" />
          </button>
        </div>

        {/* Backspace Delete Button */}
        <button
          type="button"
          onClick={onDeleteChar}
          className="btn btn-xs btn-ghost btn-circle text-base-content/60 hover:text-error hover:bg-error/10"
          title="Delete character"
        >
          <Delete className="size-4" />
        </button>
      </div>

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === "emojis" && (
          <>
            {searchQuery.trim() ? (
              <div className="grid grid-cols-8 gap-1.5 text-center">
                {EMOJI_CATEGORIES.flatMap((c) => c.emojis)
                  .filter((e) => e.includes(searchQuery.trim()))
                  .map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectEmoji(emoji)}
                      className="size-9 rounded-xl hover:bg-base-200 hover:scale-125 text-2xl flex items-center justify-center transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
            ) : (
              EMOJI_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  ref={(el) => (categoryRefs.current[category.id] = el)}
                  className="space-y-1.5"
                >
                  <h4 className="text-xs font-bold text-base-content/60 px-1">
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-8 gap-1.5 text-center">
                    {category.emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        className="size-9 rounded-xl hover:bg-base-200 hover:scale-125 text-2xl flex items-center justify-center transition-all cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "gifs" && (
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_GIFS.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectEmoji(` [GIF: ${gif.title}] `)}
                className="relative rounded-2xl overflow-hidden border border-base-300 hover:border-primary group transition-all"
              >
                <img src={gif.url} alt={gif.title} className="w-full h-24 object-cover" />
                <span className="absolute bottom-1 left-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "stickers" && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {SAMPLE_STICKERS.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onSelectEmoji(` ${stk.emoji} `)}
                className="p-3 rounded-2xl bg-base-200/50 border border-base-300 hover:bg-base-200 hover:scale-110 flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <span className="text-3xl">{stk.emoji}</span>
                <span className="text-[9px] font-semibold text-base-content/70 truncate max-w-full">
                  {stk.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Category Navigation Bar (WhatsApp Style) */}
      {activeTab === "emojis" && (
        <div className="p-1.5 border-t border-base-300 bg-base-200/50 flex items-center justify-around">
          {EMOJI_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                className="p-1.5 rounded-xl text-base-content/60 hover:text-primary hover:bg-base-200 transition-colors"
                title={cat.label}
              >
                <IconComponent className="size-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
