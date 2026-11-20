import React, { useState } from "react";

export default function ForgotPasswordModal({ isOpen, onClose, onNotify }) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      onNotify?.(`Reset link sent to ${email}`, "success");
    }, 800);
  };

  const handleReset = () => {
    setEmail("");
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)",
    }}>
      <div className="card" style={{ position: "relative", maxWidth: "420px" }}>
        {/* Close */}
        <button
          onClick={handleReset}
          type="button"
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ink-500)", fontSize: "1.2rem", padding: "4px",
          }}
        >
          ×
        </button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "48px", height: "48px", borderRadius: "12px",
            background: "var(--ink-100)", marginBottom: "12px",
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "none", stroke: "var(--ink-900)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
            </svg>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-900)" }}>Forgot password?</h2>
          <p style={{ margin: 0, fontSize: ".88rem", color: "var(--ink-500)" }}>
            Enter your email and we'll send recovery instructions.
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "var(--success)", marginBottom: "12px" }}>
              <svg viewBox="0 0 24 24" style={{ width: 44, height: 44, margin: "0 auto", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <p style={{ fontSize: ".92rem", color: "var(--ink-900)", marginBottom: "16px" }}>
              Check your inbox! Reset link sent to <strong>{email}</strong>
            </p>
            <button type="button" className="btn" onClick={handleReset}>Return to login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="forgot-email">Email address</label>
              <div className="control">
                <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m4 7 8 6 8-6"/></svg>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading && <span className="btn__spinner" style={{ display: "inline-block" }} />}
              <span>{isLoading ? "Sending…" : "Send reset link"}</span>
            </button>
            <p style={{ textAlign: "center", marginTop: "12px" }}>
              <button type="button" className="link" onClick={handleReset} style={{ fontSize: ".85rem" }}>Cancel</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
