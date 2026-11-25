import React from "react";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
} from "lucide-react";

export default function AdminLoginActivity({
  activities = [],
  total = 0,
  page = 1,
  totalPages = 1,
  search = "",
  statusFilter = "all",
  dateFrom = "",
  dateTo = "",
  onSearchChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onRefresh,
  loading,
}) {
  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
            Login activity
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
            Successful authentication events and failed credential challenge attempts.
          </p>
        </div>

        <button onClick={onRefresh} className="btn btn--ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 13px", height: "36px", fontSize: "12.5px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh feed</span>
        </button>
      </div>

      <div className="card" style={{ borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "190px" }}>
            <Search size={15} color="var(--adm-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search username or email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: "100%", height: "36px", paddingLeft: "36px", paddingRight: "12px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", background: "var(--adm-input)", fontSize: "13px", color: "var(--adm-text)" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="var(--adm-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={{ height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", fontSize: "12.5px", backgroundColor: "var(--adm-input)", color: "var(--adm-text)", cursor: "pointer" }}
            >
              <option value="all">All outcomes</option>
              <option value="success">Success only</option>
              <option value="failed">Failed only</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} color="var(--adm-muted)" />
            <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} style={{ height: "36px", padding: "0 8px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", fontSize: "12px", backgroundColor: "var(--adm-input)", color: "var(--adm-text)" }} />
            <span style={{ color: "var(--adm-muted)", fontSize: "12px" }}>to</span>
            <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} style={{ height: "36px", padding: "0 8px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", fontSize: "12px", backgroundColor: "var(--adm-input)", color: "var(--adm-text)" }} />
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
          Showing <strong style={{ color: "var(--adm-text)" }}>{activities.length}</strong> of <strong style={{ color: "var(--adm-text)" }}>{total}</strong> entries
        </div>
      </div>

      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--adm-table-head-bg)", borderBottom: "1px solid var(--adm-border)", color: "var(--adm-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>User</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Device &amp; Browser</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>IP address</th>
                <th style={{ padding: "11px 16px", fontWeight: 600, textAlign: "right" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "var(--adm-muted)" }}>Loading activity...</td></tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "44px 16px", color: "var(--adm-muted)" }}>
                    <Activity size={30} style={{ margin: "0 auto 8px", color: "var(--adm-muted)" }} />
                    <p style={{ margin: 0 }}>No login activity matches the filter.</p>
                  </td>
                </tr>
              ) : (
                activities.map((item) => {
                  const isSuccess = (item.status || "").toLowerCase() === "success";
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--adm-border-soft)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.username}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>{item.email} · UID #{item.uid}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, background: isSuccess ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", border: `1px solid ${isSuccess ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`, color: isSuccess ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                          {isSuccess ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--adm-body)", fontWeight: 500 }}>{item.device_name || "Desktop"}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>{item.browser} · {item.os}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--adm-body)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <Globe size={12} color="var(--adm-muted)" /> {item.location || "Local"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "var(--adm-text-2)", fontSize: "12px" }}>{item.ip_address}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--adm-text-2)", fontSize: "12px" }}>{item.created_at}</td>
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
