import React, { useState } from "react";
import { register as apiRegister } from "../services/api.js";

export default function RegisterCard({ onSwitchToLogin, onNotify }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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
  const strengthColors = ["#dc2626", "#f97316", "#f59e0b", "#3b82f6", "#16a34a"];

  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, username, password, confirmPassword } = formData;
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!email.trim()) newErrors.email = "Email address is required.";
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiRegister({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      onNotify?.(`Account created for ${username.trim()}! Redirecting to sign in…`, "success");
      setTimeout(() => onSwitchToLogin(), 1000);
    } catch (err) {
      onNotify?.(err.message || "Registration failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="card__head">
        <h2>Create account</h2>
        <p>Join the VaultAuth SSO network.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className={`field ${errors.fullName ? "has-error" : ""}`}>
          <label htmlFor="reg-name">Full name</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.200" /><path d="M5 20c0-3.500 3.100-6 7-6s7 2.500 7 6" />
            </svg>
            <input
              id="reg-name"
              name="fullName"
              type="text"
              placeholder="Alex Morgan"
              autoComplete="name"
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          {errors.fullName && <p className="error">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className={`field ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="reg-email">Email address</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2.500" /><path d="m4 7 8 6 8-6" />
            </svg>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        {/* Username */}
        <div className={`field ${errors.username ? "has-error" : ""}`}>
          <label htmlFor="reg-username">Username</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.200" /><path d="M5 20c0-3.500 3.100-6 7-6s7 2.500 7 6" />
            </svg>
            <input
              id="reg-username"
              name="username"
              type="text"
              placeholder="alexmorgan"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          {errors.username && <p className="error">{errors.username}</p>}
        </div>

        {/* Password */}
        <div className={`field ${errors.password ? "has-error" : ""}`}>
          <label htmlFor="reg-password">Password</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              id="reg-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              <svg className="eye" viewBox="0 0 24 24" aria-hidden="true" style={{ display: showPassword ? "none" : "block" }}>
                <path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
              </svg>
              <svg className="eye-off" viewBox="0 0 24 24" aria-hidden="true" style={{ display: showPassword ? "block" : "none" }}>
                <path d="M3 3l18 18M10.600 6.100A9.700 9.700 0 0 1 12 5c6.500 0 10 7 10 7a17 17 0 0 1-3.200 4.100M6.500 6.600C3.700 8.500 2 12 2 12s3.500 7 10 7c1.700 0 3.200-.4 4.500-1" />
                <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
              </svg>
            </button>
          </div>
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <div style={{ padding: "0 2px", marginTop: "-10px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", fontWeight: 500, color: "var(--ink-600)", marginBottom: "4px" }}>
              <span>Password strength</span>
              <span style={{ fontWeight: 700, color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    height: "4px",
                    borderRadius: "4px",
                    background: strength >= step ? strengthColors[strength] : "var(--ink-200)",
                    transition: "background .3s",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className={`field ${errors.confirmPassword ? "has-error" : ""}`}>
          <label htmlFor="reg-confirm">Confirm password</label>
          <div className="control">
            <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        </div>

        {passwordsMatch && (
          <p style={{ fontSize: ".8rem", color: "var(--success)", fontWeight: 600, margin: "-10px 0 14px 2px" }}>
            ✓ Passwords match
          </p>
        )}
        {passwordsMismatch && (
          <p style={{ fontSize: ".8rem", color: "var(--danger)", fontWeight: 600, margin: "-10px 0 14px 2px" }}>
            ✗ Passwords do not match
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          className={`btn ${isLoading ? "is-loading" : ""}`}
          disabled={isLoading}
          style={{ marginTop: "8px" }}
        >
          <span className="btn__label">{isLoading ? "Creating account…" : "Create account"}</span>
          <span className="btn__spinner" aria-hidden="true"></span>
        </button>
      </form>

      <p className="switch">
        Already have an account?{" "}
        <button type="button" className="link" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </>
  );
}
