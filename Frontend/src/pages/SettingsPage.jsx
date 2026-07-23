import React, { useState } from "react";
import { useThemeStore } from "../store/useThemeStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  Search,
  Lightbulb,
  X,
  User,
  Key,
  Lock,
  MessageSquare,
  Bell,
  Palette,
  Send,
  Eye,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { THEMES } from "../constants/index.js";
import { Link, useNavigate } from "react-router-dom";
import avatarLogo from "../assets/avatar.png";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! Good Morning 😊", isSent: true },
  { id: 2, content: "hello", isSent: false },
  { id: 3, content: "Nice to meet you!", isSent: false },
  { id: 4, content: "How are you?", isSent: true },
  { id: 5, content: "I'm great, thanks! 🎉", isSent: false },
];

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifBanner, setShowNotifBanner] = useState(true);
  const [userThought, setUserThought] = useState(
    localStorage.getItem("mh_user_thought") || "Share a thought"
  );
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "profile", "account", "privacy", "chats", "notifications"

  const currentUserObj = authUser?.data || authUser;
  const userName = currentUserObj?.firstName
    ? `${currentUserObj.firstName} ${currentUserObj.lastName || ""}`
    : "MessageHub User";

  const handleSaveThought = (e) => {
    if (e.key === "Enter" || e.type === "blur") {
      setIsEditingThought(false);
      localStorage.setItem("mh_user_thought", userThought);
      toast.success("Status updated!");
    }
  };

  const SETTINGS_SECTIONS = [
    {
      id: "profile",
      title: "Profile",
      subtitle: "Name, profile picture, status",
      icon: User,
      action: () => navigate("/profile"),
    },
    {
      id: "account",
      title: "Account",
      subtitle: "Security notifications, account info",
      icon: Key,
      action: () => navigate("/profile"),
    },
    {
      id: "privacy",
      title: "Privacy",
      subtitle: "Blocked contacts, disappearing messages",
      icon: Lock,
      action: () => toast("Privacy controls: End-to-End Encrypted & Active"),
    },
    {
      id: "chats",
      title: "Chats & Themes",
      subtitle: "Theme, wallpaper, chat settings",
      icon: MessageSquare,
      action: () => setActiveTab("chats"),
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Message, group & call tones",
      icon: Bell,
      action: () => toast.success("Notification preferences saved"),
    },
  ];

  const filteredSections = SETTINGS_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredThemes = THEMES.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-16 px-4 bg-base-200 transition-colors duration-300">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Top Header: User Name / Title */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold text-base-content tracking-tight">
            {userName}
          </h1>
          <button
            onClick={() => navigate("/profile")}
            className="btn btn-sm btn-outline border-base-300 hover:bg-base-300 text-xs font-semibold rounded-xl"
          >
            View Profile
          </button>
        </div>

        {/* 1. Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="input input-bordered w-full pl-11 rounded-full bg-base-100 text-base-content placeholder:text-base-content/40 border-base-300 focus:border-primary text-sm shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* 2. Choose Your Notifications Banner */}
        {showNotifBanner && (
          <div className="bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 shadow-sm relative overflow-hidden transition-all animate-fade-in">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Lightbulb className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-base-content">
                  Choose your notifications
                </h3>
                <p className="text-xs text-base-content/70">
                  Get notifications for messages, groups or your status.{" "}
                  <button
                    onClick={() => toast.success("Notifications enabled!")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Choose now
                  </button>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="text-base-content/40 hover:text-base-content p-1 rounded-full hover:bg-base-200 transition-colors"
              title="Dismiss banner"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* 3. User Avatar & "Share a thought" Bubble Section */}
        <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-md flex flex-col items-center justify-center gap-3 relative">
          {/* Thought Bubble */}
          <div className="relative bg-base-200 border border-base-300 px-4 py-1.5 rounded-full text-xs font-semibold text-base-content shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-base-300 transition-all">
            <Sparkles className="size-3 text-primary" />
            {isEditingThought ? (
              <input
                type="text"
                value={userThought}
                onChange={(e) => setUserThought(e.target.value)}
                onKeyDown={handleSaveThought}
                onBlur={handleSaveThought}
                autoFocus
                className="bg-transparent border-none outline-none text-xs font-semibold text-base-content w-32"
              />
            ) : (
              <span onClick={() => setIsEditingThought(true)}>
                {userThought || "Share a thought"}
              </span>
            )}
            {/* Thought Pointer tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-2 bg-base-200 border-r border-b border-base-300 rotate-45" />
          </div>

          {/* Profile Photo */}
          <div className="relative group cursor-pointer" onClick={() => navigate("/profile")}>
            <img
              src={currentUserObj?.profilePic || avatarLogo}
              alt="Profile"
              className="size-28 sm:size-32 rounded-full object-cover border-4 border-base-200 shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
              Edit
            </div>
          </div>
        </div>

        {/* 4. Settings Options List */}
        <div className="bg-base-100 rounded-3xl border border-base-300 shadow-md divide-y divide-base-300 overflow-hidden">
          {filteredSections.map((sec) => {
            const IconComponent = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={sec.action}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-base-200/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-2xl bg-base-200 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-base-content/70">
                    <IconComponent className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-base-content group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-0.5">
                      {sec.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-base-content/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            );
          })}
        </div>

        {/* 5. Theme Customization & Live Preview Section */}
        <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-base-300 pb-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-base-content">
                Interface Color Themes
              </h2>
              <p className="text-xs text-base-content/60">
                Personalize your MessageHub chat colors & appearance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Theme Selector Grid */}
            <div className="lg:col-span-2 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredThemes.map((t) => {
                  const isSelected = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col gap-2 p-2.5 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? "bg-base-200 border-primary ring-2 ring-primary/20"
                          : "bg-base-200/40 border-base-300 hover:border-base-content/20"
                      }`}
                    >
                      <div
                        className="relative h-8 w-full rounded-xl overflow-hidden border border-base-300"
                        data-theme={t}
                      >
                        <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1 bg-base-100">
                          <div className="rounded bg-primary" />
                          <div className="rounded bg-secondary" />
                          <div className="rounded bg-accent" />
                          <div className="rounded bg-neutral" />
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold truncate w-full text-center ${
                          isSelected ? "text-primary font-bold" : "text-base-content/70"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Chat Theme Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content/70">
                <Eye className="size-4 text-primary" /> Live Theme Preview
              </div>
              <div
                className="rounded-2xl border border-base-300 overflow-hidden shadow-sm"
                data-theme={theme}
              >
                <div className="px-3.5 py-2.5 border-b border-base-300 bg-base-100 flex items-center gap-2.5">
                  <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs font-bold">
                    M
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-base-content">
                      MessageHub Preview
                    </h4>
                    <p className="text-[10px] text-base-content/60">Online</p>
                  </div>
                </div>

                <div className="p-3 space-y-2 bg-base-100 min-h-[160px]">
                  {PREVIEW_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                          msg.isSent
                            ? "bg-primary text-primary-content font-medium"
                            : "bg-base-200 text-base-content"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-base-300 bg-base-100 flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1 text-xs bg-base-200 text-base-content rounded-xl"
                    value="Type a message..."
                    readOnly
                  />
                  <button className="btn btn-primary btn-sm btn-circle">
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
