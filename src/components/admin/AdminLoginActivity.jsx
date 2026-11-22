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
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            Login Activity Monitoring
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
            Real-time feed of successful authentication and failed credential challenge events across all users.
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
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Toolbar */}
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
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px", flexWrap: "wrap", alignItems: "center" }}>
          {/* User search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={16}
              color="#9ca3af"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by username or email..."
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
              <option value="all">All Outcomes</option>
              <option value="success">Success Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          {/* Date from */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={15} color="#6b7280" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              title="From date"
              style={{
                height: "38px",
                padding: "0 10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.84rem",
                backgroundColor: "#fff",
                color: "#374151",
              }}
            />
            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              title="To date"
              style={{
                height: "38px",
                padding: "0 10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.84rem",
                backgroundColor: "#fff",
                color: "#374151",
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
          Showing <strong>{activities.length}</strong> of <strong>{total}</strong> log entries
        </div>
      </div>

      {/* Table */}
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
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Device &amp; Browser</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>IP Address</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                    Loading telemetry feed...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                    <Activity size={32} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
                    <p style={{ margin: 0 }}>No login activity matches the active filter.</p>
                  </td>
                </tr>
              ) : (
                activities.map((item) => {
                  const isSuccess = (item.status || "").toLowerCase() === "success";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fcfdfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {item.username}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                          {item.email} • UID #{item.uid}
                        </div>
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
                            backgroundColor: isSuccess ? "#ecfdf5" : "#fef2f2",
                            color: isSuccess ? "#15803d" : "#b91c1c",
                            border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#334155", fontWeight: 500 }}>
                          {item.device_name || "Desktop"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {item.browser} • {item.os}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Globe size={13} color="#94a3b8" />
                          <span>{item.location || "Bengaluru, India"}</span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748b", fontFamily: "monospace", fontSize: "0.82rem" }}>
                        {item.ip_address}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#64748b", fontSize: "0.82rem" }}>
                        {item.created_at}
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
