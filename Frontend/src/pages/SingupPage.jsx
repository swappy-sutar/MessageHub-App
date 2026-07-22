import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Mail, Lock, MessageSquare, User, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../Components/AuthImagePattern";
import ThemeSwitcher from "../Components/ThemeSwitcher";
import GoogleOAuthButton from "../Components/GoogleOAuthButton";
import { toast } from "react-hot-toast";

function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    if (!firstName.trim()) return toast.error("First name is required.");
    if (!lastName.trim()) return toast.error("Last name is required.");
    if (!email.trim()) return toast.error("Email is required.");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email format.");
    if (!password) return toast.error("Password is required.");
    if (!confirmPassword) return toast.error("Confirm password is required.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm() === true) await signup(formData);
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return { level: 1, label: "Weak", color: "text-error" };
    if (p.length < 10) return { level: 2, label: "Fair", color: "text-warning" };
    return { level: 3, label: "Strong", color: "text-success" };
  };

  const strength = passwordStrength();

  return (
    <div className="flex pt-14 bg-gradient-to-br from-base-200 via-base-100 to-base-200 transition-colors duration-300 min-h-screen">
      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-8 overflow-y-auto relative">
        {/* Ambient Glow Blob */}
        <div className="absolute top-20 left-10 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 bg-base-100/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-base-300 shadow-2xl relative transition-all duration-300">
          {/* Top Right Theme Selector */}
          <div className="absolute top-5 right-5">
            <ThemeSwitcher />
          </div>

          {/* Logo & Header */}
          <div className="text-center pt-2">
            <div className="size-14 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner group hover:scale-110 transition-transform">
              <MessageSquare className="size-7 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-base-content tracking-tight">Create Account</h1>
            <p className="text-sm text-base-content/60 mt-1 font-normal">
              Join MessageHub and start connecting
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content text-xs">FIRST NAME</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input input-bordered pl-9 w-full bg-base-200/50 text-base-content focus:input-primary rounded-xl text-sm"
                    placeholder="First"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content text-xs">LAST NAME</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input input-bordered pl-9 w-full bg-base-200/50 text-base-content focus:input-primary rounded-xl text-sm"
                    placeholder="Last"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content text-xs">EMAIL ADDRESS</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input input-bordered pl-9 w-full bg-base-200/50 text-base-content focus:input-primary rounded-xl text-sm"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input input-bordered pl-9 pr-9 w-full bg-base-200/50 text-base-content focus:input-primary rounded-xl text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {strength && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          n <= strength.level ? "bg-primary" : "bg-base-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content text-xs">CONFIRM PASSWORD</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input input-bordered pl-9 pr-9 w-full bg-base-200/50 text-base-content focus:input-primary rounded-xl text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-9 top-1/2 -translate-y-1/2 size-4 text-success" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full gap-2 rounded-2xl shadow-lg hover:scale-[1.01] transition-transform text-sm font-bold mt-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Creating Account…
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider & Google OAuth Button Below Create Account Submit Button */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="h-[1px] bg-base-300 flex-1" />
              <span className="text-[11px] text-base-content/50 uppercase font-semibold">OR</span>
              <div className="h-[1px] bg-base-300 flex-1" />
            </div>

            <GoogleOAuthButton />
          </div>

          {/* Link */}
          <div className="text-center pt-2 border-t border-base-300/60">
            <p className="text-sm text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary font-bold">
                Sign In instead
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex flex-1">
        <AuthImagePattern
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
        />
      </div>
    </div>
  );
}

export default SignupPage;
