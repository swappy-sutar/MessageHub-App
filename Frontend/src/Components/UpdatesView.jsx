import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Plus, Sparkles, CircleDot, Clock } from "lucide-react";
import avatar from "../assets/avatar.png";

function UpdatesView() {
  const { authUser } = useAuthStore();
  const { users } = useChatStore();

  const currentUserPic = authUser?.data?.profilePic || authUser?.profilePic || avatar;

  return (
    <div className="h-full w-full bg-base-100 flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-base-content">Updates</h2>
          <p className="text-xs text-base-content/60">Status & stories</p>
        </div>
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-5 text-primary" />
        </div>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Status Horizontal Stories Bar */}
        <div>
          <h3 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Status
          </h3>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {/* My Status */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
              <div className="relative">
                <img
                  src={currentUserPic}
                  alt="My Status"
                  className="size-14 rounded-full object-cover border-2 border-base-300"
                />
                <div className="absolute bottom-0 right-0 size-5 rounded-full bg-primary text-primary-content flex items-center justify-center border-2 border-base-100">
                  <Plus className="size-3" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-base-content">My Status</span>
            </div>

            {/* Contacts Stories */}
            {users.map((user) => (
              <div
                key={user._id}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-amber-500">
                  <img
                    src={user.profilePic || avatar}
                    alt={user.firstName}
                    className="size-13 rounded-full object-cover border-2 border-base-100"
                  />
                </div>
                <span className="text-[11px] font-medium text-base-content/80 truncate w-14 text-center">
                  {user.firstName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Recent Status Updates
          </h3>

          {users.map((user, i) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-purple-500">
                  <img
                    src={user.profilePic || avatar}
                    alt={user.firstName}
                    className="size-11 rounded-full object-cover border-2 border-base-100"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-base-content">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-primary" />
                    {i === 0 ? "10 minutes ago" : `${i * 45} minutes ago`}
                  </p>
                </div>
              </div>
              <CircleDot className="size-4 text-primary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UpdatesView;
