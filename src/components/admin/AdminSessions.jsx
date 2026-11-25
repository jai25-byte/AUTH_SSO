import React, { useState } from "react";
import {
  Monitor,
  Search,
  Filter,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Laptop,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function AdminSessions({
  sessions = [],
  total = 0,
  page = 1,
  totalPages = 1,
  search = "",
  statusFilter = "all",
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRevokeSession,
  onRevokeAllUserSessions,
  onRefresh,
  loading,
}) {
  const [selectedUserForRevokeAll, setSelectedUserForRevokeAll] = useState(null);

  const getDeviceIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "mobile":
        return <Smartphone size={15} color="var(--adm-text-2)" />;
      case "laptop":
        return <Laptop size={15} color="var(--adm-link)" />;
      default:
        return <Monitor size={15} color="var(--adm-text-2)" />;
    }
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
              Active sessions
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "var(--adm-ok-bg)",
                border: "1px solid var(--adm-ok-border)",
                color: "var(--adm-ok-text)",
              }}
            >
              ● Real-time
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
            Inspect real-time authenticated user sessions, last activity, and revoke access tokens immediately.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn--ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 13px",
            height: "36px",
            fontSize: "12.5px",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh sessions</span>
        </button>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} color="var(--adm-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by user, email, or device..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                height: "36px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "8px",
                border: "1px solid var(--adm-border-strong)",
                background: "var(--adm-input)",
                fontSize: "13px",
                color: "var(--adm-text)",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="var(--adm-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={{
                height: "36px",
                padding: "0 10px",
                borderRadius: "8px",
                border: "1px solid var(--adm-border-strong)",
                fontSize: "12.5px",
                backgroundColor: "var(--adm-input)",
                color: "var(--adm-text)",
                cursor: "pointer",
              }}
            >
              <option value="all">All session states</option>
              <option value="active">Active only</option>
              <option value="revoked">Revoked / Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
          Showing <strong style={{ color: "var(--adm-text)" }}>{sessions.length}</strong> of{" "}
          <strong style={{ color: "var(--adm-text)" }}>{total}</strong> sessions
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--adm-table-head-bg)", borderBottom: "1px solid var(--adm-border)", color: "var(--adm-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>User</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Device &amp; OS</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Browser &amp; IP</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Last active</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "11px 16px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px", color: "var(--adm-muted)" }}>
                    Loading sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "44px 16px", color: "var(--adm-muted)" }}>
                    <Monitor size={30} style={{ margin: "0 auto 8px", color: "var(--adm-muted-2)" }} />
                    <p style={{ margin: 0 }}>No sessions found.</p>
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.is_active;
                  const isCur = Boolean(sess.is_current);
                  return (
                    <tr key={sess.id || sess.session_id} style={{ borderBottom: "1px solid var(--adm-border-soft)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--adm-text)" }}>
                          {sess.full_name || sess.username}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
                          {sess.email}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, color: "var(--adm-text)" }}>
                          {getDeviceIcon(sess.device_type)}
                          <span>{sess.device_name || "Web Client"}</span>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)", marginLeft: "23px" }}>{sess.os || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--adm-text)" }}>{sess.browser || "Browser"}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)", fontFamily: "monospace" }}>{sess.ip_address || "127.0.0.1"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--adm-text-2)", fontSize: "12px" }}>{sess.created_at}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                        <div style={{ fontWeight: sess.last_activity_relative === "Active now" ? 600 : 400, color: sess.last_activity_relative === "Active now" ? "var(--adm-ok-text)" : "var(--adm-text-2)" }}>
                          {sess.last_activity_relative || sess.last_activity}
                        </div>
                        {sess.last_activity_relative && sess.last_activity && sess.last_activity_relative !== sess.last_activity && (
                          <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>{sess.last_activity}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {(() => {
                          const statusStr = (sess.status || (isActive ? "Active" : "Revoked")).toLowerCase();
                          const isAct = isActive || statusStr === "active" || statusStr === "current";
                          const isRev = statusStr === "revoked";
                          const isExp = statusStr === "expired";

                          let bg = "var(--adm-badge-neutral-bg)";
                          let border = "var(--adm-badge-neutral-border)";
                          let color = "var(--adm-badge-neutral-text)";
                          let Icon = Clock;

                          if (isAct) {
                            bg = "var(--adm-ok-bg)";
                            border = "var(--adm-ok-border)";
                            color = "var(--adm-ok-text)";
                            Icon = CheckCircle2;
                          } else if (isRev) {
                            bg = "var(--adm-danger-soft)";
                            border = "var(--adm-danger-border)";
                            color = "var(--adm-danger-text)";
                            Icon = XCircle;
                          }

                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 9px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                background: bg,
                                border: `1px solid ${border}`,
                                color: color,
                              }}
                            >
                              <Icon size={11} />
                              {sess.status || (isAct ? (isCur ? "Current" : "Active") : isExp ? "Expired" : "Revoked")}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {isActive && !isCur && (
                            <button
                              onClick={() => onRevokeSession(sess.session_id)}
                              style={{
                                background: "var(--adm-input)",
                                border: "1px solid var(--adm-danger-border)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--adm-danger-text)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Trash2 size={12} /> Revoke
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedUserForRevokeAll({ uid: sess.uid, username: sess.username })}
                            style={{
                              background: "var(--adm-input)",
                              border: "1px solid var(--adm-border-strong)",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "var(--adm-text-2)",
                              cursor: "pointer",
                            }}
                          >
                            Revoke all
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--adm-border-soft)", background: "var(--adm-table-foot-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
            Page <strong style={{ color: "var(--adm-text)" }}>{page}</strong> of <strong style={{ color: "var(--adm-text)" }}>{totalPages || 1}</strong>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn--ghost" style={{ height: "30px", padding: "0 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <ChevronLeft size={13} /> Previous
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn--ghost" style={{ height: "30px", padding: "0 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {selectedUserForRevokeAll && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "var(--adm-backdrop)", display: "grid", placeItems: "center", zIndex: 100, padding: "16px" }} onClick={() => setSelectedUserForRevokeAll(null)}>
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "24px", borderRadius: "12px", border: "1px solid var(--adm-border-strong)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--adm-danger-soft)", color: "var(--adm-danger-text)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
              <AlertOctagon size={22} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--adm-text)" }}>Revoke all sessions?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--adm-text-2)", lineHeight: 1.5 }}>
              Sign out <strong style={{ color: "var(--adm-text)" }}>"{selectedUserForRevokeAll.username}"</strong> (UID #{selectedUserForRevokeAll.uid}) across all active devices?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn--ghost" onClick={() => setSelectedUserForRevokeAll(null)} style={{ flex: 1, height: "38px", cursor: "pointer" }}>Cancel</button>
              <button
                className="btn"
                onClick={() => {
                  const uid = selectedUserForRevokeAll.uid;
                  setSelectedUserForRevokeAll(null);
                  onRevokeAllUserSessions(uid);
                }}
                style={{ flex: 1, height: "38px", background: "#dc2626", borderColor: "#dc2626", color: "#ffffff", cursor: "pointer" }}
              >
                Revoke all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
