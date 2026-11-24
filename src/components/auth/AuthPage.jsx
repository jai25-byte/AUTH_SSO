import React, { useState, useEffect, useRef } from "react";
import { login as apiLogin, register as apiRegister, sendOtp, verifyOtp } from "../../services/api.js";
import { isPlatformAuthenticatorAvailable, loginWithPasskey } from "../../services/webauthn.js";
import { Shield, Eye, EyeOff, KeyRound, Check, AlertCircle, ArrowLeft, RefreshCw, X } from "lucide-react";

export default function AuthPage({ initialTab = "login", onNavigate, onNotify }) {
  const [activeTab, setActiveTab] = useState(initialTab === "register" ? "register" : "login");
  const [authStep, setAuthStep] = useState("credentials"); // 'credentials' | 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState({ text: "", type: "" });
  const [isForgotOpen, setIsForgotOpen] = useState(false);

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
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  // OTP state
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [pendingIdentifier, setPendingIdentifier] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpInputsRef = useRef([]);

  // Passkey support
  const [passkeySupported, setPasskeySupported] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setPasskeySupported).catch(() => setPasskeySupported(false));
  }, []);

  useEffect(() => {
    let timer;
    if (authStep === "otp" && resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, resendCooldown]);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Password strength calculator
  const calculateStrength = (p) => {
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

  const strength = calculateStrength(regPassword);

  const clearBanner = () => setBanner({ text: "", type: "" });

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearBanner();
    const errors = {};
    const ident = loginEmail.trim();

    if (!ident) {
      errors.loginEmail = "Please enter your email or username.";
    }
    if (!loginPassword) {
      errors.loginPassword = "Password is required.";
    }

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
        password: loginPassword,
      });

      if (data?.otp_required) {
        setPendingIdentifier(ident);
        setAuthStep("otp");
        setResendCooldown(60);
        setBanner({ text: data.message || `Enter the 6-digit verification code sent to ${ident}`, type: "info" });
        return;
      }

      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }

        onNotify?.(data.message || "Signed in successfully. Redirecting...", "success");

        const target = data.user?.role === "admin" ? "/admin" : "/dashboard";
        if (onNavigate) {
          onNavigate(target);
        } else {
          window.location.href = target;
        }
      }
    } catch (err) {
      setBanner({ text: err.message || "Invalid email or password.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
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

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    setRegErrors({});
    setIsLoading(true);

    try {
      const data = await apiRegister({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      onNotify?.("Account created successfully! Please sign in.", "success");
      setBanner({ text: "Account created! You can now sign in with your credentials.", type: "success" });
      setLoginEmail(regEmail.trim());
      setActiveTab("login");
    } catch (err) {
      setBanner({ text: err.message || "Registration failed. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Passkey Login
  const handlePasskeySignIn = async () => {
    clearBanner();
    setIsLoading(true);
    try {
      const data = await loginWithPasskey(loginEmail.trim() || undefined);
      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }
        onNotify?.("Biometric authentication verified!", "success");
        const target = data.user?.role === "admin" ? "/admin" : "/dashboard";
        if (onNavigate) {
          onNavigate(target);
        } else {
          window.location.href = target;
        }
      }
    } catch (err) {
      setBanner({ text: err.message || "Passkey verification canceled or failed.", type: "error" });
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
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
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
    clearBanner();
    const code = otpValues.join("");
    if (code.length < 6) {
      setBanner({ text: "Please enter the complete 6-digit verification code.", type: "error" });
      return;
    }
    setIsLoading(true);

    try {
      const data = await verifyOtp(pendingIdentifier, code);
      if (data?.token) {
        localStorage.setItem("vault_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("vault_auth_user", JSON.stringify(data.user));
        }
        onNotify?.("Two-factor authentication verified!", "success");
        const target = data.user?.role === "admin" ? "/admin" : "/dashboard";
        if (onNavigate) {
          onNavigate(target);
        } else {
          window.location.href = target;
        }
      }
    } catch (err) {
      setBanner({ text: err.message || "Invalid verification code. Please check your email.", type: "error" });
      setOtpValues(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendOtp(pendingIdentifier);
      setResendCooldown(60);
      onNotify?.("A new 6-digit verification code has been dispatched to your email.", "info");
    } catch (err) {
      setBanner({ text: err.message || "Failed to resend code. Please try again later.", type: "error" });
    }
  };

  return (
    <div className="auth-clean-wrapper">
      <div className="auth-clean-card">
        {/* Brand Header */}
        <div className="auth-brand-center">
          <div className="auth-brand-shield">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z" fill="#7047eb" fillOpacity="0.2" stroke="#7047eb"/>
              <circle cx="12" cy="10" r="2.2" fill="#7047eb"/>
              <path d="M11 11.5L10 16H14L13 11.5" stroke="#7047eb" strokeWidth="1.8" fill="#7047eb"/>
            </svg>
          </div>
          <h1 className="auth-title">
            VaultAuth<span>SSO</span>
          </h1>
          <p className="auth-subtitle">Unified Identity &amp; Enterprise Access Management</p>
        </div>

        {/* Global Banner Notification */}
        {banner.text && (
          <div className={`auth-banner auth-banner-${banner.type}`}>
            {banner.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{banner.text}</span>
          </div>
        )}

        {/* ========================================================
             STEP 1: CREDENTIALS (LOGIN / REGISTER TABS)
            ======================================================== */}
        {authStep === "credentials" ? (
          <>
            {/* Tabs Switcher */}
            <div className="auth-tabs-nav">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("login");
                  clearBanner();
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("register");
                  clearBanner();
                }}
              >
                Create account
              </button>
            </div>

            {/* TAB: SIGN IN */}
            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="login-email">Work Email or Username</label>
                  <input
                    id="login-email"
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="username"
                    className={loginErrors.loginEmail ? "has-error" : ""}
                  />
                  {loginErrors.loginEmail && <span className="field-err">{loginErrors.loginEmail}</span>}
                </div>

                <div className="auth-field">
                  <div className="field-label-row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setIsForgotOpen(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-with-action">
                    <input
                      id="login-password"
                      type={showLoginPass ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={loginErrors.loginPassword ? "has-error" : ""}
                    />
                    <button
                      type="button"
                      className="eye-toggle-btn"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      title={showLoginPass ? "Hide password" : "Show password"}
                    >
                      {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginErrors.loginPassword && <span className="field-err">{loginErrors.loginPassword}</span>}
                </div>

                <div className="auth-checkbox-row">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                <button type="submit" className="btn-brand-submit" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="spin" size={16} /> : null}
                  <span>{isLoading ? "Authenticating..." : "Sign in to VaultAuth"}</span>
                </button>

                {passkeySupported && (
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className="btn-passkey-outline"
                      onClick={handlePasskeySignIn}
                      disabled={isLoading}
                    >
                      <KeyRound size={16} color="#7047eb" />
                      <span>Sign in with Biometric Passkey</span>
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* TAB: CREATE ACCOUNT */
              <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="reg-fullname">Full Name</label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Alex Taylor"
                    className={regErrors.regFullName ? "has-error" : ""}
                  />
                  {regErrors.regFullName && <span className="field-err">{regErrors.regFullName}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-username">Username</label>
                  <input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="alextaylor"
                    autoComplete="username"
                    className={regErrors.regUsername ? "has-error" : ""}
                  />
                  {regErrors.regUsername && <span className="field-err">{regErrors.regUsername}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-email">Work Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alex@company.com"
                    autoComplete="email"
                    className={regErrors.regEmail ? "has-error" : ""}
                  />
                  {regErrors.regEmail && <span className="field-err">{regErrors.regEmail}</span>}
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-with-action">
                    <input
                      id="reg-password"
                      type={showRegPass ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className={regErrors.regPassword ? "has-error" : ""}
                    />
                    <button
                      type="button"
                      className="eye-toggle-btn"
                      onClick={() => setShowRegPass(!showRegPass)}
                    >
                      {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {regErrors.regPassword && <span className="field-err">{regErrors.regPassword}</span>}

                  {/* Password Strength Indicator */}
                  {regPassword && (
                    <div className="strength-bar-container">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className="strength-bar"
                            style={{
                              backgroundColor: bar <= strength.score ? strength.color : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      <span className="strength-text" style={{ color: strength.color }}>
                        {strength.text}
                      </span>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-brand-submit" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="spin" size={16} /> : null}
                  <span>{isLoading ? "Creating account..." : "Create Free Account"}</span>
                </button>
              </form>
            )}
          </>
        ) : (
          /* ========================================================
             STEP 2: MULTI-FACTOR EMAIL OTP VERIFICATION
            ======================================================== */
          <div className="auth-otp-view">
            <button
              type="button"
              className="otp-back-btn"
              onClick={() => {
                setAuthStep("credentials");
                clearBanner();
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to credentials</span>
            </button>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "16px 0 6px" }}>
              Check your email
            </h3>
            <p style={{ fontSize: "0.86rem", color: "#64748b", marginBottom: "20px" }}>
              We sent a 6-digit security code to <strong>{pendingIdentifier}</strong>
            </p>

            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="otp-inputs-grid" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="otp-digit-box"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button type="submit" className="btn-brand-submit" style={{ marginTop: "20px" }} disabled={isLoading}>
                {isLoading ? <RefreshCw className="spin" size={16} /> : null}
                <span>{isLoading ? "Verifying code..." : "Verify & Sign In"}</span>
              </button>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button type="button" className="text-link" onClick={handleResendOtp}>
                    Resend security code
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="auth-card-footer">
          <span>&copy; 2026 VaultAuthSSO • Zero Trust Workspace</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Reset Password</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                onClick={() => setIsForgotOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "0.86rem", color: "#64748b", marginBottom: "18px" }}>
              Enter your registered work email address and we'll send you an encrypted password recovery link.
            </p>
            <input
              type="email"
              placeholder="name@company.com"
              className="modal-input"
              id="forgot-email-input"
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => {
                  setIsForgotOpen(false);
                  onNotify?.("If this email exists in our directory, a recovery link has been dispatched.", "info");
                }}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
