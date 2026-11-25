import React, { useState, useEffect, useRef } from "react";
import { login as apiLogin, register as apiRegister, sendOtp, verifyOtp } from "../../services/api.js";
import { loginWithPasskey } from "../../services/webauthn.js";
import PasswordResetFlow from "./PasswordResetFlow.jsx";

export default function AuthPage({ initialTab = "login", onNavigate, onNotify }) {
  const [activeTab, setActiveTab] = useState(initialTab === "register" ? "register" : "login");
  // 'credentials' | 'otp' | 'forgot'
  const [authStep, setAuthStep] = useState("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [banner, setBanner] = useState({ text: "", type: "" });

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Form states - Register
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole] = useState("user");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  // OTP state
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [pendingIdentifier, setPendingIdentifier] = useState("");
  const [pendingEmailMasked, setPendingEmailMasked] = useState("");
  const [otpContext, setOtpContext] = useState("login"); // 'login' | 'register'
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    setActiveTab(initialTab === "register" ? "register" : "login");
  }, [initialTab]);

  useEffect(() => {
    document.title =
      authStep === "otp"
        ? otpContext === "register"
          ? "Verify email · VaultAuth SSO"
          : "Two-Factor Authentication · VaultAuth SSO"
        : authStep === "forgot"
          ? "Reset password · VaultAuth SSO"
          : activeTab === "register"
            ? "Create account · VaultAuth SSO"
            : "Sign in · VaultAuth SSO";
  }, [activeTab, authStep, otpContext]);

  useEffect(() => {
    let timer;
    if (authStep === "otp" && resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, resendCooldown]);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const evaluatePasswordStrength = (p) => {
    if (!p) return { score: 0, text: "Password strength: none", color: "#e2e8f0" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;

    const levels = [
      { score: 1, text: "Weak password", color: "#dc2626" },
      { score: 2, text: "Medium password", color: "#f59e0b" },
      { score: 3, text: "Strong password", color: "#2563eb" },
      { score: 4, text: "Very strong password", color: "#16a34a" },
    ];
    return levels[Math.min(score, 4) - 1] || levels[0];
  };

  const strength = evaluatePasswordStrength(regPassword);

  const clearBanner = () => setBanner({ text: "", type: "" });

  const switchTab = (tab) => {
    clearBanner();
    setAuthStep("credentials");
    setOtpContext("login");
    setPendingEmailMasked("");
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const targetUrl = tab === "register" ? "/register" : "/login";
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, "", targetUrl);
      }
    }
  };

  const enterOtpStep = (data, fallbackIdentifier, context = "login") => {
    const identifier = data?.identifier || fallbackIdentifier;
    const masked = data?.email_masked || "";
    const cooldownVal = typeof data?.cooldown === "number" ? data.cooldown : 60;
    const deliveryFailed = data?.email_sent === false;

    setOtpContext(context);
    setPendingIdentifier(identifier);
    setPendingEmailMasked(masked);
    setOtpValues(["", "", "", "", "", ""]);
    setOtpError("");
    setResendCooldown(cooldownVal);
    setAuthStep("otp");

    if (deliveryFailed) {
      const warnMsg =
        data?.message ||
        "Account created, but verification email could not be sent. Click Resend code to try again.";
      setBanner({ text: warnMsg, type: "error" });
      onNotify?.(warnMsg, "error");
    } else {
      const okMsg =
        data?.message ||
        (context === "register"
          ? "Account created! Check your email for the 6-digit verification code."
          : "Verification required. Check your email for the code.");
      setBanner({ text: okMsg, type: context === "register" ? "success" : "info" });
      onNotify?.(okMsg, context === "register" ? "success" : "info");
    }

    setTimeout(() => otpInputsRef.current[0]?.focus(), 50);
  };

  const redirectAuthenticated = (user) => {
    const target = user?.role === "admin" ? "/admin" : "/dashboard";
    if (onNavigate) {
      onNavigate(target, { replace: true });
    } else {
      window.location.replace(target);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isPasskeyLoading) return;
    clearBanner();

    const ident = loginEmail.trim();
    const errors = {};
    if (!ident) errors.loginEmail = "Please enter your email or username.";
    if (!loginPassword) errors.loginPassword = "Please enter your password.";

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setLoginErrors({});
    setIsLoading(true);

    try {
      const data = await apiLogin({
        login: ident,
        username: ident,
        email: ident,
        password: loginPassword,
        remember: rememberMe,
        requireOtp: true,
      });

      if (data?.otp_required || data?.requires_otp) {
        enterOtpStep(data, ident, "login");
        return;
      }

      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }
        onNotify?.(data.message || "Signed in successfully. Redirecting...", "success");
        redirectAuthenticated(data.user);
      }
    } catch (err) {
      setBanner({ text: err.message || "Invalid email or password.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Passkey Sign-In (Image 2 secondary button)
  const handlePasskeySignIn = async () => {
    if (isLoading || isPasskeyLoading) return;
    clearBanner();
    setIsPasskeyLoading(true);
    try {
      const data = await loginWithPasskey(loginEmail.trim() || undefined);
      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }
        onNotify?.("Passkey verified! Successfully signed in.", "success");
        redirectAuthenticated(data.user);
      }
    } catch (err) {
      const msg = err.message || "Passkey authentication canceled or failed.";
      setBanner({ text: msg, type: "error" });
      onNotify?.(msg, "error");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    clearBanner();

    const errors = {};
    if (!regFullName.trim()) errors.regFullName = "Full name is required.";
    if (!regUsername.trim()) errors.regUsername = "Username is required.";
    if (!regEmail.trim()) {
      errors.regEmail = "Email address is required.";
    } else if (!EMAIL_RE.test(regEmail.trim())) {
      errors.regEmail = "Enter a valid email address (e.g. you@company.com).";
    }
    if (!regPassword) {
      errors.regPassword = "Password is required.";
    } else if (regPassword.length < 8) {
      errors.regPassword = "Password must be at least 8 characters long.";
    }
    if (regConfirm !== regPassword) {
      errors.regConfirm = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    setRegErrors({});
    setIsLoading(true);

    const cleanEmail = regEmail.trim().toLowerCase();
    try {
      const regRes = await apiRegister({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        email: cleanEmail,
        password: regPassword,
        role: regRole,
        requireOtp: true,
      });

      setLoginEmail(cleanEmail);
      setRegPassword("");
      setRegConfirm("");

      if (regRes && typeof regRes === "object" && (regRes.otp_required || regRes.requires_otp)) {
        enterOtpStep(regRes, cleanEmail, "register");
        return;
      }

      // Fallback for minimal /api/register implementations: explicitly dispatch verification OTP
      try {
        const otpRes = await sendOtp(cleanEmail);
        enterOtpStep(otpRes, cleanEmail, "register");
      } catch (otpErr) {
        onNotify?.("Account created successfully! Please sign in.", "success");
        switchTab("login");
        setBanner({
          text: otpErr?.message
            ? `Account created, but verification code failed: ${otpErr.message}`
            : "Account created. You can now sign in.",
          type: otpErr?.message ? "info" : "success",
        });
      }
    } catch (err) {
      const detail =
        Array.isArray(err?.data?.errors) && err.data.errors.length > 0
          ? ` ${err.data.errors.join(" ")}`
          : "";
      setBanner({ text: `${err.message || "Registration failed. Please try again."}${detail}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index, val) => {
    const clean = val.replace(/[^0-9]/g, "");
    const updated = [...otpValues];
    updated[index] = clean.slice(-1);
    setOtpValues(updated);
    if (otpError) setOtpError("");

    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const updated = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpValues(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIdx]?.focus();
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    clearBanner();

    const code = otpValues.join("");
    if (code.length < 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }
    setOtpError("");
    setIsLoading(true);

    try {
      const data = await verifyOtp(pendingIdentifier, code);
      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }
        onNotify?.("Two-factor authentication verified!", "success");
        redirectAuthenticated(data.user);
      }
    } catch (err) {
      setBanner({
        text: err.message || "Invalid verification code. Please check your email.",
        type: "error",
      });
      setOtpValues(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (resendCooldown > 0) return;
    clearBanner();
    onNotify?.("Sending a new verification code...", "info");
    try {
      const res = await sendOtp(pendingIdentifier);
      if (res?.email_masked) setPendingEmailMasked(res.email_masked);
      setResendCooldown(typeof res?.cooldown === "number" ? res.cooldown : 60);
      onNotify?.("New 6-digit code sent to your email.", "success");
      setBanner({ text: res?.message || "A new verification code has been sent.", type: "info" });
    } catch (err) {
      const retry = err?.data?.cooldown || err?.data?.retry_after;
      if (typeof retry === "number" && retry > 0) {
        setResendCooldown(retry);
      }
      setBanner({
        text: err.message || "Could not resend code. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="login-clean-page">
      <main className="login-clean-wrap">
        {/* Brand Logo & Motto */}
        <a
          href="/login"
          className="login-clean-brand"
          aria-label="VaultAuth SSO home"
          onClick={(e) => {
            e.preventDefault();
            switchTab("login");
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <linearGradient id="vault-brand-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3b82f6" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <path
              d="M16 2 28 6.5v8.2c0 7.4-4.8 12.6-12 15.3C8.8 27.3 4 22.1 4 14.7V6.5L16 2Z"
              fill="url(#vault-brand-g)"
            />
            <path
              d="m10.5 16 4 4 7.5-8"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            VaultAuth <em>SSO</em>
          </span>
        </a>
        <p className="login-clean-tag">One identity. Every access.</p>

        {/* Main Container Card */}
        <section className="login-clean-card" aria-live="polite">
          {/* Segmented Nav Tabs */}
          {authStep === "credentials" && (
            <nav className="login-clean-tabs" aria-label="Authentication views">
              <button
                type="button"
                className={`login-clean-tab-btn ${activeTab === "login" ? "active" : ""}`}
                aria-selected={activeTab === "login"}
                onClick={() => switchTab("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`login-clean-tab-btn ${activeTab === "register" ? "active" : ""}`}
                aria-selected={activeTab === "register"}
                onClick={() => switchTab("register")}
              >
                Create account
              </button>
            </nav>
          )}

          {/* Status Banner inside card */}
          {banner.text && (
            <div className={`login-banner show ${banner.type}`} role="alert">
              {banner.text}
            </div>
          )}

          {/* ================= 1. LOGIN VIEW ================= */}
          {authStep === "credentials" && activeTab === "login" && (
            <div>
              <h1 className="login-clean-h1">Welcome back</h1>
              <p className="login-clean-sub">Sign in to your VaultAuth account.</p>

              <form onSubmit={handleLoginSubmit} noValidate>
                <div className={`login-field ${loginErrors.loginEmail ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="login-email">
                    Email or username
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                  {loginErrors.loginEmail && (
                    <p className="login-err" role="alert">
                      {loginErrors.loginEmail}
                    </p>
                  )}
                </div>

                <div className={`login-field ${loginErrors.loginPassword ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="login-password">
                    Password
                  </label>
                  <div className="login-ctl login-pw">
                    <input
                      id="login-password"
                      name="password"
                      type={showLoginPass ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-show"
                      aria-pressed={showLoginPass}
                      aria-label={showLoginPass ? "Hide password" : "Show password"}
                      onClick={() => setShowLoginPass(!showLoginPass)}
                    >
                      {showLoginPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {loginErrors.loginPassword && (
                    <p className="login-err" role="alert">
                      {loginErrors.loginPassword}
                    </p>
                  )}
                </div>

                <div className="login-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      clearBanner();
                      setAuthStep("forgot");
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  className={`login-btn ${isLoading ? "load" : ""}`}
                  type="submit"
                  disabled={isLoading || isPasskeyLoading}
                >
                  <span className="spin" aria-hidden="true" />
                  <span>{isLoading ? "Signing in..." : "Sign in"}</span>
                </button>

                <button
                  type="button"
                  className={`login-btn login-btn-secondary ${isPasskeyLoading ? "load" : ""}`}
                  onClick={handlePasskeySignIn}
                  disabled={isLoading || isPasskeyLoading}
                >
                  {isPasskeyLoading ? (
                    <span className="spin spin-dark" aria-hidden="true" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="7.5" cy="15.5" r="4.5" />
                      <path d="m21 2-9.6 9.6" />
                      <path d="m15.5 7.5 3 3L22 7l-3-3" />
                    </svg>
                  )}
                  <span>{isPasskeyLoading ? "Verifying passkey..." : "Sign in with Passkey"}</span>
                </button>
              </form>

              <p className="login-alt">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    switchTab("register");
                  }}
                >
                  Create one
                </a>
              </p>
            </div>
          )}

          {/* ================= 2. REGISTER VIEW ================= */}
          {authStep === "credentials" && activeTab === "register" && (
            <div>
              <h1 className="login-clean-h1">Create your account</h1>
              <p className="login-clean-sub">Join the VaultAuth SSO workspace network.</p>

              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className={`login-field ${regErrors.regFullName ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="reg-fullname">
                    Full name
                  </label>
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                  {regErrors.regFullName && (
                    <p className="login-err" role="alert">
                      {regErrors.regFullName}
                    </p>
                  )}
                </div>

                <div className={`login-field ${regErrors.regUsername ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="reg-username">
                    Username
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="alexmorgan"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                  {regErrors.regUsername && (
                    <p className="login-err" role="alert">
                      {regErrors.regUsername}
                    </p>
                  )}
                </div>

                <div className={`login-field ${regErrors.regEmail ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="reg-email">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                  {regErrors.regEmail && (
                    <p className="login-err" role="alert">
                      {regErrors.regEmail}
                    </p>
                  )}
                </div>

                <div className={`login-field ${regErrors.regPassword ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="login-ctl login-pw">
                    <input
                      id="reg-password"
                      name="password"
                      type={showRegPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-show"
                      aria-pressed={showRegPass}
                      aria-label={showRegPass ? "Hide password" : "Show password"}
                      onClick={() => setShowRegPass(!showRegPass)}
                    >
                      {showRegPass ? "Hide" : "Show"}
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
                              regPassword && bar <= strength.score ? strength.color : "#e2e8f0",
                          }}
                        />
                      ))}
                    </div>
                    <span className="login-strength-text">{strength.text}</span>
                  </div>
                  {regErrors.regPassword && (
                    <p className="login-err" role="alert">
                      {regErrors.regPassword}
                    </p>
                  )}
                </div>

                <div className={`login-field ${regErrors.regConfirm ? "bad" : ""}`}>
                  <label className="login-lbl" htmlFor="reg-confirm">
                    Confirm password
                  </label>
                  <div className="login-ctl login-pw">
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {regErrors.regConfirm && (
                    <p className="login-err" role="alert">
                      {regErrors.regConfirm}
                    </p>
                  )}
                </div>

                {/* Account type selector */}
                <div style={{ marginBottom: "12px" }}>
                  <label className="login-lbl" style={{ display: "block", marginBottom: "8px" }}>
                    Account type
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { value: "user", label: "Standard User", desc: "Personal access & apps" },
                      { value: "admin", label: "Administrator", desc: "Full system management" },
                    ].map(({ value, label, desc }) => {
                      const isSel = regRole === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRegRole(value)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "9px",
                            border: `2px solid ${isSel ? "#2563eb" : "#e2e8f0"}`,
                            background: isSel ? "rgba(37, 99, 235, 0.08)" : "#f8fafc",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ fontSize: "13px", fontWeight: 600, color: isSel ? "#2563eb" : "#0f172a", marginBottom: "2px" }}>
                            {label}
                          </div>
                          <div style={{ fontSize: "11px", color: isSel ? "#1d4ed8" : "#64748b" }}>{desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  {regRole === "admin" && (
                    <div style={{ margin: "8px 0 0", padding: "8px 10px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", fontSize: "11.5px", color: "#92400e", lineHeight: 1.4 }}>
                      ⚠️ Administrator accounts require validation and privilege approval from an existing admin.
                    </div>
                  )}
                </div>

                <button
                  className={`login-btn ${isLoading ? "load" : ""}`}
                  type="submit"
                  disabled={isLoading}
                >
                  <span className="spin" aria-hidden="true" />
                  <span>{isLoading ? "Creating account..." : "Create account"}</span>
                </button>
              </form>

              <p className="login-alt">
                Already have an account?{" "}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    switchTab("login");
                  }}
                >
                  Sign in
                </a>
              </p>
            </div>
          )}

          {/* ================= 3. OTP VERIFICATION VIEW ================= */}
          {authStep === "otp" && (
            <div>
              <h1 className="login-clean-h1">
                {otpContext === "register" ? "Verify your email" : "Two-Factor Auth"}
              </h1>
              <p className="login-clean-sub">
                Enter the 6-digit verification code sent to{" "}
                <strong>{pendingEmailMasked || pendingIdentifier || "your registered email"}</strong>.
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
                      className="login-otp-box"
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="login-err" style={{ display: "block", textAlign: "center", marginBottom: "12px" }} role="alert">
                    {otpError}
                  </p>
                )}

                <button
                  className={`login-btn ${isLoading ? "load" : ""}`}
                  type="submit"
                  disabled={isLoading}
                >
                  <span className="spin" aria-hidden="true" />
                  <span>{isLoading ? "Verifying..." : "Verify & Continue"}</span>
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
                <a
                  href="#resend"
                  onClick={handleResendOtp}
                  style={{
                    pointerEvents: resendCooldown > 0 ? "none" : "auto",
                    opacity: resendCooldown > 0 ? 0.5 : 1,
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </a>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    switchTab("login");
                  }}
                >
                  ← Back to sign in
                </a>
              </div>
            </div>
          )}

          {/* ================= 4. FORGOT & RESET PASSWORD VIEW ================= */}
          {authStep === "forgot" && (
            <PasswordResetFlow
              initialEmail={loginEmail}
              onBackToLogin={() => switchTab("login")}
              onResetSuccess={(resetEmail) => {
                if (resetEmail) setLoginEmail(resetEmail);
                setLoginPassword("");
                switchTab("login");
                setBanner({
                  text: "Your password has been reset successfully. Please log in with your new password.",
                  type: "success",
                });
              }}
              onNotify={onNotify}
            />
          )}
        </section>

        {/* Footer */}
        <p className="login-clean-foot">Protected by VaultAuth SSO · {new Date().getFullYear()}</p>
      </main>
    </div>
  );
}
