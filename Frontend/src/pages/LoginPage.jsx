import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Mail, Lock, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../Components/AuthImagePattern";
import ThemeSwitcher from "../Components/ThemeSwitcher";
import GoogleOAuthButton from "../Components/GoogleOAuthButton";
import { toast } from "react-hot-toast";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    const { email, password } = formData;
    if (!email.trim()) return toast.error("Email is required.");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email format.");
    if (!password) return toast.error("Password is required.");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) await login(formData);
  };

  return (
    <div className="flex pt-14 bg-gradient-to-br from-base-200 via-base-100 to-base-200 transition-colors duration-300 min-h-screen">
      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 overflow-y-auto relative">
        {/* Ambient Glow Blob */}
        <div className="absolute top-20 left-10 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-7 bg-base-100/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-base-300 shadow-2xl relative transition-all duration-300">
          {/* Top Right Theme Selector */}
          <div className="absolute top-5 right-5">
            <ThemeSwitcher />
          </div>

          {/* Logo & Header */}
          <div className="text-center pt-2">
            <div className="size-14 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner group hover:scale-110 transition-transform">
              <MessageCircle className="size-7 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-base-content tracking-tight">Welcome Back</h1>
            <p className="text-sm text-base-content/60 mt-1 font-normal">
              Sign in to continue your real-time conversations
            </p>
          </div>

          {/* Google OAuth Button matching screenshot */}
          <div className="space-y-3">
            <GoogleOAuthButton />
            <div className="flex items-center gap-3 my-2">
              <div className="h-[1px] bg-base-300 flex-1" />
              <span className="text-[11px] text-base-content/50 uppercase font-semibold">OR</span>
              <div className="h-[1px] bg-base-300 flex-1" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content text-xs">EMAIL ADDRESS</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-base-content/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input input-bordered pl-11 w-full bg-base-200/50 text-base-content focus:input-primary rounded-2xl text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content text-xs">PASSWORD</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-base-content/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input input-bordered pl-11 pr-11 w-full bg-base-200/50 text-base-content focus:input-primary rounded-2xl text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full gap-2 rounded-2xl shadow-lg hover:scale-[1.01] transition-transform text-sm font-bold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-base-300/60">
            <p className="text-sm text-base-content/60">
              Don't have an account?{" "}
              <Link to="/signup" className="link link-primary font-bold">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex flex-1">
        <AuthImagePattern
          title="Welcome back to MessageHub!"
          subtitle="Experience lightning-fast messaging, WebRTC voice & video calls, and custom theme personalization."
        />
      </div>
    </div>
  );
}

export default LoginPage;
