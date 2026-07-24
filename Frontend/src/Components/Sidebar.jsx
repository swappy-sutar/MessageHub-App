import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { usePresenceStore } from "../store/usePresenceStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, Plus, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../utils/formatMessageTime.js";
import avatar from "../assets/avatar.png";
import InviteFriendModal from "./InviteFriendModal";
import CreateGroupModal from "./CreateGroupModal";

function Sidebar() {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } =
    useChatStore();
  const { groups, getUserGroups } = useGroupStore();
  const { socket } = useAuthStore();
  const { onlineUsers } = usePresenceStore();
  const { receivedInvites, getInvites, initInviteListeners } = useFriendStore();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'chats' | 'groups'
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
    getInvites();
    getUserGroups();
  }, [getUsers, getInvites, getUserGroups]);

  useEffect(() => {
    if (socket) {
      initInviteListeners();
    }
  }, [socket, initInviteListeners]);

  const isUserOnline = (userId) => {
    if (!userId || !onlineUsers) return false;
    return onlineUsers.some((id) => String(id) === String(userId));
  };

  const safeUsers = users || [];
  const safeGroups = groups || [];

  // Filter direct contacts
  const filteredUsers = safeUsers
    .filter((user) => (showOnlineOnly ? isUserOnline(user._id) : true))
    .filter((user) => {
      if (!searchQuery) return true;
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

  // Filter groups
  const filteredGroups = safeGroups.filter((group) => {
    if (!searchQuery) return true;
    return (group.name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Build unified list sorted chronologically by latest message timestamp (newest message 1st!)
  const combinedItems = [];

  if (activeTab === "all" || activeTab === "chats") {
    filteredUsers.forEach((user) => {
      const timeVal = user.lastMessageTime ? new Date(user.lastMessageTime).getTime() : 0;
      combinedItems.push({
        ...user,
        itemType: "user",
        sortTime: timeVal,
      });
    });
  }

  if (activeTab === "all" || activeTab === "groups") {
    filteredGroups.forEach((group) => {
      const timeVal = group.lastMessageTime
        ? new Date(group.lastMessageTime).getTime()
        : group.updatedAt
        ? new Date(group.updatedAt).getTime()
        : 0;
      combinedItems.push({
        ...group,
        itemType: "group",
        sortTime: timeVal,
      });
    });
  }

  // Sort descending: newest message timestamp at the very top (1st)!
  combinedItems.sort((a, b) => b.sortTime - a.sortTime);

  const onlineCount = safeUsers.filter((u) => isUserOnline(u._id)).length;

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
              Chats & Groups
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="hidden sm:flex btn btn-xs btn-outline btn-primary gap-1 rounded-lg"
              title="Create new group"
            >
              <Plus className="size-3" />
              <span>Group</span>
            </button>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="hidden sm:flex btn btn-xs btn-primary gap-1 shadow-sm rounded-lg"
              title="Invite new friend"
            >
              <UserPlus className="size-3" />
              <span>Invite</span>
              {(receivedInvites || []).length > 0 && (
                <span className="badge badge-error badge-xs font-mono text-[9px] text-white">
                  {receivedInvites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
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
            placeholder="Search contacts or groups..."
            className="w-full pl-9 pr-8 py-2 bg-base-200/70 hover:bg-base-200 text-xs text-base-content placeholder:text-base-content/40 border border-base-300/50 focus:border-primary/60 focus:bg-base-100 rounded-full focus:ring-2 focus:ring-primary/15 focus:outline-none shadow-inner transition-all duration-200 font-medium"
          />

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

        {/* Filter Tabs & Online Toggle */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <div className="flex items-center gap-1 bg-base-200/60 p-0.5 rounded-full border border-base-300/40">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "all" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60"
              }`}
            >
              All ({filteredUsers.length + filteredGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chats")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "chats" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60"
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groups")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activeTab === "groups" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60"
              }`}
            >
              Groups ({filteredGroups.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all select-none cursor-pointer ${
              showOnlineOnly
                ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                : "bg-base-200/50 text-base-content/60 border-base-300/40 hover:bg-base-200"
            }`}
            title="Filter online contacts"
          >
            <span className={`size-2 rounded-full ${showOnlineOnly ? "bg-success animate-pulse" : "bg-base-content/30"}`} />
            <span className="hidden md:inline">Online</span>
          </button>
        </div>
      </div>

      {/* Main Unified Chat List (Sorted by Newest Message 1st) */}
      <div className="overflow-y-auto flex-1 py-2">
        {(isUsersLoading || isGroupLoading) && combinedItems.length === 0 ? (
          <SidebarSkeleton />
        ) : (
          combinedItems.map((item) => {
          if (item.itemType === "group") {
            const group = item;
            const isSelected = selectedUser?._id === group._id && selectedUser?.isGroup;
            return (
              <button
                key={`group-${group._id}`}
                onClick={() =>
                  setSelectedUser({
                    _id: group._id,
                    firstName: group.name,
                    lastName: "",
                    profilePic: group.profilePic || "",
                    isGroup: true,
                    membersCount: group.membersCount,
                  })
                }
                className={`w-full p-3 flex items-center gap-3 transition-colors duration-200 hover:bg-base-200 ${
                  isSelected ? "bg-base-200 ring-1 ring-primary/20 border-l-4 border-primary" : ""
                }`}
              >
                {/* Group Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="size-11 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
                    <Users className="size-5" />
                  </div>
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="badge badge-xs badge-primary font-mono text-[9px] px-1">
                        Group
                      </span>
                      <span className="font-semibold text-sm truncate text-base-content">
                        {group.name}
                      </span>
                    </div>

                    {group.lastMessageTime && (
                      <span className="text-[10px] font-medium text-base-content/40 flex-shrink-0">
                        {formatMessageTime(group.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-base-content/60 truncate max-w-[170px]">
                      {group.lastMessageText || `${group.membersCount || 0} members`}
                    </span>
                  </div>
                </div>
              </button>
            );
          } else {
            const user = item;
            const isSelected = selectedUser?._id === user._id && !selectedUser?.isGroup;
            const isOnline = isUserOnline(user._id);
            const unreadCount = unreadCounts?.[user._id] || unreadCounts?.[String(user._id)] || 0;

            return (
              <button
                key={`user-${user._id}`}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 flex items-center gap-3 transition-colors duration-200 hover:bg-base-200 ${
                  isSelected ? "bg-base-200 ring-1 ring-primary/20 border-l-4 border-primary" : ""
                }`}
              >
                {/* User Avatar */}
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

                {/* User Info */}
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isSelected ? "text-primary" : "text-base-content"
                      }`}
                    >
                      {user.firstName} {user.lastName}
                    </span>

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
                    <span className="text-xs text-base-content/60 truncate max-w-[170px]">
                      {user.lastMessageText || (isOnline ? "Online" : "Offline")}
                    </span>

                    {unreadCount > 0 && (
                      <span className="badge badge-success badge-sm rounded-full font-bold text-[11px] min-w-[20px] h-[20px] p-0 flex items-center justify-center text-white shadow-md animate-pulse flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          }
        }))}

        {combinedItems.length === 0 && (
          <div className="text-center py-10 px-4 space-y-3">
            <Users className="size-8 mx-auto text-base-content/20" />
            <p className="text-xs text-base-content/50">
              {searchQuery ? "No matching contacts or groups found." : "No chats yet!"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="btn btn-xs btn-outline btn-primary rounded-xl"
              >
                Create Group
              </button>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="btn btn-xs btn-primary rounded-xl"
              >
                Invite Friends
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Friend Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          getUserGroups();
        }}
      />
    </aside>
  );
}

export default Sidebar;