import React, { useState } from "react";
import { Users, X, Check, Image as ImageIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import avatar from "../assets/avatar.png";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { users } = useChatStore();
  const { createGroup, isGroupLoading } = useGroupStore();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  if (!isOpen) return null;

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: selectedMemberIds,
      });
      setGroupName("");
      setGroupDescription("");
      setSelectedMemberIds([]);
      onClose();
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="p-5 bg-base-200/50 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content">Create New Group</h3>
              <p className="text-xs text-base-content/60">Add details and select group members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Design Team 🚀"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="input input-bordered w-full rounded-2xl text-sm focus:input-primary"
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
              className="textarea textarea-bordered w-full rounded-2xl text-sm focus:textarea-primary resize-none"
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
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-base-300 rounded-2xl p-2 bg-base-200/30">
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
                            ? "bg-primary border-primary text-primary-content"
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGroupLoading || !groupName.trim()}
              className="btn btn-primary btn-sm rounded-xl text-xs font-bold px-5"
            >
              {isGroupLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
