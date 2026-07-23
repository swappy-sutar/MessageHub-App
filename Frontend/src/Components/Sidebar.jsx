import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, Plus, X } from "lucide-react";
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

  const isUserOnline = (userId) => {
    if (!userId || !onlineUsers) return false;
    return onlineUsers.some((id) => String(id) === String(userId));
  };

  const filteredUsers = users
    .filter((user) => (showOnlineOnly ? isUserOnline(user._id) : true))
    .filter((user) => {
      if (!searchQuery) return true;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

  const onlineCount = users.filter((u) => isUserOnline(u._id)).length;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col border-r border-base-300 bg-base-100 transition-colors duration-300 relative">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-base-300">
        <div className="hidden sm:flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="size-4 text-primary" />
            </div>
            <span className="font-semibold text-sm text-base-content">
              Contacts
            </span>
          </div>

          {/* Desktop/Laptop Top Invite Action Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="hidden sm:flex btn btn-xs btn-primary gap-1 shadow-sm rounded-lg"
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

        {/* Modern WhatsApp & iOS Styled Search Bar */}
        <div className="relative mb-3 group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-base-content/40">
            <Search className="size-4 transition-transform group-focus-within:scale-110" />
          </div>

          <input
            type="text"
            name="no-sidebar-search-history"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts or chat history..."
            className="w-full pl-9 pr-8 py-2 bg-base-200/70 hover:bg-base-200 text-xs text-base-content placeholder:text-base-content/40 border border-base-300/50 focus:border-primary/60 focus:bg-base-100 rounded-full focus:ring-2 focus:ring-primary/15 focus:outline-none shadow-inner transition-all duration-200 font-medium"
          />

          {/* Clear Search Input Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-base-content/40 hover:text-base-content hover:bg-base-300/80 transition-all cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Online Filter & Status Pill Badges */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 select-none cursor-pointer ${
              showOnlineOnly
                ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                : "bg-base-200/50 text-base-content/60 border-base-300/40 hover:bg-base-200 hover:text-base-content"
            }`}
          >
            <span className={`size-2 rounded-full ${showOnlineOnly ? "bg-success animate-pulse" : "bg-base-content/30"}`} />
            <span>Online only</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            <span className="size-1.5 rounded-full bg-success animate-ping" />
            <span>{onlineCount} online</span>
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="overflow-y-auto flex-1 py-2">
        {filteredUsers.map((user) => {
          const isSelected = selectedUser?._id === user._id;
          const isOnline = isUserOnline(user._id);
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

      {/* Mobile Floating Action Button (FAB) in Bottom Right Corner */}
      <button
        onClick={() => setIsInviteModalOpen(true)}
        className="sm:hidden absolute bottom-5 right-5 z-20 size-12 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all group cursor-pointer border-none"
        title="Invite new friend"
      >
        <Plus className="size-6 transition-transform group-hover:rotate-90 duration-300" />
        
        {receivedInvites.length > 0 && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center border-2 border-base-100 shadow-md">
            {receivedInvites.length}
          </span>
        )}
      </button>

      {/* Invite Friend Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </aside>
  );
}

export default Sidebar;