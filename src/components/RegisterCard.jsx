import React, { useState } from "react";
import { User, Mail, Key, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { register as apiRegister } from "../services/api.js";

export default function RegisterCard({ onSwitchToLogin, onNotify }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const passwordsMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!fullName || !email || !username || !password || !confirmPassword) {
      onNotify?.("Please fill in all required fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      onNotify?.("Passwords do not match. Please verify.", "error");
      return;
    }

    if (password.length < 6) {
      onNotify?.("Password must be at least 6 characters long.", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API: POST /api/register
      await apiRegister({
        username,
        email,
        password,
      });

      onNotify?.(`Account successfully created for ${username}! Redirecting to login...`, "success");
      setTimeout(() => {
        onSwitchToLogin();
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.message ||
        (err.status === 400
          ? "Invalid registration data. Username or email may already be taken."
          : "Registration failed. Please try again.");
      onNotify?.(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[430px] mx-auto p-[35px_35px_30px] text-[#001a35] glass-card rounded-[24px] animate-fade-in-scale">
      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-[28px] sm:text-[30px] font-semibold text-[#001a35] tracking-tight">
            Create Account
          </h1>
          <p className="text-xs text-[#001a35]/75 font-medium mt-1">
            Join the Enterprise SSO Network
          </p>
        </div>

        {/* Full Name */}
        <div className="relative w-full h-[48px] my-[16px]">
          <input
            id="register-fullname"
            name="fullName"
            type="text"
            placeholder="Full Name"
            required
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full h-full glass-input rounded-[30px] text-[14px] font-medium text-[#001a35] placeholder:text-[#163b65]/90 outline-none pl-5 pr-12"
          />
          <User
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#001a35] pointer-events-none"
          />
        </div>

        {/* Email Address */}
        <div className="relative w-full h-[48px] my-[16px]">
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email Address"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-full glass-input rounded-[30px] text-[14px] font-medium text-[#001a35] placeholder:text-[#163b65]/90 outline-none pl-5 pr-12"
          />
          <Mail
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#001a35] pointer-events-none"
          />
        </div>

        {/* Username */}
        <div className="relative w-full h-[48px] my-[16px]">
          <input
            id="register-username"
            name="username"
            type="text"
            placeholder="Username"
            required
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full h-full glass-input rounded-[30px] text-[14px] font-medium text-[#001a35] placeholder:text-[#163b65]/90 outline-none pl-5 pr-12"
          />
          <User
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#001a35] pointer-events-none"
          />
        </div>

        {/* Password */}
        <div className="relative w-full h-[48px] my-[16px]">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-full glass-input rounded-[30px] text-[14px] font-medium text-[#001a35] placeholder:text-[#163b65]/90 outline-none pl-5 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[#001a35] hover:text-black transition-colors cursor-pointer rounded-full"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="px-2 -mt-2 mb-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#001a35]/80 mb-1">
              <span>Password strength</span>
              <span className="font-semibold">{strengthLabels[strength]}</span>
            </div>
            <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    strength >= step ? strengthColors[strength] : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative w-full h-[48px] my-[16px]">
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full h-full glass-input rounded-[30px] text-[14px] font-medium text-[#001a35] placeholder:text-[#163b65]/90 outline-none pl-5 pr-12 ${
              passwordsMismatch ? "border-rose-400 bg-rose-50/20" : ""
            } ${passwordsMatch ? "border-emerald-400" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[#001a35] hover:text-black transition-colors cursor-pointer rounded-full"
            title={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Match feedback */}
        {passwordsMatch && (
          <div className="flex items-center gap-1.5 px-3 -mt-2 mb-3 text-[11.5px] font-medium text-emerald-800">
            <Check size={14} className="text-emerald-700" />
            <span>Passwords match</span>
          </div>
        )}
        {passwordsMismatch && (
          <div className="flex items-center gap-1.5 px-3 -mt-2 mb-3 text-[11.5px] font-medium text-rose-800">
            <AlertCircle size={14} className="text-rose-700" />
            <span>Passwords do not match</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[46px] mt-4 btn-primary rounded-[30px] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Register</span>
          )}
        </button>

        {/* Back to Login Switcher */}
        <div className="text-[14px] text-center mt-5 mb-1">
          <p className="text-[#001a35]/90">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#001a35] font-semibold hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              Login &gt;
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
