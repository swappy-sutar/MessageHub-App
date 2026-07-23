import React, { useState, useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import { X, Search, UserPlus, Check, Inbox, Copy, QrCode, Sparkles, Link, Share2 } from "lucide-react";
import avatar from "../assets/avatar.png";

function InviteFriendModal({ isOpen, onClose }) {
  const { authUser, checkAuth } = useAuthStore();
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

  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'invites'
  const [query, setQuery] = useState("");
  const [codeInputValue, setCodeInputValue] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myInviteCode);
    setCopiedCode(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
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
              <UserPlus className="size-4 text-primary" />
            </div>
            <h3 className="font-bold text-base text-base-content">Invite Friends</h3>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Shareable Invite Link Card */}
        <div className="p-4 bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/5 border-b border-base-300 space-y-2.5">
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

        {/* Tab switcher */}
        <div className="flex border-b border-base-300 bg-base-100">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "search"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Search className="size-3.5" />
            Enter Code / Search
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors relative ${
              activeTab === "invites"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Inbox className="size-3.5" />
            Pending Invites
            {receivedInvites.length > 0 && (
              <span className="badge badge-primary badge-xs font-mono">
                {receivedInvites.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        </div>
      </div>
    </div>
  );
}

export default InviteFriendModal;
