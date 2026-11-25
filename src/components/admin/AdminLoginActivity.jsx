import React, { useMemo, useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Globe,
} from "lucide-react";
import { groupByUidAndTime, tallyField, toggleKeyInSet } from "./activityGroupUtils.js";

export default function AdminLoginActivity({
  activities = [],
  total = 0,
  rawTotal = 0,
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
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  const groupedActivities = useMemo(
    () =>
      groupByUidAndTime(activities, {
        getUid: (a) => a.uid,
        getTimeKey: (a) => a.time_bucket || a.created_at,
        toChildEvent: (ev, parent) => ({
          id: ev.id,
          uid: ev.uid ?? parent.uid,
          username: ev.username || parent.username,
          full_name: ev.full_name || parent.full_name,
          email: ev.email || parent.email,
          device_name: ev.device_name || "Desktop",
          device_type: ev.device_type || "desktop",
          browser: ev.browser || "—",
          os: ev.os || "—",
          location: ev.location || "Local",
          ip_address: ev.ip_address || "—",
          status: ev.status || "Unknown",
          created_at: ev.created_at || parent.created_at,
          created_at_exact: ev.created_at_exact || ev.created_at || parent.created_at,
        }),
        buildGroup: (lead, events, groupKey, timeKey) => {
          const statusCounts = tallyField(events, (e) => e.status || "Unknown");
          const hasFailure = Object.keys(statusCounts).some((s) => s.toLowerCase() !== "success");
          const distinctDevices = [...new Set(events.map((e) => e.device_name || "Desktop"))];
          const distinctIps = [...new Set(events.map((e) => e.ip_address).filter(Boolean))];
          return {
            ...lead,
            group_key: lead.group_key || groupKey,
            time_bucket: lead.time_bucket || timeKey,
            created_at: lead.time_bucket || timeKey || lead.created_at,
            event_count: events.length,
            status_counts: lead.status_counts || statusCounts,
            has_failure: typeof lead.has_failure === "boolean" ? lead.has_failure : hasFailure,
            distinct_devices: distinctDevices,
            distinct_ips: distinctIps,
            events,
          };
        },
      }),
    [activities]
  );

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
            Login activity
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
            Authentication attempts grouped by user UID and timestamp. Click any multi-event row to expand details.
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
          Showing <strong style={{ color: "var(--adm-text)" }}>{groupedActivities.length}</strong> of{" "}
          <strong style={{ color: "var(--adm-text)" }}>{total || groupedActivities.length}</strong> grouped entries
          {rawTotal > (total || groupedActivities.length) ? (
            <span style={{ color: "var(--adm-muted)" }}> ({rawTotal} total events)</span>
          ) : null}
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
              ) : groupedActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "44px 16px", color: "var(--adm-muted)" }}>
                    <Activity size={30} style={{ margin: "0 auto 8px", color: "var(--adm-muted)" }} />
                    <p style={{ margin: 0 }}>No login activity matches the filter.</p>
                  </td>
                </tr>
              ) : (
                groupedActivities.map((item) => {
                  const isGroup = item.event_count > 1;
                  const isExpanded = isGroup && expandedKeys.has(item.group_key);
                  const isSuccess = !item.has_failure && (item.status || "").toLowerCase() === "success";
                  const statusEntries = Object.entries(item.status_counts || {});
                  return (
                    <React.Fragment key={item.group_key}>
                      <tr
                        onClick={isGroup ? () => setExpandedKeys((prev) => toggleKeyInSet(prev, item.group_key)) : undefined}
                        style={{
                          borderBottom: "1px solid var(--adm-border-soft)",
                          cursor: isGroup ? "pointer" : "default",
                          background: isExpanded ? "var(--adm-table-head-bg)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isGroup ? (
                              <span
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px",
                                  background: "var(--adm-accent-soft)",
                                  color: "var(--adm-link)",
                                  flexShrink: 0,
                                }}
                                title={isExpanded ? "Collapse grouped attempts" : "Expand grouped attempts"}
                              >
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </span>
                            ) : null}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>
                                  {item.full_name || item.username}
                                </span>
                                {isGroup ? (
                                  <span
                                    style={{
                                      padding: "1px 7px",
                                      borderRadius: "999px",
                                      fontSize: "10.5px",
                                      fontWeight: 700,
                                      background: "var(--adm-accent-soft)",
                                      color: "var(--adm-link)",
                                      border: "1px solid var(--adm-accent-border)",
                                    }}
                                  >
                                    ×{item.event_count}
                                  </span>
                                ) : null}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>
                                {item.email} · UID #{item.uid}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, background: isSuccess ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", border: `1px solid ${isSuccess ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`, color: isSuccess ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                            {isSuccess ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {item.status}
                          </span>
                          {isGroup && statusEntries.length > 1 ? (
                            <div style={{ fontSize: "11px", color: "var(--adm-muted)", marginTop: "3px" }}>
                              {statusEntries.map(([st, cnt]) => `${cnt} ${st}`).join(" · ")}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: "var(--adm-body)", fontWeight: 500 }}>
                            {item.device_name || "Desktop"}
                            {item.distinct_devices?.length > 1 ? (
                              <span style={{ color: "var(--adm-muted)", fontSize: "11px" }}> (+{item.distinct_devices.length - 1} more)</span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--adm-muted)" }}>{item.browser} · {item.os}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--adm-body)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Globe size={12} color="var(--adm-muted)" /> {item.location || "Local"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "var(--adm-text-2)", fontSize: "12px" }}>
                          {item.ip_address}
                          {item.distinct_ips?.length > 1 ? (
                            <span style={{ color: "var(--adm-muted)", fontSize: "11px", fontFamily: "sans-serif" }}> (+{item.distinct_ips.length - 1})</span>
                          ) : null}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--adm-text-2)", fontSize: "12px" }}>
                          <div>{item.created_at}</div>
                          {isGroup ? (
                            <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                              {item.event_count} events in minute
                            </div>
                          ) : null}
                        </td>
                      </tr>

                      {isExpanded &&
                        item.events.map((ev, idx) => {
                          const evOk = (ev.status || "").toLowerCase() === "success";
                          return (
                            <tr
                              key={`${item.group_key}-ev-${ev.id ?? idx}`}
                              style={{
                                borderBottom: "1px solid var(--adm-border-soft)",
                                background: "var(--adm-surface)",
                                fontSize: "12px",
                              }}
                            >
                              <td style={{ padding: "8px 16px 8px 42px", color: "var(--adm-muted)" }}>
                                <span style={{ borderLeft: "2px solid var(--adm-border-strong)", paddingLeft: "10px" }}>
                                  Event #{ev.id ?? idx + 1}
                                </span>
                              </td>
                              <td style={{ padding: "8px 16px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "1px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: evOk ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", border: `1px solid ${evOk ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`, color: evOk ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                                  {evOk ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                  {ev.status}
                                </span>
                              </td>
                              <td style={{ padding: "8px 16px", color: "var(--adm-text-2)" }}>
                                {ev.device_name} · {ev.browser} · {ev.os}
                              </td>
                              <td style={{ padding: "8px 16px", color: "var(--adm-text-2)" }}>{ev.location}</td>
                              <td style={{ padding: "8px 16px", fontFamily: "monospace", color: "var(--adm-text-2)" }}>{ev.ip_address}</td>
                              <td style={{ padding: "8px 16px", textAlign: "right", color: "var(--adm-muted)" }}>
                                {ev.created_at_exact || ev.created_at}
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
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
