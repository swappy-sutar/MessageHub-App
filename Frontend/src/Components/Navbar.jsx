import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import {
  LogOut,
  MessageCircle,
  Settings,
  Palette,
  User,
  Bell,
  Check,
  X,
  UserPlus,
  MessageSquare,
  Camera,
  MoreVertical,
} from "lucide-react";
import InviteFriendModal from "./InviteFriendModal";
import CameraCaptureModal from "./CameraCaptureModal";
import MessageHubLogo from "./MessageHubLogo";
import avatarLogo from "../assets/avatar.png";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { unreadCounts, setSelectedUser, users, toggleSettings } = useChatStore();
  const { receivedInvites, acceptInvite, rejectInvite } = useFriendStore();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const notifRef = useRef(null);
  const menuRef = useRef(null);

  const currentUserObj = authUser?.data || authUser;

  // Compute total unread messages & notifications
  const totalUnreadMessages = Object.values(unreadCounts || {}).reduce((acc, curr) => acc + curr, 0);
  const totalNotifications = (receivedInvites || []).length + totalUnreadMessages;

  // Click outside listener for notification dropdown & 3-dots menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCameraClick = () => {
    if (authUser) {
      setIsCameraModalOpen(true);
    }
  };

  return (
    <>
      <header className="bg-base-100/90 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto px-4 h-14">
          <div className="flex items-center justify-between h-full">
            {/* Left: Brand Logo & Title */}
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-85 transition-all group"
            >
              <MessageHubLogo variant="lockup" size="md" />
            </Link>

            {/* Right: Action Icons (Camera, Notifications, Profile Dropdown) */}
            <div className="flex items-center gap-2">
              {authUser && (
                <>
                  {/* Camera Button */}
                  <button
                    onClick={handleCameraClick}
                    className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:bg-base-200 transition-colors"
                    title="Open Camera"
                  >
                    <Camera className="w-5 h-5 text-base-content/70" />
                  </button>

                  {/* Bell Notification Icon */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => {
                        setIsNotifOpen(!isNotifOpen);
                        setIsMenuOpen(false);
                      }}
                      className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:bg-base-200 transition-colors relative"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5 text-base-content/70" />
                      {totalNotifications > 0 && (
                        <span className="absolute top-1 right-1 size-2.5 bg-error rounded-full ring-2 ring-base-100 animate-pulse" />
                      )}
                    </button>

                    {/* Notification Dropdown Box */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-fade-in-up">
                        <div className="flex items-center justify-between border-b border-base-300 pb-2 px-1">
                          <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                            <Bell className="size-3.5 text-primary" /> Notifications
                          </h3>
                          <span className="badge badge-primary badge-sm font-bold">
                            {totalNotifications}
                          </span>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                          {/* Received Friend Invites */}
                          {receivedInvites.map((invite) => (
                            <div
                              key={invite._id}
                              className="p-2.5 rounded-xl bg-base-200/60 border border-base-300 flex flex-col gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={invite.senderId?.profilePic || avatarLogo}
                                  alt={invite.senderId?.firstName}
                                  className="size-7 rounded-full object-cover"
                                />
                                <div className="text-xs truncate">
                                  <span className="font-bold text-base-content">
                                    {invite.senderId?.firstName} {invite.senderId?.lastName}
                                  </span>
                                  <p className="text-[10px] text-base-content/60">
                                    Sent you a friend invite
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => acceptInvite(invite.senderId?._id)}
                                  className="btn btn-xs btn-primary flex-1 gap-1 rounded-lg"
                                >
                                  <Check className="size-3" /> Accept
                                </button>
                                <button
                                  onClick={() => rejectInvite(invite.senderId?._id)}
                                  className="btn btn-xs btn-ghost border border-base-300 flex-1 gap-1 rounded-lg text-error"
                                >
                                  <X className="size-3" /> Decline
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Unread Chat Message Notifications */}
                          {Object.entries(unreadCounts).map(([senderId, count]) => {
                            if (count <= 0) return null;
                            const senderUser = users.find((u) => String(u._id) === String(senderId));
                            if (!senderUser) return null;

                            return (
                              <div
                                key={senderId}
                                onClick={() => {
                                  setSelectedUser(senderUser);
                                  setIsNotifOpen(false);
                                }}
                                className="p-2.5 rounded-xl bg-base-200/60 border border-base-300 flex items-center justify-between hover:bg-base-200 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="size-7 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="size-3.5 text-success" />
                                  </div>
                                  <div className="truncate text-xs">
                                    <span className="font-semibold text-base-content block truncate">
                                      {senderUser.firstName} {senderUser.lastName}
                                    </span>
                                    <span className="text-[10px] text-primary font-medium">
                                      {count} new message{count > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                                <span className="badge badge-primary badge-xs">
                                  {count}
                                </span>
                              </div>
                            );
                          })}

                          {totalNotifications === 0 && (
                            <div className="text-center py-6 text-xs text-base-content/40">
                              No new notifications
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile Avatar Button - DIRECTLY OPENS SETTINGS DRAWER */}
                  <button
                    onClick={() => {
                      toggleSettings();
                      setIsNotifOpen(false);
                    }}
                    className="btn btn-sm btn-ghost btn-circle p-0.5 border border-base-300 hover:border-primary transition-all overflow-hidden cursor-pointer"
                    title="Open Settings Drawer"
                  >
                    <img
                      src={currentUserObj?.profilePic || avatarLogo}
                      alt="Account Settings"
                      className="size-full rounded-full object-cover hover:scale-105 transition-transform"
                    />
                  </button>
                </>
              )}

              {!authUser && (
                <Link
                  to="/settings"
                  className="btn btn-sm btn-ghost gap-2 border border-base-300 hover:bg-base-200 transition-colors"
                >
                  <Palette className="w-4 h-4 text-base-content/70" />
                  <span className="text-xs font-medium">Themes</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Invite Friends Modal triggerable from 3-dots menu */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Live Camera Photo Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
