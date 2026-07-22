import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../utils/formatMessageTime.js";
import avatar from "../assets/avatar.png";
import InviteFriendModal from "./InviteFriendModal";

function Sidebar() {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } =
    useChatStore();
  const { onlineUsers, socket } = useAuthStore();
  const { receivedInvites, getInvites, initInviteListeners } = useFriendStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
    getInvites();
  }, [getUsers, getInvites]);

  useEffect(() => {
    if (socket) {
      initInviteListeners();
    }
  }, [socket, initInviteListeners]);

  const filteredUsers = users
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true))
    .filter((user) => {
      if (!searchQuery) return true;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col border-r border-base-300 bg-base-100 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="size-4 text-primary" />
            </div>
            <span className="font-semibold text-sm text-base-content">
              Contacts
            </span>
          </div>

          {/* Invite Friend Action Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-xs btn-primary gap-1 shadow-sm rounded-lg"
            title="Invite new friend"
          >
            <UserPlus className="size-3" />
            <span>Invite</span>
            {receivedInvites.length > 0 && (
              <span className="badge badge-error badge-xs font-mono text-[9px] text-white">
                {receivedInvites.length}
              </span>
            )}
          </button>
        </div>

        {/* WhatsApp Style Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask AI or Search contacts..."
            className="w-full pl-9 pr-3 py-2 input input-bordered input-sm bg-base-200/80 text-xs text-base-content focus:input-primary rounded-2xl"
          />
        </div>

        {/* Online filter */}
        <div className="flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary"
            />
            <span className="text-xs text-base-content/70">Online only</span>
          </label>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/10 text-success border border-success/20">
            {Math.max(0, onlineUsers.length - 1)} online
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="overflow-y-auto flex-1 py-2">
        {filteredUsers.map((user) => {
          const isSelected = selectedUser?._id === user._id;
          const isOnline = onlineUsers.includes(user._id);
          const unreadCount = unreadCounts[user._id] || unreadCounts[String(user._id)] || 0;

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 transition-colors duration-200 hover:bg-base-200 ${
                isSelected
                  ? "bg-base-200 ring-1 ring-primary/20 border-l-4 border-primary"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="size-11 object-cover rounded-full border border-base-300"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-base-100 online-pulse" />
                )}
              </div>

              {/* User info & Unread Row (WhatsApp / Telegram Style) */}
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-semibold text-sm truncate ${
                      isSelected ? "text-primary" : "text-base-content"
                    }`}
                  >
                    {user.firstName} {user.lastName}
                  </span>

                  {/* Timestamp */}
                  {user.lastMessageTime && (
                    <span
                      className={`text-[10px] font-medium flex-shrink-0 ${
                        unreadCount > 0 ? "text-success font-bold" : "text-base-content/40"
                      }`}
                    >
                      {formatMessageTime(user.lastMessageTime)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  {/* Last Message Preview Text */}
                  <span className="text-xs text-base-content/60 truncate max-w-[140px] sm:max-w-[170px]">
                    {user.lastMessageText || (isOnline ? "Online" : "Offline")}
                  </span>

                  {/* WhatsApp-style Green Circular Unread Count Badge */}
                  {unreadCount > 0 && (
                    <span className="badge badge-success badge-sm rounded-full font-bold text-[11px] min-w-[20px] h-[20px] p-0 flex items-center justify-center text-white shadow-md animate-pulse flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-10 px-4 space-y-3">
            <Users className="size-8 mx-auto text-base-content/20" />
            <p className="text-xs text-base-content/50">
              {searchQuery ? "No matching contacts found." : "No friends added yet!"}
            </p>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="btn btn-sm btn-primary gap-1 rounded-xl mx-auto shadow-md"
            >
              <UserPlus className="size-4" />
              Invite Friends Now
            </button>
          </div>
        )}
      </div>

      {/* Invite Friend Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </aside>
  );
}

export default Sidebar;