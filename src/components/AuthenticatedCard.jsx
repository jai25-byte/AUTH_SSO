import React, { useState, useEffect } from "react";
import { getCurrentUserRole } from "../services/adminApi.js";
import { registerPasskey, isWebAuthnSupported } from "../services/webauthn.js";

export default function AuthenticatedCard({ user, onSignOut, onNotify }) {
  const token = user?.token || localStorage.getItem("vault_auth_token") || "";
  const sessionToken = token ? (token.length > 28 ? token.slice(0, 24) + "…" : token) : "SSO-SEC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const [loginTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [userRole, setUserRole] = useState(null);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);

  const username = user?.username || user?.identifier || "Authenticated User";
  const email = user?.email;
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await getCurrentUserRole();
        if (res?.role) {
          setUserRole(res.role);
        }
      } catch {
        // Fallback
      }
    }
    checkRole();
  }, [token]);

  const handleLaunchApp = () => {
    onNotify?.("Launching your VaultAuth Dashboard…", "info");
    const tokenToPass = token || localStorage.getItem("vault_auth_token") || "";
    const tokenParam = tokenToPass ? `?token=${encodeURIComponent(tokenToPass)}` : "";
    setTimeout(() => {
      window.location.href = `/DASHBOARD/index.html${tokenParam}`;
    }, 400);
  };

  const handleLaunchAdmin = () => {
    onNotify?.("Opening VaultAuth Admin Dashboard…", "info");
    const tokenToPass = token || localStorage.getItem("vault_auth_token") || "";
    const tokenParam = tokenToPass ? `?token=${encodeURIComponent(tokenToPass)}` : "";
    setTimeout(() => {
      window.location.href = `/ADMIN/index.html${tokenParam}`;
    }, 400);
  };

  const handleRegisterPasskey = async () => {
    if (isRegisteringPasskey) return;
    if (!isWebAuthnSupported()) {
      onNotify?.("WebAuthn is not supported in this browser.", "error");
      return;
    }

    setIsRegisteringPasskey(true);
    try {
      const defaultDevice = navigator.userAgent.includes("Mac")
        ? "MacBook Passkey"
        : navigator.userAgent.includes("Windows")
        ? "Windows Hello"
        : "Passkey Authenticator";
      const res = await registerPasskey(defaultDevice);
      setPasskeyRegistered(true);
      onNotify?.(res.message || "Passkey registered successfully!", "success");
    } catch (err) {
      onNotify?.(err.message || "Failed to register passkey.", "error");
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  useEffect(() => {
    // Only auto-redirect regular users, giving admins time to choose portal
    if (userRole === "user") {
      const timer = setTimeout(() => handleLaunchApp(), 1600);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

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
        <p style={{ margin: "4px 0 0", fontSize: ".88rem", color: "var(--ink-500)" }}>
          {userRole === "admin" ? "Administrative session established" : "Redirecting to your dashboard…"}
        </p>
      </div>

      {/* User info */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
        background: "var(--ink-100)", borderRadius: "12px", marginBottom: "20px",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: userRole === "admin" ? "linear-gradient(135deg, #7047eb, #818cf8)" : "linear-gradient(135deg, var(--blue-500), var(--indigo-500))",
          color: "#fff", fontWeight: 700, fontSize: "1rem",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--ink-900)" }}>{email || username}</div>
          <div style={{ fontSize: ".8rem", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
            {userRole === "admin" ? "Enterprise Admin Session" : "Active SSO Session"}
          </div>
        </div>
      </div>

      {/* Session details */}
      <div style={{ marginBottom: "24px" }}>
        {[
          { label: "Assigned Role", value: userRole === "admin" ? "Enterprise Admin" : "End User", color: userRole === "admin" ? "#7047eb" : "inherit" },
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
      <div style={{ display: "grid", gap: "8px" }}>
        {userRole === "admin" && (
          <button
            type="button"
            className="btn"
            onClick={handleLaunchAdmin}
            style={{
              background: "linear-gradient(135deg, #7047eb, #4f46e5)",
              boxShadow: "0 8px 20px -6px rgba(112, 71, 235, 0.55)",
            }}
          >
            <span>Launch Admin Dashboard</span>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </button>
        )}

        <button
          type="button"
          className={userRole === "admin" ? "btn btn--ghost" : "btn"}
          onClick={handleLaunchApp}
        >
          <span>Continue to User Dashboard</span>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleRegisterPasskey}
          disabled={isRegisteringPasskey || passkeyRegistered}
          style={{
            borderColor: passkeyRegistered ? "var(--success)" : "var(--ink-200)",
            color: passkeyRegistered ? "var(--success)" : "var(--ink-900)",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: passkeyRegistered ? "#16a34a" : "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
            <path d="m21 2-9.6 9.6"/>
            <circle cx="7.5" cy="15.5" r="5.5"/>
          </svg>
          <span>{passkeyRegistered ? "Passkey Registered on Device ✓" : isRegisteringPasskey ? "Registering Passkey…" : "Register Passkey on this Device"}</span>
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          onClick={onSignOut}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
