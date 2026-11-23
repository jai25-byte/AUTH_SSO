import React, { useState, useEffect } from "react";
import { login as apiLogin, sendOtp, getUserByUsernameOrEmail } from "../services/api.js";
import { loginWithPasskey, isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "../services/webauthn.js";

export default function LoginCard({ onSwitchToRegister, onForgotPassword, onNotify, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // null = still checking, true = supported, false = not supported
  const [passkeyAvailable, setPasskeyAvailable] = useState(null);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setPasskeyAvailable).catch(() => setPasskeyAvailable(false));
  }, []);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validate = () => {
    let valid = true;
    const v = email.trim();
    if (!v) {
      setEmailError("Please enter your email address.");
      valid = false;
    } else if (!EMAIL_RE.test(v)) {
      setEmailError("Enter a valid email address, like you@company.com.");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Attempt login via API
      const loginRes = await apiLogin({
        login: cleanEmail,
        username: cleanEmail,
        password: password,
      });

      // 2. Dispatch OTP for multi-factor authentication
      try {
        const otpRes = await sendOtp(cleanEmail);
        onNotify?.(otpRes.message || "Signed in! Verification code sent to your email.", "success");
        if (onLoginSuccess) {
          onLoginSuccess({
            email: cleanEmail,
            username: cleanEmail,
            token: loginRes.token,
            email_masked: otpRes.email_masked,
            expires_in: otpRes.expires_in || 300,
            cooldown: otpRes.cooldown || 60,
            rememberMe: remember,
          });
        }
      } catch (otpErr) {
        // If OTP backend is in demo mode or fails, still proceed to OTP verification screen
        onNotify?.("Credentials verified! Please enter the 6-digit OTP.", "info");
        if (onLoginSuccess) {
          onLoginSuccess({
            email: cleanEmail,
            username: cleanEmail,
            token: loginRes.token,
            rememberMe: remember,
          });
        }
      }
    } catch (err) {
      const msg = err.message || "Incorrect email or password.";
      setPasswordError(msg);
      onNotify?.(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (isPasskeyLoading || isLoading) return;
    if (!isWebAuthnSupported()) {
      onNotify?.("WebAuthn / Passkeys are not supported on this browser or platform.", "error");
      return;
    }

    setIsPasskeyLoading(true);
    try {
      const cleanEmail = email.trim();
      const authResult = await loginWithPasskey(cleanEmail || undefined);
      onNotify?.(authResult.message || "Passkey verified! Successfully signed in.", "success");

      if (onLoginSuccess) {
        onLoginSuccess({
          email: authResult.user?.email || cleanEmail,
          username: authResult.user?.username || cleanEmail,
          role: authResult.user?.role,
          fullName: authResult.user?.fullName,
          token: authResult.token,
          passkeyVerified: true,
        });
      }
    } catch (err) {
      const msg = err.message || "Passkey authentication failed.";
      onNotify?.(msg, "error");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <>
      <header className="card__head">
        <h2 id="login-title">Welcome back</h2>
        <p>Sign in to your VaultAuth account.</p>
      </header>

      <form id="login-form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className={`field ${emailError ? "has-error" : ""}`} data-field="email">
          <label htmlFor="email">Email address</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2.500" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={() => {
                if (email) {
                  if (!EMAIL_RE.test(email.trim())) setEmailError("Enter a valid email address, like you@company.com.");
                  else setEmailError("");
                }
              }}
            />
          </div>
          {emailError && <p className="error" role="alert">{emailError}</p>}
        </div>

        {/* Password Field */}
        <div className={`field ${passwordError ? "has-error" : ""}`} data-field="password">
          <label htmlFor="password">Password</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
            />
            <button
              type="button"
              className="toggle"
              id="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              <svg className="eye" viewBox="0 0 24 24" aria-hidden="true" style={{ display: showPassword ? "none" : "block" }}>
                <path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg className="eye-off" viewBox="0 0 24 24" aria-hidden="true" style={{ display: showPassword ? "block" : "none" }}>
                <path d="M3 3l18 18M10.600 6.100A9.700 9.700 0 0 1 12 5c6.500 0 10 7 10 7a17 17 0 0 1-3.200 4.100M6.500 6.600C3.700 8.500 2 12 2 12s3.500 7 10 7c1.700 0 3.200-.4 4.500-1" />
                <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
              </svg>
            </button>
          </div>
          {passwordError && <p className="error" role="alert">{passwordError}</p>}
        </div>

        {/* Remember me & Forgot password */}
        <div className="row">
          <label className="check">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="check__box" aria-hidden="true"></span>
            <span>Remember me</span>
          </label>
          <button type="button" className="link" id="forgot-link" onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={`btn ${isLoading ? "is-loading" : ""}`}
          id="submit-btn"
          disabled={isLoading}
        >
          <span className="btn__label">{isLoading ? "Signing in…" : "Sign in"}</span>
          <span className="btn__spinner" aria-hidden="true"></span>
        </button>
      </form>

      {/* Only render passkey section when platform authenticator is available (or still checking) */}
      {passkeyAvailable !== false && (
        <>
          <div className="divider" role="separator"><span>OR</span></div>

          <button
            type="button"
            className="btn--passkey"
            id="btn-passkey-login"
            onClick={handlePasskeyLogin}
            disabled={isLoading || isPasskeyLoading || passkeyAvailable === null}
            aria-label="Sign in with a passkey (fingerprint, Face ID, or security key)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
              <path d="m21 2-9.6 9.6"/>
              <circle cx="7.5" cy="15.5" r="5.5"/>
            </svg>
            <span>{isPasskeyLoading ? "Verifying Passkey…" : passkeyAvailable === null ? "Checking passkey support…" : "Sign in with Passkey"}</span>
          </button>
        </>
      )}

      <p className="switch">
        Don't have an account?{" "}
        <button type="button" className="link" id="register-link" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </>
  );
}
