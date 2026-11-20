import React, { useState, useEffect } from "react";

export default function AuthenticatedCard({ user, onSignOut, onNotify }) {
  const token = user?.token || localStorage.getItem("vault_auth_token") || "";
  const sessionToken = token ? (token.length > 28 ? token.slice(0, 24) + "…" : token) : "SSO-SEC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const [loginTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const username = user?.username || user?.identifier || "Authenticated User";
  const email = user?.email;
  const initial = username.charAt(0).toUpperCase();

  const handleLaunchApp = () => {
    onNotify?.("Launching your VaultAuth Dashboard…", "info");
    const tokenToPass = token || localStorage.getItem("vault_auth_token") || "";
    const tokenParam = tokenToPass ? `?token=${encodeURIComponent(tokenToPass)}` : "";
    setTimeout(() => {
      window.location.href = `/DASHBOARD/index.html${tokenParam}`;
    }, 400);
  };

  useEffect(() => {
    const timer = setTimeout(() => handleLaunchApp(), 1400);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div>
      {/* Success icon */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "rgba(22,163,74,.12)", border: "2px solid rgba(22,163,74,.3)",
          marginBottom: "12px",
        }}>
          <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: "none", stroke: "#16a34a", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.9 7.5 9.5 4.4-1.6 7.5-4.9 7.5-9.5V6L12 3Z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--ink-900)" }}>Identity verified</h3>
        <p style={{ margin: "4px 0 0", fontSize: ".88rem", color: "var(--ink-500)" }}>Redirecting to your dashboard…</p>
      </div>

      {/* User info */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
        background: "var(--ink-100)", borderRadius: "12px", marginBottom: "20px",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--blue-500), var(--indigo-500))",
          color: "#fff", fontWeight: 700, fontSize: "1rem",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--ink-900)" }}>{email || username}</div>
          <div style={{ fontSize: ".8rem", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
            Active SSO Session
          </div>
        </div>
      </div>

      {/* Session details */}
      <div style={{ marginBottom: "24px" }}>
        {[
          { label: "Session Token", value: sessionToken },
          { label: "Verified At", value: loginTime },
          { label: "Encryption", value: "256-bit SSL / SAML 2.0", color: "#16a34a" },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", fontSize: ".82rem", marginBottom: "4px",
            background: "var(--ink-100)", borderRadius: "8px",
          }}>
            <span style={{ color: "var(--ink-500)" }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: item.color || "var(--ink-900)", fontFamily: item.label === "Session Token" ? "monospace" : "inherit" }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <button type="button" className="btn" onClick={handleLaunchApp}>
        <span>Continue to Dashboard</span>
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onSignOut}
        style={{ marginTop: "8px" }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        <span>Sign out</span>
      </button>
    </div>
  );
}
