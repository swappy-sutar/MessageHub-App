import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Shield, Calendar, QrCode, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import avatarLogo from "../assets/avatar.png";

function ProfilePage() {
  const { authUser, isUpdateProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentUserObj = authUser?.data || authUser;
  const inviteCode = currentUserObj?.inviteCode || currentUserObj?._id || "MH-USER";

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImg(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("profilePic", file);
    await updateProfile(formData);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-base-200 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="bg-base-100 rounded-2xl p-6 sm:p-8 space-y-8 border border-base-300 shadow-xl">
          {/* Title Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-content">Profile</h1>
            <p className="text-sm text-base-content/60 mt-1">Your profile information</p>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || currentUserObj?.profilePic || avatarLogo}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-200 shadow-lg"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary hover:scale-105
                  p-2.5 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-md text-primary-content
                  ${isUpdateProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpdateProfile}
                  disabled={isUpdateProfile}
                />
              </label>
            </div>
            <p className="text-xs text-base-content/50">
              {isUpdateProfile ? "Uploading photo..." : "Click camera icon to update your photo"}
            </p>
          </div>

          {/* User Information Fields */}
          <div className="space-y-4">
            {/* Unique Invite Code Field */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                Your Unique Invite Code
              </div>
              <div className="px-4 py-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                <span className="text-base font-mono font-bold text-primary tracking-widest">
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="btn btn-xs btn-primary gap-1 shadow-sm rounded-lg"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </div>
              <div className="px-4 py-3 bg-base-200 rounded-xl border border-base-300 text-sm font-medium text-base-content">
                {currentUserObj?.firstName} {currentUserObj?.lastName}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </div>
              <div className="px-4 py-3 bg-base-200 rounded-xl border border-base-300 text-sm font-medium text-base-content">
                {currentUserObj?.email}
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="bg-base-200 rounded-xl p-5 border border-base-300 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-base-content">Account Details</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="flex items-center gap-2 text-base-content/60">
                  <Calendar className="w-3.5 h-3.5" />
                  Member Since
                </span>
                <span className="font-semibold text-base-content">
                  {currentUserObj?.createdAt?.split("T")[0] || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-base-content/60">
                  <Shield className="w-3.5 h-3.5" />
                  Account Status
                </span>
                <span className="badge badge-success badge-sm gap-1">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
