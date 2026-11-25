import React from "react";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
    if (ev.includes("WEBAUTHN") || ev.includes("PASSKEY")) return { bg: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "rgba(34, 197, 94, 0.3)" };
    if (ev.includes("DELETE") || ev.includes("REVOKE") || ev.includes("BLOCKED")) return { bg: "rgba(239, 68, 68, 0.14)", color: "#f87171", border: "rgba(239, 68, 68, 0.35)" };
    if (ev.includes("CREATE") || ev.includes("SUCCESS") || ev.includes("ACTIVATE")) return { bg: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "rgba(34, 197, 94, 0.3)" };
    if (ev.includes("ROLE") || ev.includes("PERMISSION")) return { bg: "rgba(247, 215, 148, 0.14)", color: "#F7D794", border: "rgba(247, 215, 148, 0.35)" };
    return { bg: "#141414", color: "#d4d4d8", border: "#262626" };
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Security &amp; audit logs
          </h1>
          <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: "13px" }}>
            Administrative provenance ledger tracking user lifecycle, role modifications, and security exceptions.
          </p>
        </div>

        <button onClick={onRefresh} className="btn btn--ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 13px", height: "36px", fontSize: "12.5px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh ledger</span>
        </button>
      </div>

      <div className="card" style={{ borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} color="#71717a" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search actor, target user, or event..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: "100%", height: "36px", paddingLeft: "36px", paddingRight: "12px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", fontSize: "13px", color: "#ffffff" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#71717a" />
            <select
              value={eventFilter}
              onChange={(e) => onEventFilterChange(e.target.value)}
              style={{ height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #262626", fontSize: "12.5px", backgroundColor: "#000000", color: "#e4e4e7", cursor: "pointer" }}
            >
              <option value="all">All events</option>
              <option value="USER">User lifecycle</option>
              <option value="ROLE">Role &amp; permissions</option>
              <option value="SESSION">Session revocation</option>
              <option value="LOGIN">Authentication</option>
              <option value="WEBAUTHN">Passkey / WebAuthn</option>
              <option value="SETTINGS">System settings</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
          Showing <strong style={{ color: "#ffffff" }}>{logs.length}</strong> of <strong style={{ color: "#ffffff" }}>{total}</strong> records
        </div>
      </div>

      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#111111", borderBottom: "1px solid #1f1f1f", color: "#71717a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Event</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Performed by</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Target</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>IP address</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "36px 16px", color: "#71717a" }}>Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "44px 16px", color: "#71717a" }}>
                    <FileText size={30} style={{ margin: "0 auto 8px", color: "#52525b" }} />
                    <p style={{ margin: 0 }}>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getEventBadgeStyle(log.event_type);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #141414" }}>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#71717a", fontWeight: 600 }}>#{log.id}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {log.event_type}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "#ffffff" }}>{log.actor_username || "System"}</td>
                      <td style={{ padding: "11px 14px", color: "#d4d4d8" }}>{log.target_username || (log.target_uid ? `UID #${log.target_uid}` : "—")}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#a1a1aa", fontSize: "12px" }}>{log.ip_address}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: log.status === "Success" ? "rgba(34, 197, 94, 0.14)" : "rgba(239, 68, 68, 0.14)", color: log.status === "Success" ? "#4ade80" : "#f87171" }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#a1a1aa", fontSize: "12px", whiteSpace: "nowrap" }}>{log.created_at}</td>
                      <td style={{ padding: "11px 14px", color: "#a1a1aa", fontSize: "12px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.details}>
                        {log.details || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #171717", background: "#050505", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
            Page <strong style={{ color: "#ffffff" }}>{page}</strong> of <strong style={{ color: "#ffffff" }}>{totalPages || 1}</strong>
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
    </div>
  );
}
