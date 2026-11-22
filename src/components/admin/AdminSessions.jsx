import React, { useState } from "react";
import {
  Monitor,
  Search,
  Filter,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
        return <Smartphone size={16} color="#0284c7" />;
      case "laptop":
        return <Laptop size={16} color="#7047eb" />;
      default:
        return <Monitor size={16} color="#475569" />;
    }
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            Active Session Management
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
            Real-time inspection of valid token sessions, client device fingerprinting, and immediate cryptographic revocation.
          </p>
        </div>

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
          <span>Refresh Sessions</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px", flexWrap: "wrap" }}>
          {/* Search bar */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              color="#9ca3af"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by user, email, or device name..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.88rem",
                color: "#111827",
                outline: "none",
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="#6b7280" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.86rem",
                backgroundColor: "#fff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <option value="all">All Session States</option>
              <option value="active">Active Only</option>
              <option value="revoked">Revoked / Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
          Displaying <strong>{sessions.length}</strong> of <strong>{total}</strong> session records
        </div>
      </div>

      {/* Sessions Table */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Employee</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Device &amp; OS</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Browser &amp; IP</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Session Created</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Last Telemetry</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>State</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Revocation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px", color: "#9ca3af" }}>
                    Loading active sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                    <Monitor size={32} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
                    <p style={{ margin: 0 }}>No sessions found.</p>
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.is_active;

                  return (
                    <tr
                      key={sess.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fcfdfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {sess.username}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                          {sess.email} • UID #{sess.uid}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, color: "#334155" }}>
                          {getDeviceIcon(sess.device_type)}
                          <span>{sess.device_name}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "24px" }}>
                          {sess.os}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#334155" }}>{sess.browser}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                          {sess.ip_address}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem" }}>
                        {sess.created_at}
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem" }}>
                        {sess.last_activity}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: isActive ? "#ecfdf5" : "#f1f5f9",
                            color: isActive ? "#15803d" : "#64748b",
                            border: `1px solid ${isActive ? "#bbf7d0" : "#e2e8f0"}`,
                          }}
                        >
                          {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {sess.status || (isActive ? "Active" : "Revoked")}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {isActive && (
                            <button
                              onClick={() => onRevokeSession(sess.session_id)}
                              title="Revoke This Session"
                              style={{
                                background: "#fff",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#dc2626",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Revoke</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedUserForRevokeAll({ uid: sess.uid, username: sess.username })}
                            title="Revoke ALL sessions for this user"
                            style={{
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "0.78rem",
                              fontWeight: 500,
                              color: "#64748b",
                              cursor: "pointer",
                            }}
                          >
                            Revoke All for User
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

        {/* Pagination */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e5e7eb",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn btn--ghost"
              style={{ height: "32px", padding: "0 10px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn btn--ghost"
              style={{ height: "32px", padding: "0 10px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Revoke All Dialog */}
      {selectedUserForRevokeAll && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setSelectedUserForRevokeAll(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "440px", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                }}
              >
                <AlertOctagon size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>
                Revoke All Active Sessions?
              </h3>
              <p style={{ margin: "8px 0 0", fontSize: "0.86rem", color: "#64748b" }}>
                Are you sure you want to invalidate all active device sessions for <strong>"{selectedUserForRevokeAll.username}"</strong> (UID #{selectedUserForRevokeAll.uid})?
                The employee will be immediately signed out on all web browsers and devices.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setSelectedUserForRevokeAll(null)}
                style={{ flex: 1, height: "40px" }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  const uid = selectedUserForRevokeAll.uid;
                  setSelectedUserForRevokeAll(null);
                  onRevokeAllUserSessions(uid);
                }}
                style={{
                  flex: 1,
                  height: "40px",
                  background: "#dc2626",
                  color: "#fff",
                }}
              >
                Revoke All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
