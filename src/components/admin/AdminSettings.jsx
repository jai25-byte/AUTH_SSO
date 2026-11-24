import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Clock,
  KeyRound,
  Mail,
  Save,
  CheckCircle2,
  Info,
  Server,
  Lock,
} from "lucide-react";

export default function AdminSettings({
  settings = {},
  onSaveSettings,
  loading,
}) {
  const [formData, setFormData] = useState({
    app_name: "VaultAuth SSO",
    session_timeout: "3600",
    max_failed_attempts: "5",
    password_min_length: "8",
    mfa_required: "false",
    otp_expiry_seconds: "300",
  });
  const [saving, setSaving] = useState(false);

  const mailerConfigured = Boolean(settings?.smtp_configured || settings?.otp_configured);
  const mailProviderLabel = settings?.mail_provider || (settings?.smtp_configured ? "SMTP" : settings?.otp_configured ? "Plunk" : "Unconfigured");

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData((prev) => ({
        ...prev,
        app_name: settings.app_name || prev.app_name,
        session_timeout: settings.session_timeout || prev.session_timeout,
        max_failed_attempts: settings.max_failed_attempts || prev.max_failed_attempts,
        password_min_length: settings.password_min_length || prev.password_min_length,
        mfa_required: settings.mfa_required || prev.mfa_required,
        otp_expiry_seconds: settings.otp_expiry_seconds || prev.otp_expiry_seconds,
      }));
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          System &amp; Security Configuration
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
          Tune platform authentication parameters, session lifespan thresholds, password complexity gates, and cryptographic telemetry.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
        {/* Card 1: Application Information (Read-only System Telemetry) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Server size={18} color="#7047eb" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Application &amp; Runtime Overview
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>PLATFORM NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginTop: "4px" }}>VaultAuth SSO Enterprise</div>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>ARCHITECTURE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginTop: "4px" }}>React 19 + Python Flask</div>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>PRIMARY DATABASE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginTop: "4px" }}>PostgreSQL (Prisma Accelerate)</div>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>CORS PROTECTION</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#16a34a", marginTop: "4px" }}>Restricted Allowed Origins</div>
            </div>
          </div>
        </div>

        {/* Card 2: Session & Authentication Parameters */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Clock size={18} color="#0284c7" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Session &amp; Token Lifecycles
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Session Lifetime (seconds)
              </label>
              <input
                type="number"
                name="session_timeout"
                value={formData.session_timeout}
                onChange={handleChange}
                min="300"
                max="86400"
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "0.9rem",
                  color: "#111827",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Standard: 3600s (1 hour). Maximum: 86400s (24 hours).
              </span>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                OTP Code Expiry (seconds)
              </label>
              <input
                type="number"
                name="otp_expiry_seconds"
                value={formData.otp_expiry_seconds}
                onChange={handleChange}
                min="60"
                max="900"
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "0.9rem",
                  color: "#111827",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Single-use one-time password validity window (default 300s).
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Credential & Password Security Policies */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <KeyRound size={18} color="#ea580c" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Password Policy &amp; Brute-Force Defense
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Minimum Password Length
              </label>
              <input
                type="number"
                name="password_min_length"
                value={formData.password_min_length}
                onChange={handleChange}
                min="8"
                max="32"
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "0.9rem",
                  color: "#111827",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Requires combination of lowercase, uppercase, digits, and special characters.
              </span>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Max Failed Attempts Before Lockout
              </label>
              <input
                type="number"
                name="max_failed_attempts"
                value={formData.max_failed_attempts}
                onChange={handleChange}
                min="3"
                max="20"
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "0.9rem",
                  color: "#111827",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Maximum incorrect OTP verification attempts before invalidation.
              </span>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Require Email OTP (2FA) on Password Login
              </label>
              <select
                name="mfa_required"
                value={String(formData.mfa_required)}
                onChange={handleChange}
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "0.9rem",
                  color: "#111827",
                  backgroundColor: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="false">Optional (Password signs in directly)</option>
                <option value="true">Enforced (Require 6-digit Email OTP)</option>
              </select>
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Enable only when an email delivery provider is connected and verified.
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: OTP Mailer & External Integration Status */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Mail size={18} color="#16a34a" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Transactional Mailer Integration ({mailProviderLabel})
            </h2>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: mailerConfigured ? "#16a34a" : "#ea580c",
                  }}
                />
                <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.92rem" }}>
                  OTP &amp; Password Reset Email Service ({mailProviderLabel})
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: mailerConfigured ? "#dcfce7" : "#ffedd5",
                    color: mailerConfigured ? "#15803d" : "#c2410c",
                  }}
                >
                  {mailerConfigured ? "CONNECTED & ACTIVE" : "NOT CONFIGURED IN .ENV"}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                Delivers 6-digit cryptographic verification codes directly to employee inboxes. Credentials remain secure on the server.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn"
            style={{
              height: "44px",
              padding: "0 24px",
              width: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #7047eb, #4f46e5)",
              boxShadow: "0 4px 14px rgba(112, 71, 235, 0.35)",
            }}
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Apply Security Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
