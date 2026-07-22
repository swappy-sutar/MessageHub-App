import React from "react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import avatar from "../assets/avatar.png";

function CallHistoryView() {
  const { users, messages, setSelectedUser } = useChatStore();
  const { startCall } = useCallStore();

  // Extract call logs from messages across users
  const callLogs = messages.filter(
    (m) => m.text && (m.text.startsWith("📹") || m.text.startsWith("📞"))
  );

  return (
    <div className="h-full w-full bg-base-100 flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-base-content">Calls</h2>
          <p className="text-xs text-base-content/60">Recent call history</p>
        </div>
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Phone className="size-5 text-primary" />
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 rounded-2xl bg-base-200/50 border border-base-300 hover:bg-base-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.profilePic || avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="size-12 rounded-full object-cover border border-base-300"
                  />
                  <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-base-100 flex items-center justify-center border border-base-300">
                    <PhoneIncoming className="size-3 text-success" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-base-content">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] opacity-70">Recent contact</span>
                  </p>
                </div>
              </div>

              {/* Call Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    startCall(user, "video");
                  }}
                  className="btn btn-sm btn-ghost btn-circle text-primary hover:bg-primary/10"
                  title="Start Video Call"
                >
                  <Video className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    startCall(user, "audio");
                  }}
                  className="btn btn-sm btn-ghost btn-circle text-success hover:bg-success/10"
                  title="Start Voice Call"
                >
                  <Phone className="size-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-base-content/40 space-y-2">
            <PhoneMissed className="size-10 mx-auto text-base-content/20" />
            <p className="text-xs">No recent call history</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallHistoryView;
