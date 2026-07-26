import React, { useState, useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import toast from "../utils/toast.js";
import { X, Search, UserPlus, Check, Inbox, Copy, QrCode, Sparkles, Link, Share2, Users, Plus } from "lucide-react";
import avatar from "../assets/avatar.png";

function InviteFriendModal({ isOpen, onClose }) {
  const { authUser, checkAuth } = useAuthStore();
  const { users } = useChatStore();
  const { createGroup, isGroupLoading, getUserGroups } = useGroupStore();
  const {
    receivedInvites,
    sentInvites,
    searchResults,
    isSearching,
    getInvites,
    searchUsers,
    sendInvite,
    sendInviteByCode,
    acceptInvite,
    rejectInvite,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'invites' | 'createGroup'
  const [query, setQuery] = useState("");
  const [codeInputValue, setCodeInputValue] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const currentUserObj = authUser?.data || authUser;
  const myInviteCode = currentUserObj?.inviteCode || currentUserObj?._id || "MH-USER";
  const inviteLink = `${window.location.origin}/invite?code=${myInviteCode}`;

  useEffect(() => {
    if (isOpen) {
      getInvites();
      checkAuth();
    }
  }, [isOpen, getInvites, checkAuth]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on MessageHub",
          text: `Connect with me on MessageHub!`,
          url: inviteLink,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleConnectByCode = (e) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;
    sendInviteByCode(codeInputValue);
    setCodeInputValue("");
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name.");
      return;
    }

    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: selectedMemberIds,
      });
      toast.success(`Group "${groupName.trim()}" created successfully! 🎉`);
      setGroupName("");
      setGroupDescription("");
      setSelectedMemberIds([]);
      getUserGroups();
      onClose();
    } catch (err) {
      toast.error("Failed to create group. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {activeTab === "createGroup" ? (
                <Users className="size-4 text-primary" />
              ) : (
                <UserPlus className="size-4 text-primary" />
              )}
            </div>
            <h3 className="font-bold text-base text-base-content">
              {activeTab === "createGroup" ? "Create New Group" : "Invite & Connect"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Shareable Invite Link Banner */}
        <div className="p-3.5 bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/5 border-b border-base-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
              <Link className="size-3.5" /> Shareable Invite Link
            </span>
            <span className="text-[10px] font-mono text-base-content/50">
              Code: <strong className="text-primary">{myInviteCode}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 input input-xs bg-base-200 text-[11px] font-mono text-base-content/80 select-all border border-base-300 rounded-xl"
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-xs btn-primary gap-1 shadow-sm rounded-xl"
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="size-3" /> : <Link className="size-3" />}
              <span className="text-[11px]">{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
            <button
              onClick={handleShareLink}
              className="btn btn-xs btn-outline btn-primary p-1.5 shadow-sm rounded-xl"
              title="Share link"
            >
              <Share2 className="size-3" />
            </button>
          </div>
        </div>

        {/* 3 Tab Switcher: Search | Pending Invites | Create Group */}
        <div className="flex border-b border-base-300 bg-base-100">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "search"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Search className="size-3.5" />
            Search / Code
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors relative ${
              activeTab === "invites"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Inbox className="size-3.5" />
            Invites
            {receivedInvites.length > 0 && (
              <span className="badge badge-primary badge-xs font-mono">
                {receivedInvites.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("createGroup")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "createGroup"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Users className="size-3.5" />
            Create Group
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tab 1: Enter Code / Search Users */}
          {activeTab === "search" && (
            <div className="space-y-4">
              {/* Direct Code Input Form */}
              <form onSubmit={handleConnectByCode} className="space-y-2">
                <label className="text-xs font-semibold text-base-content/70">
                  Enter Friend's Invite Code, User ID, or Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value)}
                    placeholder="e.g. MH-8X2K9P or User ID"
                    className="flex-1 input input-bordered input-sm bg-base-200 text-xs text-base-content focus:input-primary rounded-xl"
                  />
                  <button type="submit" className="btn btn-sm btn-primary gap-1 rounded-xl">
                    <Sparkles className="size-3.5" />
                    Connect
                  </button>
                </div>
              </form>

              <div className="divider text-[10px] text-base-content/40 my-1">OR SEARCH BY NAME</div>

              {/* Name/Email Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 input input-bordered input-sm bg-base-200 text-xs text-base-content focus:input-primary rounded-xl"
                />
              </div>

              {/* Search Results */}
              {isSearching ? (
                <div className="text-center py-6 text-xs text-base-content/50">
                  Searching users...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-base-200/50 border border-base-300"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePic || avatar}
                          alt={user.firstName}
                          className="size-10 rounded-full object-cover border border-base-300"
                        />
                        <div>
                          <h4 className="font-semibold text-xs text-base-content">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-[10px] font-mono text-primary font-medium">
                            {user.inviteCode || user.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => sendInvite(user._id)}
                        className="btn btn-xs btn-primary gap-1 rounded-lg"
                      >
                        <UserPlus className="size-3" />
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-base-content/40 space-y-1">
                  <UserPlus className="size-8 mx-auto text-base-content/20 mb-1" />
                  <p>Type a name or email to search registered users.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Pending Invites */}
          {activeTab === "invites" && (
            <div className="space-y-4">
              {/* Incoming Received Invites */}
              <div>
                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
                  Received Invites ({receivedInvites.length})
                </h4>

                {receivedInvites.length > 0 ? (
                  <div className="space-y-2">
                    {receivedInvites.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-base-200/50 border border-base-300"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || avatar}
                            alt={user.firstName}
                            className="size-10 rounded-full object-cover border border-base-300"
                          />
                          <div>
                            <h5 className="font-semibold text-xs text-base-content">
                              {user.firstName} {user.lastName}
                            </h5>
                            <p className="text-[10px] font-mono text-primary font-medium">
                              Code: {user.inviteCode || user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => rejectInvite(user._id)}
                            className="btn btn-xs btn-ghost text-error"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => acceptInvite(user._id)}
                            className="btn btn-xs btn-success text-white gap-1"
                          >
                            <Check className="size-3" />
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-base-content/40 py-2">No pending received invites.</p>
                )}
              </div>

              {/* Sent Invites */}
              <div>
                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
                  Sent Invites ({sentInvites.length})
                </h4>

                {sentInvites.length > 0 ? (
                  <div className="space-y-2">
                    {sentInvites.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-base-200/30 border border-base-300"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || avatar}
                            alt={user.firstName}
                            className="size-9 rounded-full object-cover border border-base-300"
                          />
                          <div>
                            <h5 className="font-semibold text-xs text-base-content">
                              {user.firstName} {user.lastName}
                            </h5>
                            <p className="text-[10px] text-base-content/40">Pending approval...</p>
                          </div>
                        </div>

                        <span className="badge badge-ghost badge-sm text-[10px]">Sent</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-base-content/40 py-2">No outgoing invites sent.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Create New Group */}
          {activeTab === "createGroup" && (
            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Team 🚀"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="input input-bordered w-full rounded-2xl text-xs focus:input-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What is this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={2}
                  className="textarea textarea-bordered w-full rounded-2xl text-xs focus:textarea-primary resize-none"
                />
              </div>

              {/* Member Selection List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                    Select Members ({selectedMemberIds.length})
                  </label>
                  {selectedMemberIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds([])}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border border-base-300 rounded-2xl p-2 bg-base-200/30">
                  {(users || []).length === 0 ? (
                    <p className="text-xs text-base-content/50 text-center py-4">No contacts found</p>
                  ) : (
                    (users || []).map((u) => {
                      const isSelected = selectedMemberIds.includes(u._id);
                      return (
                        <div
                          key={u._id}
                          onClick={() => toggleMemberSelection(u._id)}
                          className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-base-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={u.profilePic || avatar}
                              alt={u.firstName}
                              className="size-8 rounded-full object-cover border border-base-300"
                            />
                            <div>
                              <p className="text-xs font-bold text-base-content">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[10px] text-base-content/50 truncate max-w-[180px]">
                                {u.email}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`size-5 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-base-300"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGroupLoading || !groupName.trim()}
                  className="btn btn-primary w-full gap-2 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg"
                >
                  {isGroupLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <Plus className="size-4" /> Create Group
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteFriendModal;
