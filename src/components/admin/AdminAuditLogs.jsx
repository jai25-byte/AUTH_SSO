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
    if (ev.includes("WEBAUTHN") || ev.includes("PASSKEY")) {
      return { bg: "var(--adm-ok-bg)", color: "var(--adm-ok-text)", border: "var(--adm-ok-border)" };
    }
    if (ev.includes("DELETE") || ev.includes("REVOKE") || ev.includes("BLOCKED")) {
      return { bg: "var(--adm-danger-bg)", color: "var(--adm-danger-text)", border: "var(--adm-danger-border)" };
    }
    if (ev.includes("CREATE") || ev.includes("SUCCESS") || ev.includes("ACTIVATE")) {
      return { bg: "var(--adm-ok-bg)", color: "var(--adm-ok-text)", border: "var(--adm-ok-border)" };
    }
    if (ev.includes("ROLE") || ev.includes("PERMISSION")) {
      return { bg: "var(--adm-accent-soft)", color: "var(--adm-link)", border: "var(--adm-accent-border)" };
    }
    return {
      bg: "var(--adm-badge-neutral-bg)",
      color: "var(--adm-badge-neutral-text)",
      border: "var(--adm-badge-neutral-border)",
    };
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
            Security &amp; audit logs
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
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
            <Search size={15} color="var(--adm-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search actor, target user, or event..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: "100%", height: "36px", paddingLeft: "36px", paddingRight: "12px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", fontSize: "13px", color: "var(--adm-text)" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="var(--adm-muted)" />
            <select
              value={eventFilter}
              onChange={(e) => onEventFilterChange(e.target.value)}
              style={{ height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", fontSize: "12.5px", backgroundColor: "var(--adm-input)", color: "var(--adm-text)", cursor: "pointer" }}
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

        <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
          Showing <strong style={{ color: "var(--adm-text)" }}>{logs.length}</strong> of <strong style={{ color: "var(--adm-text)" }}>{total}</strong> records
        </div>
      </div>

      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--adm-table-head-bg)", borderBottom: "1px solid var(--adm-border)", color: "var(--adm-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "36px 16px", color: "var(--adm-muted)" }}>Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "44px 16px", color: "var(--adm-muted)" }}>
                    <FileText size={30} style={{ margin: "0 auto 8px", color: "var(--adm-muted)" }} />
                    <p style={{ margin: 0 }}>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getEventBadgeStyle(log.event_type);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--adm-border-soft)" }}>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "var(--adm-muted)", fontWeight: 600 }}>#{log.id}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {log.event_type}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "var(--adm-text)" }}>{log.actor_username || "System"}</td>
                      <td style={{ padding: "11px 14px", color: "var(--adm-body)" }}>{log.target_username || (log.target_uid ? `UID #${log.target_uid}` : "—")}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "var(--adm-text-2)", fontSize: "12px" }}>{log.ip_address}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: log.status === "Success" ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", color: log.status === "Success" ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: "var(--adm-text-2)", fontSize: "12px", whiteSpace: "nowrap" }}>{log.created_at}</td>
                      <td style={{ padding: "11px 14px", color: "var(--adm-text-2)", fontSize: "12px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.details}>
                        {log.details || "—"}
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
    </div>
  );
}
