import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import {
  LogOut,
  MessageCircle,
  Settings,
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
import { toast } from "react-hot-toast";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { unreadCounts, setSelectedUser, users } = useChatStore();
  const { receivedInvites, acceptInvite, rejectInvite } = useFriendStore();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Compute total unread messages & notifications
  const totalUnreadMessages = Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
  const totalNotifications = receivedInvites.length + totalUnreadMessages;

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
              className="flex items-center gap-2.5 hover:opacity-80 transition-all group"
            >
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-base-content tracking-tight">
                MessageHub
              </h1>
            </Link>

            {/* Right: Action Icons (Camera, Notifications, 3-Dots Menu) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {authUser && (
                <>
                  {/* Quick Live Camera Action Icon */}
                  <button
                    onClick={handleCameraClick}
                    className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:text-primary hover:bg-base-200 transition-colors"
                    title="Live Camera Photo Capture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  {/* Real-time Notification Bell Center */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => {
                        setIsNotifOpen(!isNotifOpen);
                        setIsMenuOpen(false);
                      }}
                      className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:bg-base-200 transition-colors relative"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-error text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                          {totalNotifications > 9 ? "9+" : totalNotifications}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown Panel */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-3 bg-base-200/50 border-b border-base-300 flex items-center justify-between">
                          <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                            <Bell className="size-3.5 text-primary" />
                            Notifications
                          </span>
                          {totalNotifications > 0 && (
                            <span className="badge badge-primary badge-xs">
                              {totalNotifications} new
                            </span>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
                          {/* Received Friend Invites */}
                          {receivedInvites.map((invite) => (
                            <div
                              key={invite._id}
                              className="p-2.5 rounded-xl bg-base-200/40 border border-base-300 flex items-center justify-between text-xs gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <UserPlus className="size-3.5 text-primary" />
                                </div>
                                <div className="truncate">
                                  <span className="font-semibold text-base-content block truncate">
                                    {invite.firstName} {invite.lastName}
                                  </span>
                                  <span className="text-[10px] text-base-content/50">
                                    Sent a friend invite
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => rejectInvite(invite._id)}
                                  className="btn btn-xs btn-ghost text-error"
                                >
                                  <X className="size-3" />
                                </button>
                                <button
                                  onClick={() => acceptInvite(invite._id)}
                                  className="btn btn-xs btn-success text-white"
                                >
                                  <Check className="size-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Unread Chat Messages */}
                          {Object.entries(unreadCounts).map(([userId, count]) => {
                            if (count <= 0) return null;
                            const senderUser = users.find(
                              (u) => String(u._id) === userId
                            );
                            if (!senderUser) return null;

                            return (
                              <div
                                key={userId}
                                onClick={() => {
                                  setSelectedUser(senderUser);
                                  setIsNotifOpen(false);
                                }}
                                className="p-2.5 rounded-xl bg-base-200/40 border border-base-300 flex items-center justify-between text-xs cursor-pointer hover:bg-base-200"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="size-7 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="size-3.5 text-success" />
                                  </div>
                                  <div className="truncate">
                                    <span className="font-semibold text-base-content block truncate">
                                      {senderUser.firstName} {senderUser.lastName}
                                    </span>
                                    <span className="text-[10px] text-primary font-medium">
                                      {count} new unread {count === 1 ? "message" : "messages"}
                                    </span>
                                  </div>
                                </div>

                                <span className="badge badge-primary badge-xs font-mono font-bold">
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

                  {/* 3-Dots Kebab Menu (⋮) */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setIsNotifOpen(false);
                      }}
                      className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:bg-base-200 transition-colors"
                      title="More Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* 3-Dots Dropdown Options Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-base-100 border border-base-300 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-fade-in-up">
                        <button
                          onClick={() => {
                            setIsInviteModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-base-content hover:bg-base-200 transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <UserPlus className="size-4 text-primary" />
                            Invite Friends
                          </span>
                          {receivedInvites.length > 0 && (
                            <span className="badge badge-error badge-xs text-white font-mono">
                              {receivedInvites.length}
                            </span>
                          )}
                        </button>

                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-base-content hover:bg-base-200 transition-colors"
                        >
                          <User className="size-4 text-primary" />
                          Profile
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-base-content hover:bg-base-200 transition-colors"
                        >
                          <Settings className="size-4 text-primary" />
                          Settings
                        </Link>

                        <div className="divider my-1 border-base-300" />

                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-error hover:bg-error/10 transition-colors"
                        >
                          <LogOut className="size-4 text-error" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!authUser && (
                <Link
                  to="/settings"
                  className="btn btn-sm btn-ghost gap-2 border border-base-300 hover:bg-base-200 transition-colors"
                >
                  <Settings className="w-4 h-4 text-base-content/70" />
                  <span className="text-xs font-medium">Settings</span>
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
