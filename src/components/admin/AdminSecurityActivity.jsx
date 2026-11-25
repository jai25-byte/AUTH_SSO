import React, { useState, useEffect } from "react";
import { Activity, FileText } from "lucide-react";
import AdminLoginActivity from "./AdminLoginActivity.jsx";
import AdminAuditLogs from "./AdminAuditLogs.jsx";

export default function AdminSecurityActivity({
  initialTab = "logins",
  activities = [],
  activityTotal = 0,
  activityRawTotal = 0,
  activityPage = 1,
  activityTotalPages = 1,
  activitySearch = "",
  activityStatusFilter = "all",
  dateFrom = "",
  dateTo = "",
  onActivitySearchChange,
  onActivityStatusChange,
  onDateFromChange,
  onDateToChange,
  onActivityPageChange,
  logs = [],
  auditTotal = 0,
  auditRawTotal = 0,
  auditPage = 1,
  auditTotalPages = 1,
  auditSearch = "",
  eventFilter = "all",
  onAuditSearchChange,
  onEventFilterChange,
  onAuditPageChange,
  onRefresh,
  loading,
}) {
  const [subTab, setSubTab] = useState(initialTab);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div
        style={{
          display: "inline-flex",
          gap: "4px",
          padding: "4px",
          borderRadius: "10px",
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          justifySelf: "start",
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab("logins")}
          style={{
            height: "34px",
            padding: "0 14px",
            borderRadius: "7px",
            border: "none",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: subTab === "logins" ? "var(--adm-accent-soft)" : "transparent",
            color: subTab === "logins" ? "var(--adm-link)" : "var(--adm-text-2)",
          }}
        >
          <Activity size={14} />
          <span>Login activity ({activityTotal})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("audit")}
          style={{
            height: "34px",
            padding: "0 14px",
            borderRadius: "7px",
            border: "none",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: subTab === "audit" ? "var(--adm-accent-soft)" : "transparent",
            color: subTab === "audit" ? "var(--adm-link)" : "var(--adm-text-2)",
          }}
        >
          <FileText size={14} />
          <span>Security &amp; audit logs ({auditTotal})</span>
        </button>
      </div>

      {subTab === "logins" ? (
        <AdminLoginActivity
          activities={activities}
          total={activityTotal}
          rawTotal={activityRawTotal}
          page={activityPage}
          totalPages={activityTotalPages}
          search={activitySearch}
          statusFilter={activityStatusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={onActivitySearchChange}
          onStatusFilterChange={onActivityStatusChange}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onPageChange={onActivityPageChange}
          onRefresh={onRefresh}
          loading={loading}
        />
      ) : (
        <AdminAuditLogs
          logs={logs}
          total={auditTotal}
          rawTotal={auditRawTotal}
          page={auditPage}
          totalPages={auditTotalPages}
          search={auditSearch}
          eventFilter={eventFilter}
          onSearchChange={onAuditSearchChange}
          onEventFilterChange={onEventFilterChange}
          onPageChange={onAuditPageChange}
          onRefresh={onRefresh}
          loading={loading}
        />
      )}
    </div>
  );
}
