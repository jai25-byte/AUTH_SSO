import React from "react";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Monitor,
  AlertTriangle,
  Flame,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminOverview({
  stats,
  recentActivity = [],
  loading,
  onRefresh,
  onNavigate,
  onOpenAddUser,
}) {
  const statCards = [
    {
      id: "total_users",
      label: "Total Users",
      value: stats?.total_users ?? 0,
      subtext: "Registered directory accounts",
      icon: Users,
      color: "#4f46e5",
      bgColor: "#eef2ff",
      accentBorder: "#6366f1",
      targetPage: "users",
    },
    {
      id: "active_users",
      label: "Active Users",
      value: stats?.active_users ?? 0,
      subtext: "Currently enabled accounts",
      icon: UserCheck,
      color: "#16a34a",
      bgColor: "#f0fdf4",
      accentBorder: "#22c55e",
      targetPage: "users",
    },
    {
      id: "administrators",
      label: "Administrators",
      value: stats?.administrators ?? 0,
      subtext: "Elevated IAM role permissions",
      icon: ShieldAlert,
      color: "#7047eb",
      bgColor: "#f5f3ff",
      accentBorder: "#8b5cf6",
      targetPage: "roles",
    },
    {
      id: "active_sessions",
      label: "Active Sessions",
      value: stats?.active_sessions ?? 0,
      subtext: "Valid non-revoked sessions",
      icon: Monitor,
      color: "#0284c7",
      bgColor: "#f0f9ff",
      accentBorder: "#38bdf8",
      targetPage: "sessions",
    },
    {
      id: "failed_logins",
      label: "Failed Logins (24h)",
      value: stats?.failed_logins_24h ?? 0,
      subtext: "Unsuccessful login attempts",
      icon: AlertTriangle,
      color: "#ea580c",
      bgColor: "#fff7ed",
      accentBorder: "#fb923c",
      targetPage: "activity",
    },
    {
      id: "suspicious",
      label: "Suspicious Events (24h)",
      value: stats?.suspicious_activities_24h ?? 0,
      subtext: "Anomalous or blocked actions",
      icon: Flame,
      color: "#dc2626",
      bgColor: "#fef2f2",
      accentBorder: "#f87171",
      targetPage: "audit",
    },
  ];

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "24px" }}>
      {/* Top action header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            IAM Overview &amp; Health
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.88rem" }}>
            Real-time identity lifecycle, authentication telemetry, and active workloads.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onRefresh}
            className="btn btn--ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              height: "38px",
              fontSize: "0.86rem",
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenAddUser}
            className="btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              height: "38px",
              fontSize: "0.86rem",
              background: "linear-gradient(135deg, #7047eb, #4f46e5)",
            }}
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 6 Statistic Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onNavigate(card.targetPage)}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderLeft: `4px solid ${card.accentBorder}`,
                borderRadius: "12px",
                padding: "20px 18px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(15, 23, 42, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.05)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#64748b" }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: card.bgColor,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon size={18} color={card.color} />
                </div>
              </div>

              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
                {loading ? "…" : card.value}
              </div>

              <div style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{card.subtext}</span>
                <ArrowRight size={13} color="#94a3b8" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Security Status & Recent Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.1fr)", gap: "20px" }}>
        {/* Recent Login Telemetry */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#7047eb" />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                Recent Authentication Stream
              </h2>
            </div>
            <button
              onClick={() => onNavigate("activity")}
              className="btn btn--ghost"
              style={{
                fontSize: "0.78rem",
                padding: "4px 10px",
                height: "28px",
                border: "none",
                color: "#7047eb",
                fontWeight: 600,
              }}
            >
              View All Activity →
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 16px", color: "#9ca3af" }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "0.88rem" }}>No recent logins logged in this period.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>User / Email</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Device &amp; Browser</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>IP Address</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.slice(0, 7).map((item) => {
                    const isSuccess = (item.status || "").toLowerCase() === "success";
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f8fafc",
                          transition: "background 0.1s",
                        }}
                      >
                        <td style={{ padding: "10px 10px", color: "#111827", fontWeight: 600 }}>
                          <div>{item.username || "Anonymous"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 400 }}>{item.email || "—"}</div>
                        </td>
                        <td style={{ padding: "10px 10px", color: "#475569" }}>
                          <div>{item.device_name || "Web Client"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{item.browser} • {item.os}</div>
                        </td>
                        <td style={{ padding: "10px 10px", color: "#64748b", fontFamily: "monospace", fontSize: "0.82rem" }}>
                          {item.ip_address || "127.0.0.1"}
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              backgroundColor: isSuccess ? "#ecfdf5" : "#fef2f2",
                              color: isSuccess ? "#15803d" : "#b91c1c",
                              border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
                            }}
                          >
                            {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", color: "#64748b", fontSize: "0.78rem" }}>
                          {item.created_at || "Just now"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick System Controls & Posture */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Shield size={18} color="#16a34a" />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                IAM Security Posture
              </h2>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              VaultAuth SSO protects enterprise credentials with salted SHA-256 hashes, rate-limited sliding window OTPs, and strict RBAC authorization.
            </p>

            <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>RBAC Enforcement</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>
                  Active (Strict)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>Token Secret Signatures</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>
                  Verified
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>Session Invalidation Hook</span>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>
                  Synchronized
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            <button
              onClick={() => onNavigate("sessions")}
              className="btn btn--ghost"
              style={{
                width: "100%",
                height: "38px",
                fontSize: "0.84rem",
                justifyContent: "center",
              }}
            >
              Inspect Active Sessions
            </button>
            <button
              onClick={() => onNavigate("audit")}
              className="btn btn--ghost"
              style={{
                width: "100%",
                height: "38px",
                fontSize: "0.84rem",
                justifyContent: "center",
              }}
            >
              Open Security Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
