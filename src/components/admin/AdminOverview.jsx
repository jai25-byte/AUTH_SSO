import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Check,
  RefreshCw,
} from "lucide-react";

export default function AdminOverview({
  stats,
  sessions = [],
  sessionsTotal = 0,
  users = [],
  rolesData = { roles: [] },
  apps = [],
  settings = {},
  adminUser,
  loading,
  onRefresh,
  onNavigate,
  onOpenAddUser,
  onRevokeSession,
  onAssignRole,
  onToggleApp,
  onExportReport,
}) {
  const [roleDrafts, setRoleDrafts] = useState({});

  useEffect(() => {
    const next = {};
    (users || []).slice(0, 3).forEach((u) => {
      next[u.uid] = u.role || "user";
    });
    setRoleDrafts(next);
  }, [users]);

  const totalUsers = stats?.total_users ?? users.length ?? 0;
  const activeUsers = stats?.active_users ?? 0;
  const totalAdmins = stats?.administrators ?? stats?.total_admins ?? 0;
  const activeSessionsCount =
    stats?.active_sessions ?? sessions.filter((s) => s.is_active).length ?? 0;
  const failedLogins = stats?.failed_logins_24h ?? 0;
  const suspiciousCount = stats?.suspicious_activities_24h ?? 0;
  const activePct = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0.0";

  const activeAppsCount = apps.filter(
    (a) => (a.status || "Active").toLowerCase() === "active"
  ).length;
  const inactiveAppsCount = Math.max(0, apps.length - activeAppsCount);

  const uniqueSessionUsers = new Set(sessions.map((s) => s.uid || s.username)).size;
  const mfaRequired =
    settings?.mfa_required === true || String(settings?.mfa_required) === "true";
  const minPassLen = Number(settings?.password_min_length) || 8;
  const mailerConfigured = Boolean(settings?.smtp_configured || settings?.otp_configured);
  const mailProvider =
    settings?.mail_provider ||
    (settings?.smtp_configured ? "SMTP" : settings?.otp_configured ? "Plunk" : "Email / In-app");

  const securityScore = Math.min(
    100,
    Math.max(
      50,
      70 +
        (mfaRequired ? 15 : 5) +
        (minPassLen >= 8 ? 10 : 0) +
        (suspiciousCount === 0 ? 5 : 0) -
        Math.min(15, failedLogins > 10 ? 10 : 0)
    )
  );
  const isHealthy = suspiciousCount === 0;

  const kpiCards = [
    {
      label: "Total registered users",
      value: totalUsers,
      subtext:
        stats?.new_users_today > 0
          ? `+${stats.new_users_today} this period`
          : "Directory accounts",
      subColor: stats?.new_users_today > 0 ? "var(--adm-ok-text)" : "var(--adm-muted)",
      page: "users",
    },
    {
      label: "Active users",
      value: activeUsers,
      subtext: `${activePct}% of all users`,
      subColor: "var(--adm-muted)",
      page: "users",
    },
    {
      label: "Total administrators",
      value: totalAdmins,
      subtext: "Elevated IAM access",
      subColor: "var(--adm-muted)",
      page: "roles",
    },
    {
      label: "Active sessions",
      value: activeSessionsCount,
      subtext: `Across ${uniqueSessionUsers} users`,
      subColor: "var(--adm-muted)",
      page: "sessions",
    },
    {
      label: "Connected applications",
      value: apps.length,
      subtext: `${activeAppsCount} active · ${inactiveAppsCount} inactive`,
      subColor: "var(--adm-muted)",
      page: "applications",
    },
    {
      label: "Failed login attempts",
      value: failedLogins,
      subtext: "Last 24 hours",
      subColor: failedLogins > 0 ? "var(--adm-warn-text)" : "var(--adm-muted)",
      page: "activity",
    },
  ];

  const previewSessions = sessions.slice(0, 4);
  const previewUsers = users.slice(0, 3);
  const previewApps = apps.slice(0, 3);
  const rolesCount = rolesData?.roles?.length || 2;
  const displayedSessionsTotal = sessionsTotal || sessions.length;

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      {/* Workspace Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--adm-link)",
            }}
          >
            WORKSPACE OVERVIEW
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "var(--adm-text)",
              margin: "2px 0 4px",
              letterSpacing: "-0.025em",
            }}
          >
            Admin dashboard
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--adm-text-2)" }}>
            Manage identities. Control access. Keep your organization secure.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn btn--ghost"
            style={{
              height: "36px",
              padding: "0 12px",
              fontSize: "12.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Refresh workspace metrics"
          >
            {loading ? (
              <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <ChevronDown size={14} color="var(--adm-text-2)" />
            )}
            <span>Last 24 hours</span>
          </button>

          <button
            type="button"
            onClick={onExportReport}
            className="btn btn--ghost"
            style={{
              height: "36px",
              padding: "0 13px",
              fontSize: "12.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Download size={13} color="var(--adm-link)" />
            <span>Export report</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddUser}
            className="btn"
            style={{
              height: "36px",
              padding: "0 14px",
              fontSize: "12.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            <span>Add user</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Metric Cards */}
      <div className="vw-kpi-grid">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            onClick={() => onNavigate(card.page)}
            style={{
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-border)",
              boxShadow: "var(--adm-shadow-sm)",
              borderRadius: "10px",
              padding: "16px",
              cursor: "pointer",
              transition: "border-color 0.15s ease, transform 0.15s ease, background-color 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--adm-accent)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--adm-border)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--adm-text-2)" }}>
              {card.label}
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--adm-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {loading && !stats ? "—" : Number(card.value).toLocaleString()}
            </div>
            <div style={{ fontSize: "11.5px", color: card.subColor, fontWeight: 500 }}>
              {card.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Organization Security Banner */}
      <div
        style={{
          background: isHealthy ? "var(--adm-health-bg)" : "var(--adm-danger-bg)",
          border: `1px solid ${isHealthy ? "var(--adm-health-border)" : "var(--adm-danger-border)"}`,
          borderRadius: "10px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: isHealthy ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)",
              border: `1px solid ${isHealthy ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} color={isHealthy ? "var(--adm-health-score)" : "var(--adm-danger-text)"} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-text)" }}>
                {isHealthy ? "Your organization is protected" : "Security alerts detected"}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: isHealthy ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)",
                  color: isHealthy ? "var(--adm-ok-text)" : "var(--adm-danger-text)",
                  border: `1px solid ${isHealthy ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`,
                }}
              >
                {isHealthy ? "HEALTHY" : "REVIEW"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--adm-text-2)", marginTop: "2px" }}>
              {mfaRequired ? "MFA enabled across workspace" : "MFA optional for standard users"} ·{" "}
              {suspiciousCount === 0
                ? "No critical threats detected"
                : `${suspiciousCount} flagged events in the past 24h`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "19px", fontWeight: 700, color: isHealthy ? "var(--adm-health-score)" : "var(--adm-danger-text)", lineHeight: 1.1 }}>
              {securityScore} / 100
            </div>
            <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>Security score</div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("audit")}
            className="btn btn--ghost"
            style={{
              height: "34px",
              padding: "0 12px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={13} color="var(--adm-link)" />
            <span>View security report</span>
          </button>
        </div>
      </div>

      {/* Active Sessions Preview Card */}
      <div
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "var(--adm-shadow-sm)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--adm-border-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--adm-text)", margin: 0 }}>
              Active sessions
            </h2>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                background: "var(--adm-accent-soft)",
                color: "var(--adm-link)",
                border: "1px solid var(--adm-accent-border)",
                padding: "1px 8px",
                borderRadius: "6px",
              }}
            >
              {displayedSessionsTotal}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("sessions")}
            style={{
              background: "none",
              border: "none",
              color: "var(--adm-link)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all sessions →
          </button>
        </div>

        {(failedLogins > 0 || suspiciousCount > 0) && (
          <div
            style={{
              margin: "12px 20px 4px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "var(--adm-warn-banner-bg)",
              border: "1px solid var(--adm-warn-banner-border)",
              borderLeft: "3px solid var(--adm-warn-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "12px",
              color: "var(--adm-warn-banner-text)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={14} color="var(--adm-warn-border)" />
              <span>
                {failedLogins > 0
                  ? `${failedLogins} failed login attempt${failedLogins === 1 ? "" : "s"} in the last 24h require review`
                  : `${suspiciousCount} suspicious event${suspiciousCount === 1 ? "" : "s"} flagged`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("activity")}
              style={{
                background: "none",
                border: "none",
                color: "var(--adm-warn-banner-text)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Review activity →
            </button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  background: "var(--adm-table-head-bg)",
                  borderBottom: "1px solid var(--adm-border)",
                  color: "var(--adm-muted)",
                  fontSize: "10.5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "11px 20px", fontWeight: 600 }}>User</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Device / Browser</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>IP / Location</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Last active</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "11px 20px", fontWeight: 600, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {previewSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "28px 20px", textAlign: "center", color: "var(--adm-muted)" }}>
                    No sessions recorded yet.
                  </td>
                </tr>
              ) : (
                previewSessions.map((sess, idx) => {
                  const isActive = Boolean(sess.is_active);
                  const isCurrent = idx === 0 && isActive && sess.uid === adminUser?.uid;
                  return (
                    <tr
                      key={sess.id || sess.session_id || idx}
                      style={{ borderBottom: "1px solid var(--adm-border-soft)" }}
                    >
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ fontWeight: 600, color: "var(--adm-text)" }}>
                          {sess.full_name || sess.username || "User"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
                          {sess.email || `UID #${sess.uid}`}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--adm-body)", fontWeight: 500 }}>
                          {sess.device_name || "Web Client"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
                          {[sess.browser, sess.os].filter(Boolean).join(" · ") || "Browser session"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--adm-body)" }}>
                          {sess.ip_address || "127.0.0.1"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
                          {sess.location || "Local / Verified"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--adm-text-2)" }}>
                        {sess.last_activity || sess.created_at || "Recent"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 9px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: isActive ? "var(--adm-ok-bg)" : "var(--adm-warn-bg)",
                            color: isActive ? "var(--adm-ok-text)" : "var(--adm-warn-text)",
                            border: `1px solid ${isActive ? "var(--adm-ok-border)" : "var(--adm-accent-border)"}`,
                          }}
                        >
                          {isCurrent ? "Current" : isActive ? "Active" : sess.status || "Revoked"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right" }}>
                        {isActive && !isCurrent ? (
                          <button
                            type="button"
                            onClick={() => onRevokeSession && onRevokeSession(sess.session_id || sess.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--adm-danger-text)",
                              fontWeight: 600,
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <span style={{ color: "var(--adm-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--adm-border-soft)",
            background: "var(--adm-table-foot-bg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "12px",
            color: "var(--adm-text-2)",
          }}
        >
          <span>
            Showing {previewSessions.length} of {displayedSessionsTotal} sessions
          </span>
          <button
            type="button"
            onClick={() => onNavigate("sessions")}
            style={{
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-danger-border)",
              color: "var(--adm-danger-text)",
              borderRadius: "7px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Revoke all sessions for a user
          </button>
        </div>
      </div>

      {/* Two Column Row: Roles & Permissions + Connected Applications */}
      <div className="vw-two-col">
        {/* Left: Roles & Permissions */}
        <div
          style={{
            background: "var(--adm-surface)",
            border: "1px solid var(--adm-border)",
            boxShadow: "var(--adm-shadow-sm)",
            borderRadius: "12px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--adm-text)", margin: 0 }}>
                Roles &amp; permissions
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("roles")}
                className="btn btn--ghost"
                style={{ height: "30px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}
              >
                + Assign role
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--adm-text-2)", marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>{totalAdmins} administrators · {rolesCount} roles</span>
              <button
                type="button"
                onClick={() => onNavigate("users")}
                style={{ background: "none", border: "none", color: "var(--adm-link)", fontWeight: 600, fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                Manage all users →
              </button>
            </div>

            <div style={{ marginTop: "12px", borderTop: "1px solid var(--adm-border-soft)" }}>
              {previewUsers.length === 0 ? (
                <div style={{ padding: "18px 0", fontSize: "12.5px", color: "var(--adm-muted)" }}>
                  No users loaded in directory.
                </div>
              ) : (
                previewUsers.map((u) => {
                  const draftRole = roleDrafts[u.uid] ?? (u.role || "user");
                  return (
                    <div
                      key={u.uid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "11px 0",
                        borderBottom: "1px solid var(--adm-border-soft)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.full_name || u.username}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <select
                          value={draftRole}
                          onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.uid]: e.target.value }))}
                          aria-label={`Select role for ${u.username}`}
                          style={{
                            height: "30px",
                            padding: "0 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--adm-border-strong)",
                            background: "var(--adm-input)",
                            color: "var(--adm-text)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="admin">Administrator</option>
                          <option value="user">Member</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => onAssignRole && onAssignRole(u.uid, draftRole)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--adm-link)",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Change role
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              background: "var(--adm-subtle)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: "var(--adm-ok-text)" }}>
                <Check size={13} />
                <span>Unauthorized access restricted</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--adm-muted)", marginTop: "1px" }}>
                Server-enforced RBAC policy is active
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("roles")}
              className="btn btn--ghost"
              style={{ height: "30px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}
            >
              Edit permissions
            </button>
          </div>
        </div>

        {/* Right: Connected Applications */}
        <div
          style={{
            background: "var(--adm-surface)",
            border: "1px solid var(--adm-border)",
            boxShadow: "var(--adm-shadow-sm)",
            borderRadius: "12px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--adm-text)", margin: 0 }}>
                Connected applications
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("applications")}
                className="btn btn--ghost"
                style={{ height: "30px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}
              >
                + View apps
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--adm-text-2)", marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>{apps.length} registered applications</span>
              <button
                type="button"
                onClick={() => onNavigate("applications")}
                style={{ background: "none", border: "none", color: "var(--adm-link)", fontWeight: 600, fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                View all applications →
              </button>
            </div>

            <div style={{ marginTop: "12px", borderTop: "1px solid var(--adm-border-soft)" }}>
              {previewApps.length === 0 ? (
                <div style={{ padding: "22px 0", fontSize: "12.5px", color: "var(--adm-muted)" }}>
                  No external OAuth/SSO applications registered.
                </div>
              ) : (
                previewApps.map((app) => {
                  const isAppActive = (app.status || "Active").toLowerCase() === "active";
                  return (
                    <div
                      key={app.id || app.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "11px 0",
                        borderBottom: "1px solid var(--adm-border-soft)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "7px",
                            background: "var(--adm-accent-soft)",
                            border: "1px solid var(--adm-accent-border)",
                            color: "var(--adm-link)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {app.logo || (app.name || "A").substring(0, 1).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.name}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--adm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.desc || `${(app.permissions || []).length} permissions`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAppActive}
                          onClick={() => onToggleApp && onToggleApp(app)}
                          style={{
                            width: "34px",
                            height: "18px",
                            borderRadius: "9999px",
                            border: "none",
                            padding: "2px",
                            background: isAppActive ? "var(--adm-accent)" : "var(--adm-switch-off)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isAppActive ? "flex-end" : "flex-start",
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                          }}
                          title={isAppActive ? "Active — click to manage" : "Inactive"}
                        >
                          <span
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              background: isAppActive ? "var(--adm-switch-knob-on)" : "var(--adm-switch-knob-off)",
                            }}
                          />
                        </button>
                        <span style={{ fontSize: "11.5px", color: isAppActive ? "var(--adm-ok-text)" : "var(--adm-muted)", minWidth: "44px" }}>
                          {isAppActive ? "Active" : "Inactive"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate("applications")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--adm-link)",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Manage →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
            Manage connected OAuth apps, scopes, and access status.
          </div>
        </div>
      </div>

      {/* Admin Settings Quick Summary Card */}
      <div
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "var(--adm-shadow-sm)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--adm-text)", margin: 0 }}>
              Admin settings
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--adm-text-2)" }}>
              Organization-wide policies and account preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="btn btn--ghost"
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
          >
            Manage all settings →
          </button>
        </div>

        <div className="vw-settings-grid">
          {/* Column 1 */}
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--adm-link)", letterSpacing: "0.06em", marginBottom: "8px" }}>
              AUTHENTICATION POLICIES
            </div>
            {[
              { label: "Password policy", val: `${minPassLen}+ characters` },
              { label: "MFA / OTP settings", val: mfaRequired ? "Required for login" : "Optional", accent: mfaRequired },
              { label: "Account lockout", val: `${settings?.max_failed_attempts || 5} failed attempts` },
            ].map((row) => (
              <div
                key={row.label}
                onClick={() => onNavigate("settings")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid var(--adm-border-soft)",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "var(--adm-body)" }}>{row.label}</span>
                <span style={{ color: row.accent ? "var(--adm-link)" : "var(--adm-text-2)", fontWeight: row.accent ? 600 : 400 }}>
                  {row.val} ›
                </span>
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--adm-link)", letterSpacing: "0.06em", marginBottom: "8px" }}>
              SESSIONS &amp; NOTIFICATIONS
            </div>
            {[
              {
                label: "Session timeout",
                val: `${Math.round((Number(settings?.session_timeout) || 3600) / 60)} minutes`,
              },
              {
                label: "Security notifications",
                val: mailerConfigured ? `${mailProvider} active` : "In-app alerts",
              },
              { label: "Access restrictions", val: "Strict RBAC" },
            ].map((row) => (
              <div
                key={row.label}
                onClick={() => onNavigate("settings")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid var(--adm-border-soft)",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "var(--adm-body)" }}>{row.label}</span>
                <span style={{ color: "var(--adm-text-2)" }}>{row.val} ›</span>
              </div>
            ))}
          </div>

          {/* Column 3 */}
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--adm-link)", letterSpacing: "0.06em", marginBottom: "8px" }}>
              ORGANIZATION &amp; ACCOUNT
            </div>
            {[
              { label: "Organization information", val: settings?.app_name || "VaultAuth SSO" },
              {
                label: "Admin account settings",
                val: adminUser?.full_name || adminUser?.username || "Administrator",
              },
              { label: "Account role", val: adminUser?.role_title || "Enterprise Admin" },
            ].map((row) => (
              <div
                key={row.label}
                onClick={() => onNavigate("settings")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid var(--adm-border-soft)",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "var(--adm-body)" }}>{row.label}</span>
                <span style={{ color: "var(--adm-text-2)" }}>{row.val} ›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "11.5px",
          color: "var(--adm-muted)",
          paddingTop: "4px",
        }}
      >
        <span>✓ All data encrypted in transit and at rest</span>
        <span>Live workspace telemetry · VaultAuth SSO</span>
      </div>
    </div>
  );
}
