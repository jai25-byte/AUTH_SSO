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
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
          Admin settings
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
          Organization-wide policies, authentication timeouts, password complexity rules, and mail transport.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Server size={16} color="var(--adm-link)" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--adm-text)" }}>Workspace overview</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            {[
              { label: "ORGANIZATION", val: formData.app_name || "VaultAuth SSO" },
              { label: "STACK", val: "React 19 + Python Flask" },
              { label: "ACCESS POLICY", val: "Server-Enforced RBAC" },
              { label: "ORIGIN SECURITY", val: "Restricted CORS Policy" },
            ].map((tile) => (
              <div key={tile.label} style={{ padding: "12px", background: "var(--adm-subtle)", borderRadius: "8px", border: "1px solid var(--adm-border)" }}>
                <div style={{ fontSize: "10.5px", color: "var(--adm-link)", fontWeight: 700 }}>{tile.label}</div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--adm-text)", marginTop: "4px" }}>{tile.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Clock size={16} color="var(--adm-link)" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--adm-text)" }}>Sessions &amp; token lifecycles</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                Session timeout (seconds)
              </label>
              <input
                type="number"
                name="session_timeout"
                value={formData.session_timeout}
                onChange={handleChange}
                min="300"
                max="86400"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", padding: "0 12px", fontSize: "13px", color: "var(--adm-text)" }}
              />
              <span style={{ fontSize: "11.5px", color: "var(--adm-muted)", display: "block", marginTop: "4px" }}>Default: 3600s (60 minutes).</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                OTP expiry (seconds)
              </label>
              <input
                type="number"
                name="otp_expiry_seconds"
                value={formData.otp_expiry_seconds}
                onChange={handleChange}
                min="60"
                max="900"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", padding: "0 12px", fontSize: "13px", color: "var(--adm-text)" }}
              />
              <span style={{ fontSize: "11.5px", color: "var(--adm-muted)", display: "block", marginTop: "4px" }}>Single-use code validity (default 300s).</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <KeyRound size={16} color="var(--adm-link)" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--adm-text)" }}>Authentication &amp; password policies</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                Minimum password length
              </label>
              <input
                type="number"
                name="password_min_length"
                value={formData.password_min_length}
                onChange={handleChange}
                min="8"
                max="32"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", padding: "0 12px", fontSize: "13px", color: "var(--adm-text)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                Account lockout threshold
              </label>
              <input
                type="number"
                name="max_failed_attempts"
                value={formData.max_failed_attempts}
                onChange={handleChange}
                min="3"
                max="20"
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", padding: "0 12px", fontSize: "13px", color: "var(--adm-text)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                MFA / Email OTP requirement
              </label>
              <select
                name="mfa_required"
                value={String(formData.mfa_required)}
                onChange={handleChange}
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", padding: "0 12px", fontSize: "13px", color: "var(--adm-text)", background: "var(--adm-input)" }}
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
              <Mail size={17} color={mailerConfigured ? "var(--adm-ok-text)" : "var(--adm-warn-text)"} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--adm-text)" }}>
                  Transactional Mailer ({mailProviderLabel})
                </div>
                <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
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
                background: mailerConfigured ? "var(--adm-ok-bg)" : "var(--adm-warn-bg)",
                border: `1px solid ${mailerConfigured ? "var(--adm-ok-border)" : "var(--adm-accent-border)"}`,
                color: mailerConfigured ? "var(--adm-ok-text)" : "var(--adm-warn-text)",
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
