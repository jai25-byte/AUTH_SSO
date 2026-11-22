import React, { useState } from "react";
import { Mail, User, Key, Eye, EyeOff, ShieldCheck, ArrowRight, Send } from "lucide-react";
import { login as apiLogin, sendOtp, getUserByUsernameOrEmail } from "../services/api.js";

export default function LoginCard({ onSwitchToRegister, onForgotPassword, onNotify, onLoginSuccess }) {
  // Support both Gmail OTP login (primary requirement) and Password login
  const [loginMethod, setLoginMethod] = useState("otp"); // 'otp' | 'password'

  // Form states
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 1. Gmail OTP Login Handler (Requirements 1 & 2)
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      onNotify?.("Please enter your registered Gmail address.", "error");
      return;
    }

    if (!cleanEmail.includes("@")) {
      onNotify?.("Please enter a valid Gmail / email address.", "error");
      return;
    }

    setIsLoading(true);

    try {
      // POST /api/otp/send - dispatches real 6-digit OTP via Gmail SMTP
      const res = await sendOtp(cleanEmail);

      onNotify?.(
        res.message || "A 6-digit verification code has been sent to your Gmail address!",
        "success"
      );

      if (onLoginSuccess) {
        onLoginSuccess({
          email: cleanEmail,
          username: res.identifier || cleanEmail,
          email_masked: res.email_masked,
          expires_in: res.expires_in || 300,
          cooldown: res.cooldown || 60,
          loginMethod: "otp",
        });
      }
    } catch (err) {
      let errorMsg = err.message || "Failed to send OTP.";
      if (err.status === 404) {
        errorMsg = "No active employee account found with this Gmail address. Please register first.";
      } else if (err.status === 403) {
        errorMsg = "Your employee account is deactivated. Please contact your administrator.";
      } else if (err.status === 429) {
        errorMsg = err.message || "Please wait before requesting another OTP.";
      }
      onNotify?.(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Standard Password Login Handler (Preserves existing functionality)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const username = formData.username.trim();
    const password = formData.password;

    if (!username || !password) {
      onNotify?.("Please enter both username and password.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const loginRes = await apiLogin({
        login: username,
        username: username,
        password: password,
      });

      let userEmail = username;
      let userUid = null;
      try {
        const userRes = await getUserByUsernameOrEmail(username);
        const userObj = Array.isArray(userRes) ? userRes[0] : userRes;
        if (userObj?.email) userEmail = userObj.email;
        if (userObj?.uid) userUid = userObj.uid;
      } catch {
        // Fallback
      }

      // If user has email, trigger OTP verification for complete SSO flow
      try {
        const otpTarget = userEmail && userEmail.includes("@") ? userEmail : username;
        const otpRes = await sendOtp(otpTarget);
        onNotify?.(
          otpRes.message || "Password verified! A 6-digit OTP has been sent to your email.",
          "success"
        );

        if (onLoginSuccess) {
          onLoginSuccess({
            username,
            email: userEmail,
            uid: userUid,
            token: loginRes.token,
            email_masked: otpRes.email_masked,
            expires_in: otpRes.expires_in || 300,
            cooldown: otpRes.cooldown || 60,
            rememberMe: formData.rememberMe,
            loginMethod: "password",
          });
        }
      } catch (otpErr) {
        // If OTP send failed but password login succeeded, still notify and proceed
        onNotify?.(loginRes.message || "Credentials verified successfully!", "success");
        if (onLoginSuccess) {
          onLoginSuccess({
            username,
            email: userEmail,
            uid: userUid,
            token: loginRes.token,
            rememberMe: formData.rememberMe,
            loginMethod: "password",
          });
        }
      }
    } catch (err) {
      const errorMsg =
        err.message ||
        (err.status === 404
          ? "Invalid credentials or user not found."
          : "Authentication failed. Please try again.");
      onNotify?.(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto p-[30px_40px] text-black glass-card rounded-[22px] animate-fade-in-scale">
      {/* Title */}
      <div className="text-center mb-5">
        <h1 className="text-[34px] sm:text-[36px] font-semibold text-black tracking-tight leading-tight">
          Login
        </h1>
        <p className="text-xs text-black/70 font-medium mt-1">
          Vault Auth Single Sign-On
        </p>
      </div>

      {/* Login Mode Selector Tabs */}
      <div className="flex p-1 bg-black/10 rounded-full mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod("otp")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            loginMethod === "otp"
              ? "bg-black text-white shadow-sm"
              : "text-black/75 hover:text-black"
          }`}
        >
          Gmail OTP
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod("password")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            loginMethod === "password"
              ? "bg-black text-white shadow-sm"
              : "text-black/75 hover:text-black"
          }`}
        >
          Password
        </button>
      </div>

      {/* Mode 1: Gmail OTP Form (Requirements 1 & 2) */}
      {loginMethod === "otp" && (
        <form onSubmit={handleOtpLogin} noValidate>
          <div className="text-center mb-4">
            <p className="text-xs text-black/80 font-medium leading-relaxed">
              Enter your registered Gmail address. We'll send a real 6-digit verification code.
            </p>
          </div>

          {/* Registered Gmail Address Field */}
          <div className="relative w-full h-[50px] my-[22px]">
            <input
              id="login-gmail"
              name="email"
              type="email"
              placeholder="Registered Gmail Address"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-full glass-input rounded-[40px] text-[15px] sm:text-[16px] text-black placeholder:text-black/75 outline-none pl-5 pr-12"
            />
            <Mail
              size={18}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-black pointer-events-none"
            />
          </div>

          {/* Send OTP / Login Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full h-[46px] btn-primary rounded-[40px] text-[16px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <Send size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Mode 2: Password Login Form */}
      {loginMethod === "password" && (
        <form onSubmit={handlePasswordSubmit} noValidate>
          {/* Username Field */}
          <div className="relative w-full h-[50px] my-[20px]">
            <input
              id="login-username"
              name="username"
              type="text"
              placeholder="Username or Email"
              required
              autoComplete="username"
              value={formData.username}
              onChange={handlePasswordChange}
              className="w-full h-full glass-input rounded-[40px] text-[15px] sm:text-[16px] text-black placeholder:text-black/75 outline-none pl-5 pr-12"
            />
            <User
              size={18}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-black pointer-events-none"
            />
          </div>

          {/* Password Field */}
          <div className="relative w-full h-[50px] my-[20px]">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handlePasswordChange}
              className="w-full h-full glass-input rounded-[40px] text-[15px] sm:text-[16px] text-black placeholder:text-black/75 outline-none pl-5 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-black hover:text-black/70 transition-colors cursor-pointer rounded-full"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex justify-between items-center text-[14px] text-black -mt-1 mb-5 select-none">
            <label className="flex items-center gap-2 cursor-pointer font-medium hover:opacity-85 transition-opacity">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handlePasswordChange}
                className="w-4 h-4 rounded accent-black cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-black font-medium hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[46px] btn-primary rounded-[40px] text-[16px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-80"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      )}

      {/* Register Switcher Link */}
      <div className="text-[14.5px] text-center mt-6 mb-2">
        <p className="text-black/90">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-black font-semibold hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
          >
            Register &gt;
          </button>
        </p>
      </div>

      {/* Trust Badge */}
      <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-center gap-1.5 text-[11.5px] text-black/60 font-medium">
        <ShieldCheck size={14} className="text-black/70" />
        <span>256-bit SSL Encrypted & SSO Protected</span>
      </div>
    </div>
  );
}
