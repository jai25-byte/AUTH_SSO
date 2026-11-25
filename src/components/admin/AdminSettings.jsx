import React, { useState, useEffect } from "react";
import { Clock, KeyRound, Mail, Save, Server } from "lucide-react";

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
  const mailProviderLabel =
    settings?.mail_provider || (settings?.smtp_configured ? "SMTP" : settings?.otp_configured ? "Plunk" : "Unconfigured");

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData((prev) => ({
        ...prev,
        app_name: settings.app_name || prev.app_name,
        session_timeout: settings.session_timeout || prev.session_timeout,
        max_failed_attempts: settings.max_failed_attempts || prev.max_failed_attempts,
        password_min_length: settings.password_min_length || prev.password_min_length,
        mfa_required: String(settings.mfa_required ?? prev.mfa_required),
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
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
          Admin settings
        </h1>
        <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: "13px" }}>
          Organization-wide policies, authentication timeouts, password complexity rules, and mail transport.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Server size={16} color="#F7D794" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#ffffff" }}>Workspace overview</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            {[
              { label: "ORGANIZATION", val: formData.app_name || "VaultAuth SSO" },
              { label: "STACK", val: "React 19 + Python Flask" },
              { label: "ACCESS POLICY", val: "Server-Enforced RBAC" },
              { label: "ORIGIN SECURITY", val: "Restricted CORS Policy" },
            ].map((tile) => (
              <div key={tile.label} style={{ padding: "12px", background: "#000000", borderRadius: "8px", border: "1px solid #1f1f1f" }}>
                <div style={{ fontSize: "10.5px", color: "#F7D794", fontWeight: 700 }}>{tile.label}</div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#ffffff", marginTop: "4px" }}>{tile.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Clock size={16} color="#F7D794" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#ffffff" }}>Sessions &amp; token lifecycles</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "5px" }}>
                Session timeout (seconds)
              </label>
              <input
                type="number"
                name="session_timeout"
                value={formData.session_timeout}
                onChange={handleChange}
                min="300"
                max="86400"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", padding: "0 12px", fontSize: "13px", color: "#ffffff" }}
              />
              <span style={{ fontSize: "11.5px", color: "#71717a", display: "block", marginTop: "4px" }}>Default: 3600s (60 minutes).</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "5px" }}>
                OTP expiry (seconds)
              </label>
              <input
                type="number"
                name="otp_expiry_seconds"
                value={formData.otp_expiry_seconds}
                onChange={handleChange}
                min="60"
                max="900"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", padding: "0 12px", fontSize: "13px", color: "#ffffff" }}
              />
              <span style={{ fontSize: "11.5px", color: "#71717a", display: "block", marginTop: "4px" }}>Single-use code validity (default 300s).</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <KeyRound size={16} color="#F7D794" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#ffffff" }}>Authentication &amp; password policies</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "5px" }}>
                Minimum password length
              </label>
              <input
                type="number"
                name="password_min_length"
                value={formData.password_min_length}
                onChange={handleChange}
                min="8"
                max="32"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", padding: "0 12px", fontSize: "13px", color: "#ffffff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "5px" }}>
                Account lockout threshold
              </label>
              <input
                type="number"
                name="max_failed_attempts"
                value={formData.max_failed_attempts}
                onChange={handleChange}
                min="3"
                max="20"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", padding: "0 12px", fontSize: "13px", color: "#ffffff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "5px" }}>
                MFA / Email OTP requirement
              </label>
              <select
                name="mfa_required"
                value={String(formData.mfa_required)}
                onChange={handleChange}
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", padding: "0 12px", fontSize: "13px", color: "#ffffff", background: "#000000" }}
              >
                <option value="false">Optional (Direct password login)</option>
                <option value="true">Enforced (Require 6-digit OTP)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail size={17} color={mailerConfigured ? "#4ade80" : "#F7D794"} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#ffffff" }}>
                  Transactional Mailer ({mailProviderLabel})
                </div>
                <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
                  Dispatches 6-digit OTP verification and password recovery messages.
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "6px",
                background: mailerConfigured ? "rgba(34, 197, 94, 0.14)" : "rgba(247, 215, 148, 0.14)",
                border: `1px solid ${mailerConfigured ? "rgba(34, 197, 94, 0.3)" : "rgba(247, 215, 148, 0.35)"}`,
                color: mailerConfigured ? "#4ade80" : "#F7D794",
              }}
            >
              {mailerConfigured ? "CONNECTED" : "UNCONFIGURED"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving || loading}
            className="btn"
            style={{ height: "38px", padding: "0 18px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}
          >
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
