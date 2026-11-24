import React, { useState, useEffect, useRef } from "react";
import {
  requestPasswordReset,
  resendResetOtp,
  verifyResetOtp,
  resetPasswordWithToken,
  validateResetPasswordPolicy,
} from "../../services/api.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Reusable 4-step Forgot Password & Reset Password workflow:
 * 1. email   - Enter registered email address
 * 2. otp     - Verify 6-digit email OTP + 60s resend countdown + lockout/expiry errors
 * 3. reset   - Create & confirm new password with live 5-rule complexity checker
 * 4. success - Confirmation message + redirect to Login
 */
export default function PasswordResetFlow({
  initialEmail = "",
  onBackToLogin,
  onResetSuccess,
  onNotify,
  onTitleChange,
}) {
  const [step, setStep] = useState("email"); // 'email' | 'otp' | 'reset' | 'success'
  const [email, setEmail] = useState(() => (initialEmail.includes("@") ? initialEmail.trim() : ""));
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [banner, setBanner] = useState({ text: "", type: "" });
  const [fieldError, setFieldError] = useState("");
  const [tokenExpiredOrInvalid, setTokenExpiredOrInvalid] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (!onTitleChange) return;
    const titles = {
      email: "Forgot password · VaultAuth SSO",
      otp: "Verify reset code · VaultAuth SSO",
      reset: "Create new password · VaultAuth SSO",
      success: "Password reset successful · VaultAuth SSO",
    };
    onTitleChange(titles[step] || "Reset password · VaultAuth SSO");
  }, [step, onTitleChange]);

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  useEffect(() => {
    if (step !== "success") return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onResetSuccess?.(email.trim().toLowerCase());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, email, onResetSuccess]);

  const policy = validateResetPasswordPolicy(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Step 1: Submit email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setBanner({ text: "", type: "" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setFieldError("Please enter a valid email address.");
      return;
    }

    setFieldError("");
    setIsLoading(true);
    try {
      const data = await requestPasswordReset(cleanEmail);
      setEmail(cleanEmail);
      setOtpValues(["", "", "", "", "", ""]);
      setResendCooldown(data?.cooldown || 60);
      setBanner({
        text: data?.message || `If an account with ${cleanEmail} exists, a verification code has been sent.`,
        type: "info",
      });
      setStep("otp");
      onNotify?.("If your account exists, a 6-digit verification code was sent.", "info");
      setTimeout(() => otpInputsRef.current[0]?.focus(), 60);
    } catch (err) {
      const msg = err.message || "Unable to process request. Please try again.";
      setBanner({ text: msg, type: "error" });
      onNotify?.(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP inputs
  const handleOtpChange = (index, val) => {
    const clean = val.replace(/[^0-9]/g, "");
    const updated = [...otpValues];
    updated[index] = clean.slice(-1);
    setOtpValues(updated);
    if (fieldError) setFieldError("");
    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const updated = [...otpValues];
        updated[index - 1] = "";
        setOtpValues(updated);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updated = [...otpValues];
        updated[index] = "";
        setOtpValues(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setOtpValues(updated);
    setFieldError("");
    otpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 3: Verify OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setBanner({ text: "", type: "" });

    const code = otpValues.join("");
    if (code.length < 6) {
      setFieldError("Please enter the complete 6-digit verification code.");
      return;
    }

    setFieldError("");
    setIsLoading(true);
    try {
      const data = await verifyResetOtp(email, code);
      if (!data?.reset_token) {
        throw new Error("Verification succeeded without reset authorization token.");
      }
      setResetToken(data.reset_token);
      setOtpValues(["", "", "", "", "", ""]);
      setTokenExpiredOrInvalid(false);
      setBanner({ text: "", type: "" });
      setStep("reset");
      onNotify?.("Verification code verified. Please create your new password.", "success");
    } catch (err) {
      const msg = err.message || "Invalid or expired verification code.";
      setFieldError(msg);
      setBanner({ text: msg, type: "error" });
      setOtpValues(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP with cooldown enforcement
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setFieldError("");
    setBanner({ text: "", type: "" });
    try {
      const data = await resendResetOtp(email);
      setResendCooldown(data?.cooldown || 60);
      setOtpValues(["", "", "", "", "", ""]);
      setBanner({
        text: data?.message || "A new verification code has been sent to your email.",
        type: "info",
      });
      onNotify?.("New verification code sent.", "info");
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      const msg = err.message || "Please wait before requesting a new code.";
      if (err.data?.retry_after) {
        setResendCooldown(err.data.retry_after);
      }
      setBanner({ text: msg, type: "error" });
      onNotify?.(msg, "error");
    } finally {
      setIsResending(false);
    }
  };

  // Step 5: Reset password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setBanner({ text: "", type: "" });

    if (!policy.isValid) {
      setFieldError(`Password must meet all security requirements (${policy.errors[0]}).`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("New password and confirmation do not match.");
      return;
    }

    setFieldError("");
    setIsLoading(true);
    try {
      const data = await resetPasswordWithToken({
        resetToken,
        newPassword,
        confirmPassword,
      });
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setRedirectCountdown(3);
      setStep("success");
      onNotify?.(
        data?.message || "Your password has been reset successfully. Please log in with your new password.",
        "success"
      );
    } catch (err) {
      const msg = err.message || "Failed to update password.";
      setFieldError(msg);
      setBanner({ text: msg, type: "error" });
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("used")) {
        setTokenExpiredOrInvalid(true);
      }
      onNotify?.(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const restartResetFlow = () => {
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpValues(["", "", "", "", "", ""]);
    setFieldError("");
    setTokenExpiredOrInvalid(false);
    setBanner({ text: "", type: "" });
    setStep("email");
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? `0${rem}` : rem}`;
  };

  return (
    <div>
      {banner.text && (
        <div className={`login-banner show ${banner.type}`} role="alert">
          {banner.text}
        </div>
      )}

      {/* ── STATE 1 & 2: Enter Email ── */}
      {step === "email" && (
        <div>
          <h1 className="login-clean-h1">Forgot password?</h1>
          <p className="login-clean-sub">
            Enter your registered email address and we&apos;ll send you a 6-digit verification code.
          </p>

          <form onSubmit={handleEmailSubmit} noValidate>
            <div className={`login-field ${fieldError ? "bad" : ""}`}>
              <label className="login-lbl" htmlFor="forgot-email">
                Registered email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError("");
                }}
                autoFocus
                required
              />
              {fieldError && (
                <p className="login-err" role="alert">
                  {fieldError}
                </p>
              )}
            </div>

            <button
              className={`login-btn ${isLoading ? "load" : ""}`}
              type="submit"
              disabled={isLoading}
            >
              <span className="spin" aria-hidden="true" />
              <span>{isLoading ? "Sending code..." : "Send verification code"}</span>
            </button>

            <button
              type="button"
              className="login-btn login-btn-secondary"
              onClick={onBackToLogin}
            >
              Back to sign in
            </button>
          </form>
        </div>
      )}

      {/* ── STATE 3 & 4: Verify Email OTP & Resend Countdown ── */}
      {step === "otp" && (
        <div>
          <h1 className="login-clean-h1">Verify email code</h1>
          <p className="login-clean-sub">
            Enter the 6-digit code sent to <strong>{email}</strong>. Code expires in 5 minutes.
          </p>

          <form onSubmit={handleVerifyOtpSubmit} noValidate>
            <div className="login-otp-grid" onPaste={handleOtpPaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  aria-label={`Verification code digit ${idx + 1}`}
                  className="login-otp-box"
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                />
              ))}
            </div>

            {fieldError && (
              <p
                className="login-err"
                style={{ display: "block", textAlign: "center", marginBottom: "12px" }}
                role="alert"
              >
                {fieldError}
              </p>
            )}

            <button
              className={`login-btn ${isLoading ? "load" : ""}`}
              type="submit"
              disabled={isLoading || otpValues.join("").length < 6}
            >
              <span className="spin" aria-hidden="true" />
              <span>{isLoading ? "Verifying code..." : "Verify & continue"}</span>
            </button>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "18px",
              fontSize: "0.86rem",
            }}
          >
            {resendCooldown > 0 ? (
              <span style={{ color: "var(--muted)" }}>
                Resend code in <strong style={{ color: "var(--ink)" }}>{formatTimer(resendCooldown)}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  color: "var(--brand)",
                  fontWeight: 600,
                  cursor: isResending ? "wait" : "pointer",
                  font: "inherit",
                }}
              >
                {isResending ? "Sending..." : "Resend verification code"}
              </button>
            )}

            <button
              type="button"
              onClick={restartResetFlow}
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "var(--muted)",
                fontWeight: 500,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Change email
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 5 & 6: Create & Confirm New Password ── */}
      {step === "reset" && (
        <div>
          <h1 className="login-clean-h1">Create new password</h1>
          <p className="login-clean-sub">
            Set a strong new password for <strong>{email}</strong>.
          </p>

          <form onSubmit={handleResetPasswordSubmit} noValidate>
            <div className={`login-field ${fieldError && !policy.isValid ? "bad" : ""}`}>
              <label className="login-lbl" htmlFor="reset-new-password">
                New password
              </label>
              <div className="login-ctl login-pw">
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter strong password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="login-show"
                  aria-pressed={showNewPassword}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="login-strength-wrap">
                <div className="login-strength-bars">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className="login-strength-bar"
                      style={{
                        background:
                          newPassword && bar <= policy.score ? policy.color : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
                <span className="login-strength-text">{policy.label}</span>
              </div>
            </div>

            {/* 5-rule Password Complexity Checklist */}
            <ul
              aria-label="Password requirements"
              style={{
                listStyle: "none",
                margin: "0 0 14px",
                padding: "10px 12px",
                background: "#f8fafc",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                display: "grid",
                gap: "4px",
                fontSize: "0.78rem",
              }}
            >
              {[
                { ok: policy.checks.minLength, label: "At least 8 characters" },
                { ok: policy.checks.uppercase, label: "At least one uppercase letter (A–Z)" },
                { ok: policy.checks.lowercase, label: "At least one lowercase letter (a–z)" },
                { ok: policy.checks.number, label: "At least one number (0–9)" },
                { ok: policy.checks.special, label: "At least one special character (!@#$...)" },
              ].map((req) => (
                <li
                  key={req.label}
                  style={{
                    color: req.ok ? "#16a34a" : "#64748b",
                    fontWeight: req.ok ? 600 : 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{req.ok ? "✓" : "○"}</span>
                  <span>{req.label}</span>
                </li>
              ))}
            </ul>

            <div className={`login-field ${passwordsMismatch ? "bad" : ""}`}>
              <label className="login-lbl" htmlFor="reset-confirm-password">
                Confirm new password
              </label>
              <div className="login-ctl login-pw">
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  required
                />
                <button
                  type="button"
                  className="login-show"
                  aria-pressed={showConfirmPassword}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {passwordsMatch && (
                <p style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600, margin: "5px 0 0" }}>
                  ✓ Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="login-err" role="alert">
                  Passwords do not match
                </p>
              )}
            </div>

            {fieldError && (
              <p className="login-err" style={{ marginBottom: "10px" }} role="alert">
                {fieldError}
              </p>
            )}

            {tokenExpiredOrInvalid ? (
              <button
                type="button"
                className="login-btn"
                onClick={restartResetFlow}
              >
                Start password reset again
              </button>
            ) : (
              <button
                className={`login-btn ${isLoading ? "load" : ""}`}
                type="submit"
                disabled={isLoading || !policy.isValid || !passwordsMatch}
              >
                <span className="spin" aria-hidden="true" />
                <span>{isLoading ? "Updating password..." : "Reset password"}</span>
              </button>
            )}

            <button
              type="button"
              className="login-btn login-btn-secondary"
              onClick={onBackToLogin}
            >
              Cancel &amp; return to sign in
            </button>
          </form>
        </div>
      )}

      {/* ── STATE 7: Password Reset Success ── */}
      {step === "success" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: "#f0fdf4",
              border: "2px solid #bbf7d0",
              color: "#16a34a",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="login-clean-h1" style={{ marginBottom: "8px" }}>
            Password updated
          </h1>
          <p className="login-clean-sub" style={{ marginBottom: "18px" }}>
            Your password has been reset successfully. Please log in with your new password.
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "16px" }}>
            Redirecting to sign in in {redirectCountdown}s...
          </p>
          <button
            type="button"
            className="login-btn"
            onClick={() => onResetSuccess?.(email.trim().toLowerCase())}
          >
            Return to sign in now
          </button>
        </div>
      )}
    </div>
  );
}
