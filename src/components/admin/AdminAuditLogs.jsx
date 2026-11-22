import React from "react";
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

export default function AdminAuditLogs({
  logs = [],
  total = 0,
  page = 1,
  totalPages = 1,
  search = "",
  eventFilter = "all",
  onSearchChange,
  onEventFilterChange,
  onPageChange,
  onRefresh,
  loading,
}) {
  const getEventBadgeStyle = (eventType = "") => {
    const ev = eventType.toUpperCase();
    if (ev.includes("DELETE") || ev.includes("REVOKE") || ev.includes("BLOCKED")) {
      return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    }
    if (ev.includes("CREATE") || ev.includes("SUCCESS") || ev.includes("ACTIVATE")) {
      return { bg: "#ecfdf5", color: "#15803d", border: "#bbf7d0" };
    }
    if (ev.includes("ROLE") || ev.includes("PERMISSION")) {
      return { bg: "#f5f3ff", color: "#7047eb", border: "#ddd6fe" };
    }
    return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            Security &amp; Audit Logs
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
            Immutable administrative provenance ledger tracking lifecycle operations, privilege modifications, and security exceptions.
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
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filters Toolbar */}
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
          {/* Search box */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              color="#9ca3af"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by actor, target user, or action name..."
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

          {/* Event Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="#6b7280" />
            <select
              value={eventFilter}
              onChange={(e) => onEventFilterChange(e.target.value)}
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
              <option value="all">All Events</option>
              <option value="USER">User Lifecycle</option>
              <option value="ROLE">Role &amp; Permissions</option>
              <option value="SESSION">Session Revocation</option>
              <option value="LOGIN">Authentication</option>
              <option value="SETTINGS">System Settings</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
          Displaying <strong>{logs.length}</strong> of <strong>{total}</strong> audit records
        </div>
      </div>

      {/* Audit Logs Table */}
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Event ID</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Action / Event</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Performed By</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Target User</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>IP Address</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Event Context</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                    <FileText size={32} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
                    <p style={{ margin: 0 }}>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getEventBadgeStyle(log.event_type);

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fcfdfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#94a3b8", fontWeight: 600 }}>
                        #{log.id}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {log.event_type}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#111827" }}>
                        {log.actor_username || "System"}
                        {log.actor_uid ? (
                          <span style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 400, marginLeft: "4px" }}>
                            (UID #{log.actor_uid})
                          </span>
                        ) : null}
                      </td>

                      <td style={{ padding: "12px 14px", color: "#475569" }}>
                        {log.target_username || (log.target_uid ? `UID #${log.target_uid}` : "—")}
                      </td>

                      <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#64748b", fontSize: "0.8rem" }}>
                        {log.ip_address}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            backgroundColor: log.status === "Success" ? "#ecfdf5" : "#fef2f2",
                            color: log.status === "Success" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {log.created_at}
                      </td>

                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "0.78rem", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.details}>
                        {log.details || "—"}
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
    </div>
  );
}
