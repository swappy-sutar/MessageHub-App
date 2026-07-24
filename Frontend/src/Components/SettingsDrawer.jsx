import React, { useState, useEffect, useRef } from "react";
import { useThemeStore } from "../store/useThemeStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import {
  X,
  User,
  Key,
  Lock,
  MessageSquare,
  Bell,
  Keyboard,
  ChevronRight,
  Eye,
  HelpCircle,
  LogOut,
  Camera,
  Mail,
  Shield,
  Calendar,
  QrCode,
  Copy,
  Check,
  FileText,
  Info,
  Clock,
  ToggleRight,
  Image,
  Download,
  MessageCircle,
  Users,
  Radio,
  Volume2,
  Beaker,
  MessageSquareText,
  Phone,
  Flag,
  FlaskConical,
} from "lucide-react";
import { THEMES } from "../constants/index.js";
import { WALLPAPER_COLORS } from "../store/useThemeStore.js";
import avatarLogo from "../assets/avatar.png";
import toast from "react-hot-toast";

import { axiosInstance } from "../utils/axios.js";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! Good Morning 😊", isSent: true },
  { id: 2, content: "How are you?", isSent: false },
  { id: 3, content: "MessageHub looks awesome! 🎉", isSent: true },
];

const SettingsDrawer = () => {
  const { isSettingsOpen, setSettingsOpen } = useChatStore();
  const { theme, setTheme, wallpaper, setWallpaper, showDoodles, setShowDoodles } = useThemeStore();
  const { authUser, logout, isUpdateProfile, updateProfile } = useAuthStore();

  const [activeSubView, setActiveSubView] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [showPreviews, setShowPreviews] = useState(true);
  const [playSound, setPlaySound] = useState(false);
  const [bgSync, setBgSync] = useState(true);
  const [joinBeta, setJoinBeta] = useState(false);

  // Account Sub-view States & Handlers
  const [securityNotifications, setSecurityNotifications] = useState(
    localStorage.getItem("mh_sec_notif") !== "false"
  );
  const [accountReport, setAccountReport] = useState(null);
  const [isRequestingReport, setIsRequestingReport] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleRequestAccountReport = async () => {
    setIsRequestingReport(true);
    try {
      const res = await axiosInstance.get("/auth/account-report");
      setAccountReport(res.data.data);
      toast.success("Account report ready for download! 📄");
    } catch (err) {
      toast.error("Failed to generate account report");
    } finally {
      setIsRequestingReport(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true);
    try {
      await axiosInstance.delete("/auth/delete-account");
      toast.success("Your account has been deleted");
      close();
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const drawerRef = useRef(null);

  const close = () => {
    setSettingsOpen(false);
    setActiveSubView(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        close();
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const currentUserObj = authUser?.data || authUser;
  const userName = currentUserObj?.firstName
    ? `${currentUserObj.firstName} ${currentUserObj.lastName || ""}`.trim()
    : "User";
  const userEmail = currentUserObj?.email || "";
  const inviteCode = currentUserObj?.inviteCode || currentUserObj?._id?.slice(-8).toUpperCase() || "MH-USER";

  const handleUpdateProfile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImg(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("profilePic", file);
    await updateProfile(formData);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const SETTINGS_SECTIONS = [
    {
      id: "profile",
      title: "Profile",
      subtitle: "Name, profile picture, username",
      icon: User,
      action: () => setActiveSubView("profile"),
    },
    {
      id: "account",
      title: "Account",
      subtitle: "Security notifications, account info",
      icon: Key,
      action: () => setActiveSubView("account"),
    },
    {
      id: "privacy",
      title: "Privacy",
      subtitle: "Blocked contacts, disappearing messages",
      icon: Lock,
      action: () => setActiveSubView("privacy"),
    },
    {
      id: "chats",
      title: "Chats",
      subtitle: "Theme, wallpaper, chat settings",
      icon: MessageSquare,
      action: () => setActiveSubView("chats"),
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Messages, groups, sounds",
      icon: Bell,
      action: () => setActiveSubView("notifications"),
    },
    {
      id: "shortcuts",
      title: "Keyboard shortcuts",
      subtitle: "Quick actions",
      icon: Keyboard,
      action: () => setActiveSubView("shortcuts"),
    },
    {
      id: "help",
      title: "Help and feedback",
      subtitle: "Help centre, contact us, privacy policy",
      icon: HelpCircle,
      action: () => setActiveSubView("help"),
    },
    {
      id: "logout",
      title: "Log out",
      subtitle: "",
      icon: LogOut,
      isDanger: true,
      action: () => {
        close();
        logout();
      },
    },
  ];

  /* ────────────────────────────────────────
     HEADER TITLE
  ──────────────────────────────────────── */

  const headerTitle =
    activeSubView === "wallpaper"
      ? "Set chat wallpaper"
      : activeSubView === "chats"
      ? "Chats"
      : activeSubView === "themes"
      ? "Chats & Themes"
      : activeSubView === "shortcuts"
      ? "Keyboard Shortcuts"
      : activeSubView === "profile"
      ? "Profile"
      : activeSubView === "account"
      ? "Account"
      : activeSubView === "security-notifications"
      ? "Security notifications"
      : activeSubView === "request-account-info"
      ? "Request account info"
      : activeSubView === "how-to-delete-account"
      ? "How to delete my account"
      : activeSubView === "privacy"
      ? "Privacy"
      : activeSubView === "notifications"
      ? "Notifications"
      : activeSubView === "help"
      ? "Help and feedback"
      : userName;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={close}
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 animate-fade-in"
      />

      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-base-100 border-l border-base-300 shadow-2xl flex flex-col animate-slide-in-right"
      >
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-100 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          {activeSubView && (
            <button
              onClick={() => setActiveSubView(null)}
              className="p-1 rounded-full hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors flex-shrink-0"
              title="Back"
            >
              <ChevronRight className="size-5 rotate-180" />
            </button>
          )}
          <h2 className="text-xl font-extrabold text-base-content tracking-tight truncate">
            {headerTitle}
          </h2>
        </div>
        <button
          onClick={close}
          className="p-1.5 rounded-full hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors flex-shrink-0"
          title="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ══════════════════════════════════
            ACCOUNT SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "account" && (
          <div className="p-5 space-y-1 animate-fade-in">
            {[
              {
                icon: Shield,
                label: "Security notifications",
                action: () => toast("Security notifications settings coming soon"),
              },
              {
                icon: FileText,
                label: "Request account info",
                action: () => toast("Account info request sent!"),
              },
              {
                icon: Info,
                label: "How to delete my account",
                action: () => toast("Visit settings on web to delete your account"),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full px-4 py-4 rounded-2xl flex items-center gap-4 hover:bg-base-200/70 transition-all text-left group"
                >
                  <div className="size-10 rounded-2xl bg-base-200 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="size-5 text-base-content/60 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════
            PRIVACY SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "privacy" && (
          <div className="animate-fade-in">
            {/* Who can see my personal info */}
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Who can see my personal info</p>
            </div>
            <div className="px-3 space-y-0">
              {[
                { label: "Last seen and online", value: "Everyone" },
                { label: "Profile picture", value: "My contacts" },
                { label: "About", value: "Everyone" },
                { label: "Status", value: "My contacts" },
              ].map((item, i, arr) => (
                <button
                  key={item.label}
                  onClick={() => toast(`${item.label} visibility settings coming soon`)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-base-content/50">{item.value}</p>
                  </div>
                  <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              ))}

              {/* Read receipts toggle */}
              <div className="px-4 py-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-base-content">Read receipts</p>
                  <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed max-w-[240px]">
                    If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => {
                    setReadReceipts(e.target.checked);
                    toast(e.target.checked ? "Read receipts enabled" : "Read receipts disabled");
                  }}
                  className="toggle toggle-success mt-1 flex-shrink-0"
                />
              </div>
            </div>

            {/* Disappearing messages */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Disappearing messages</p>
            </div>
            <div className="px-3">
              <button
                onClick={() => toast("Disappearing message timer settings coming soon")}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group rounded-2xl"
              >
                <div>
                  <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                    Default message timer
                  </p>
                  <p className="text-xs text-base-content/50">Off</p>
                </div>
                <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            PROFILE SUB-VIEW (Full ProfilePage)
        ══════════════════════════════════ */}
        {activeSubView === "profile" && (
          <div className="p-5 space-y-6 animate-fade-in">

            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={selectedImg || currentUserObj?.profilePic || avatarLogo}
                  alt="Profile"
                  className="size-28 rounded-full object-cover border-4 border-base-200 shadow-lg"
                />
                <label
                  htmlFor="drawer-avatar-upload"
                  className={`absolute bottom-0 right-0 bg-primary hover:scale-105 p-2.5 rounded-full cursor-pointer transition-all duration-200 shadow-md text-primary-content ${
                    isUpdateProfile ? "animate-pulse pointer-events-none" : ""
                  }`}
                >
                  <Camera className="size-4" />
                  <input
                    type="file"
                    id="drawer-avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpdateProfile}
                    disabled={isUpdateProfile}
                  />
                </label>
              </div>
              <p className="text-xs text-base-content/50">
                {isUpdateProfile ? "Uploading photo..." : "Click camera icon to update your photo"}
              </p>
            </div>

            {/* User name + email */}
            <div className="text-center -mt-2">
              <h3 className="text-base font-bold text-base-content">{userName}</h3>
              <p className="text-xs text-base-content/50">{userEmail}</p>
            </div>

            {/* Invite Code */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <QrCode className="size-4 text-primary" />
                Your Unique Invite Code
              </div>
              <div className="px-4 py-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                <span className="text-base font-mono font-bold text-primary tracking-widest">
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="btn btn-xs btn-primary gap-1 shadow-sm rounded-lg"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <User className="size-4 text-primary" />
                Full Name
              </div>
              <div className="px-4 py-3 bg-base-200 rounded-xl border border-base-300 text-sm font-medium text-base-content">
                {currentUserObj?.firstName} {currentUserObj?.lastName}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                Email Address
              </div>
              <div className="px-4 py-3 bg-base-200 rounded-xl border border-base-300 text-sm font-medium text-base-content">
                {currentUserObj?.email}
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-base-200 rounded-xl p-5 border border-base-300 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-base-content">Account Details</h2>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-base-300">
                  <span className="flex items-center gap-2 text-base-content/60">
                    <Calendar className="size-3.5" />
                    Member Since
                  </span>
                  <span className="font-semibold text-base-content">
                    {currentUserObj?.createdAt?.split("T")[0] || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-base-content/60">
                    <Shield className="size-3.5" />
                    Account Status
                  </span>
                  <span className="badge badge-success badge-sm gap-1">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ACCOUNT MAIN SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "account" && (
          <div className="p-4 space-y-3 animate-fade-in">
            {/* Security notifications option */}
            <button
              type="button"
              onClick={() => setActiveSubView("security-notifications")}
              className="w-full p-4 rounded-2xl bg-base-200/50 hover:bg-base-200 border border-base-300 flex items-center gap-4 text-left transition-all group"
            >
              <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-base-content group-hover:text-emerald-600 transition-colors">
                  Security notifications
                </p>
              </div>
              <ChevronRight className="size-4 text-base-content/30 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>

            {/* Request account info option */}
            <button
              type="button"
              onClick={() => setActiveSubView("request-account-info")}
              className="w-full p-4 rounded-2xl bg-base-200/50 hover:bg-base-200 border border-base-300 flex items-center gap-4 text-left transition-all group"
            >
              <div className="size-11 rounded-2xl bg-base-300/60 text-base-content/70 flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-base-content group-hover:text-primary transition-colors">
                  Request account info
                </p>
              </div>
              <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors shrink-0" />
            </button>

            {/* How to delete my account option */}
            <button
              type="button"
              onClick={() => setActiveSubView("how-to-delete-account")}
              className="w-full p-4 rounded-2xl bg-base-200/50 hover:bg-base-200 border border-base-300 flex items-center gap-4 text-left transition-all group"
            >
              <div className="size-11 rounded-2xl bg-base-300/60 text-base-content/70 flex items-center justify-center shrink-0">
                <Info className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-base-content group-hover:text-error transition-colors">
                  How to delete my account
                </p>
              </div>
              <ChevronRight className="size-4 text-base-content/30 group-hover:text-error transition-colors shrink-0" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════
            SECURITY NOTIFICATIONS SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "security-notifications" && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <div className="size-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Shield className="size-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-extrabold text-base-content">
                Show security notifications on this computer
              </h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Get notified when your security code changes for a contact's phone in an end-to-end encrypted chat. If you have multiple devices, this setting must be enabled on each device where you want to get notifications.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-base-content">Show security notifications</p>
                <p className="text-xs text-base-content/50 mt-0.5">Receive alerts when encryption keys change</p>
              </div>
              <input
                type="checkbox"
                checked={securityNotifications}
                onChange={(e) => {
                  setSecurityNotifications(e.target.checked);
                  localStorage.setItem("mh_sec_notif", String(e.target.checked));
                  toast.success(e.target.checked ? "Security notifications enabled" : "Security notifications disabled");
                }}
                className="toggle toggle-success flex-shrink-0"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-base-200/40 border border-base-300/60 flex items-center gap-3 text-xs text-base-content/70">
              <Lock className="size-4 text-emerald-500 shrink-0" />
              <span>Your chats and calls are end-to-end encrypted using Signal Protocol P-256</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            REQUEST ACCOUNT INFO SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "request-account-info" && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20 text-center space-y-3">
              <div className="size-14 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <FileText className="size-7 stroke-[2]" />
              </div>
              <h3 className="text-base font-extrabold text-base-content">
                Request Account Information Report
              </h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Create a report of your MessageHub account information and settings, which you can access or port to another app. This report does not include your personal chat messages.
              </p>
            </div>

            {accountReport ? (
              <div className="p-4 rounded-2xl bg-base-200/70 border border-base-300 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-success">
                  <span className="flex items-center gap-1.5"><Check className="size-4" /> Report Ready</span>
                  <span className="opacity-70 font-mono">{new Date(accountReport.generatedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-base-content/70">Your account details, security logs, and settings report has been generated.</p>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(accountReport, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `messagehub-account-report-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Account report downloaded! 📄");
                  }}
                  className="btn btn-sm btn-primary w-full rounded-xl flex items-center justify-center gap-2"
                >
                  <Download className="size-4" /> Download Report (JSON)
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isRequestingReport}
                onClick={handleRequestAccountReport}
                className="btn btn-primary w-full rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md"
              >
                {isRequestingReport ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <FileText className="size-4" />
                )}
                <span>{isRequestingReport ? "Generating Report..." : "Request Report"}</span>
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            HOW TO DELETE MY ACCOUNT SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "how-to-delete-account" && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Info className="size-5 shrink-0" />
                <span>Deleting your account will:</span>
              </div>
              <ul className="text-xs space-y-1.5 pl-6 list-disc opacity-90 leading-relaxed">
                <li>Delete your profile and user data from MessageHub</li>
                <li>Erase all your sent and received message history</li>
                <li>Remove you from all your MessageHub groups and channels</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
              <p className="text-xs text-base-content/70 leading-relaxed">
                Deleting your account is permanent and cannot be undone. To proceed, click the button below.
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn btn-error w-full rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <LogOut className="size-4" /> Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            THEMES SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "themes" && (
          <div className="p-5 space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                Choose Color Theme
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {THEMES.map((t) => {
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
                        className="relative h-7 w-full rounded-xl overflow-hidden border border-base-300"
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
                        className={`text-xs font-semibold truncate text-center ${
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

            {/* Live Chat Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-base-content/70">
                <Eye className="size-4 text-primary" /> Live Preview
              </div>
              <div className="rounded-2xl border border-base-300 overflow-hidden shadow-md" data-theme={theme}>
                <div className="p-3 bg-base-100 border-b border-base-300 flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary text-primary-content font-bold text-[10px] flex items-center justify-center">
                    M
                  </div>
                  <span className="text-xs font-bold text-base-content">Preview Chat</span>
                </div>
                <div className="p-3 bg-base-100 space-y-2 min-h-[120px]">
                  {PREVIEW_MESSAGES.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                          msg.isSent ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            SET CHAT WALLPAPER SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "wallpaper" && (
          <div className="p-5 space-y-5 animate-fade-in">
            {/* Checkbox: Add MessageHub doodles */}
            <label className="flex items-center justify-center gap-2.5 cursor-pointer py-1 select-none">
              <input
                type="checkbox"
                checked={showDoodles}
                onChange={(e) => {
                  setShowDoodles(e.target.checked);
                  toast(e.target.checked ? "Doodles pattern enabled" : "Doodles pattern disabled");
                }}
                className="checkbox checkbox-success checkbox-sm rounded-md"
              />
              <span className="text-xs font-semibold text-base-content">
                Add MessageHub doodles
              </span>
            </label>

            {/* Grid of solid wallpaper colors */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {WALLPAPER_COLORS.map((w) => {
                const isDefault = w.id === "default";
                const isSelected = isDefault
                  ? !wallpaper || wallpaper === "default" || wallpaper === "theme"
                  : (wallpaper || "").toLowerCase() === w.color.toLowerCase();

                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWallpaper(w.color);
                      toast.success(`Wallpaper set: ${w.name}`);
                    }}
                    title={w.name}
                    data-theme={isDefault ? theme : undefined}
                    className={`relative group aspect-square rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden border ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 scale-[1.04] shadow-lg"
                        : "border-base-300 hover:border-base-content/30 hover:scale-105"
                    } ${isDefault ? "bg-base-200 text-base-content" : ""}`}
                    style={{ backgroundColor: isDefault ? undefined : w.color }}
                  >
                    {/* Doodle Overlay Thumbnail */}
                    {showDoodles && (
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(rgba(128,128,128,0.3)_1px,transparent_1px)] [background-size:8px_8px]" />
                    )}

                    {/* App Theme Label */}
                    {isDefault && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
                        <span className="text-[10px] font-extrabold text-primary">App Theme</span>
                        <span className="text-[8px] text-base-content/60 font-medium">Default</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                        <Check className="size-4 text-primary font-extrabold shadow-sm" />
                      </div>
                    )}

                    {/* Hover Tooltip Label Pill */}
                    <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[9px] font-medium py-0.5 rounded text-center truncate">
                      {w.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            CHATS SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "chats" && (
          <div className="animate-fade-in">
            {/* Display */}
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Display</p>
            </div>
            <div className="px-3">
              <button
                onClick={() => setActiveSubView("themes")}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Theme</p>
                  <p className="text-xs text-base-content/50">System default</p>
                </div>
                <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
              <button
                onClick={() => setActiveSubView("wallpaper")}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
              >
                <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Wallpaper</p>
                <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            </div>

            {/* Chat settings */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Chat settings</p>
            </div>
            <div className="px-3">
              <button
                onClick={() => toast("Media upload quality settings coming soon")}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
              >
                <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Media upload quality</p>
                <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
              <button
                onClick={() => toast("Media auto-download settings coming soon")}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
              >
                <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Media auto-download</p>
                <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            NOTIFICATIONS SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "notifications" && (
          <div className="animate-fade-in">
            {/* Message / Group / Status rows */}
            <div className="px-3 pt-3">
              {[
                { icon: MessageCircle, label: "Messages", value: "Off" },
                { icon: Users, label: "Groups", value: "Off" },
                { icon: Radio, label: "Status", value: "Off" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => toast(`${item.label} notification settings coming soon`)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-base-200/60 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-2xl bg-base-200 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="size-5 text-base-content/60 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-xs text-base-content/50">{item.value}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="border-t border-base-300 mx-5 my-1" />

            {/* Toggles */}
            <div className="px-5 space-y-0">
              {[
                {
                  label: "Show previews",
                  desc: "Preview message text inside message notifications.",
                  value: showPreviews,
                  set: setShowPreviews,
                },
                {
                  label: "Play sound for outgoing messages",
                  desc: null,
                  value: playSound,
                  set: setPlaySound,
                },
                {
                  label: "Background sync",
                  desc: "Get faster performance by syncing messages in the background.",
                  value: bgSync,
                  set: setBgSync,
                },
              ].map((item) => (
                <div key={item.label} className="py-4 flex items-start justify-between gap-4 border-b border-base-300/50 last:border-none">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-base-content">{item.label}</p>
                    {item.desc && <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">{item.desc}</p>}
                  </div>
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={(e) => {
                      item.set(e.target.checked);
                      toast(item.label + (e.target.checked ? " enabled" : " disabled"));
                    }}
                    className="toggle toggle-success mt-0.5 flex-shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-5 py-4 border-t border-base-300">
              <p className="text-xs text-base-content/40 leading-relaxed">
                To get notifications, make sure they're turned on in your browser and device settings.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            HELP & FEEDBACK SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "help" && (
          <div className="animate-fade-in">
            <div className="px-3 pt-3 space-y-0">
              {[
                { icon: HelpCircle, label: "Help Centre", desc: "Frequently asked questions", action: () => toast("Opening help centre...") },
                { icon: MessageCircle, label: "Contact us", desc: "Chat with support to get answers", action: () => toast("Opening support chat...") },
                { icon: Flag, label: "Send feedback", desc: "Technical issues, suggestions", action: () => toast("Opening feedback form...") },
                { icon: FileText, label: "Terms and Privacy Policy", desc: null, action: () => toast("Opening terms...") },
                { icon: Info, label: "Channels reports", desc: null, action: () => toast("Opening channel reports...") },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full px-4 py-4 flex items-center gap-4 hover:bg-base-200/60 transition-all text-left group"
                  >
                    <div className="size-10 rounded-2xl bg-base-200 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon className="size-5 text-base-content/60 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">{item.label}</p>
                      {item.desc && <p className="text-xs text-base-content/50">{item.desc}</p>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-base-300 mx-5 my-1" />

            {/* Join the beta toggle */}
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-base-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FlaskConical className="size-5 text-base-content/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Join the beta</p>
                  <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed max-w-[200px]">
                    Get new features before they are released. Report bugs using the Contact us form above.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={joinBeta}
                onChange={(e) => {
                  setJoinBeta(e.target.checked);
                  toast(e.target.checked ? "Joined the beta program!" : "Left the beta program");
                }}
                className="toggle toggle-success mt-1 flex-shrink-0"
              />
            </div>

            <div className="border-t border-base-300 mx-5" />

            {/* Version */}
            <div className="py-4 text-center">
              <p className="text-xs text-base-content/40">Version 2.3000.1043697885</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            SHORTCUTS SUB-VIEW
        ══════════════════════════════════ */}
        {activeSubView === "shortcuts" && (
          <div className="p-5 space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              Quick Shortcuts
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "New Chat", keys: "Ctrl + N" },
                { label: "Search", keys: "Ctrl + F" },
                { label: "Toggle Settings", keys: "Ctrl + ," },
                { label: "Close / Back", keys: "Esc" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-base-200/50 border border-base-300 flex justify-between items-center"
                >
                  <span className="text-base-content font-medium">{s.label}</span>
                  <kbd className="kbd kbd-xs">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            MAIN LIST VIEW
        ══════════════════════════════════ */}
        {!activeSubView && (
          <>
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center pt-8 pb-6 px-5 border-b border-base-300">
              <div
                className="relative group cursor-pointer"
                onClick={() => setActiveSubView("profile")}
              >
                <img
                  src={selectedImg || currentUserObj?.profilePic || avatarLogo}
                  alt="Profile"
                  className="size-24 rounded-full object-cover border-4 border-base-200 shadow-lg group-hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* E2EE Signal Security Badge Card */}
            <div className="mx-4 mt-3 mb-1 p-3.5 bg-gradient-to-r from-success/10 via-primary/10 to-base-200 border border-success/30 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-success/20 text-success flex items-center justify-center font-bold">
                  <Shield className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-base-content">E2EE Protected</span>
                    <span className="badge badge-success badge-xs font-mono text-[9px] text-white">Signal P-256</span>
                  </div>
                  <p className="text-[10px] text-base-content/60">Your chats & media are encrypted end-to-end</p>
                </div>
              </div>
            </div>

            {/* Options List */}
            <div className="p-3 space-y-0.5">
              {SETTINGS_SECTIONS.map((sec) => {
                const IconComponent = sec.icon;
                if (sec.isDanger) {
                  return (
                    <React.Fragment key={sec.id}>
                      <div className="border-t border-base-300 my-3 mx-1" />
                      <button
                        onClick={sec.action}
                        className="w-full px-4 py-3 rounded-2xl flex items-center gap-4 hover:bg-error/10 transition-all text-left"
                      >
                        <div className="size-10 rounded-2xl bg-error/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="size-5 text-error" />
                        </div>
                        <span className="text-sm font-bold text-error">{sec.title}</span>
                      </button>
                    </React.Fragment>
                  );
                }
                return (
                  <button
                    key={sec.id}
                    onClick={sec.action}
                    className="w-full px-4 py-3 rounded-2xl flex items-center justify-between hover:bg-base-200/70 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-10 rounded-2xl bg-base-200 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                        <IconComponent className="size-5 text-base-content/60 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-base-content group-hover:text-primary transition-colors truncate">
                          {sec.title}
                        </p>
                        {sec.subtitle && (
                          <p className="text-xs text-base-content/50 truncate">{sec.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl p-6 max-w-sm w-full border border-base-300 shadow-2xl space-y-4 animate-scale-up">
            <div className="size-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <LogOut className="size-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-base-content">Delete Account Permanently?</h3>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Are you sure you want to delete your MessageHub account? This will erase all your messages, chats, and groups forever.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-sm btn-ghost flex-1 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccountConfirm}
                className="btn btn-sm btn-error text-white flex-1 rounded-xl"
              >
                {isDeletingAccount ? <span className="loading loading-spinner loading-xs" /> : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default SettingsDrawer;
