import React, { useMemo, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { groupByUidAndTime, tallyField, toggleKeyInSet } from "./activityGroupUtils.js";

export default function AdminAuditLogs({
  logs = [],
  total = 0,
  rawTotal = 0,
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
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  const getEventBadgeStyle = (eventType = "") => {
    const ev = eventType.toUpperCase();
    if (ev.includes("DELETE") || ev.includes("REVOKE") || ev.includes("BLOCKED") || ev.includes("FAILED") || ev.includes("DISABLED")) {
      return { bg: "var(--adm-danger-bg)", color: "var(--adm-danger-text)", border: "var(--adm-danger-border)" };
    }
    if (ev.includes("CREATE") || ev.includes("SUCCESS") || ev.includes("ACTIVATE") || ev.includes("ENABLED")) {
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

  const groupedLogs = useMemo(
    () =>
      groupByUidAndTime(logs, {
        getUid: (l) => l.actor_uid ?? l.target_uid ?? l.uid ?? null,
        getTimeKey: (l) => l.time_bucket || l.created_at,
        toChildEvent: (ev, parent) => ({
          id: ev.id,
          uid: ev.uid ?? ev.actor_uid ?? ev.target_uid ?? parent.uid ?? null,
          event_type: ev.event_type || parent.event_type,
          actor_uid: ev.actor_uid ?? parent.actor_uid ?? null,
          actor_username: ev.actor_username || parent.actor_username || "System",
          full_name: ev.full_name || parent.full_name || ev.actor_username || "System",
          target_uid: ev.target_uid ?? null,
          target_username: ev.target_username || "—",
          ip_address: ev.ip_address || parent.ip_address || "—",
          status: ev.status || "Success",
          details: ev.details || "",
          created_at: ev.created_at || parent.created_at,
          created_at_exact: ev.created_at_exact || ev.created_at || parent.created_at,
        }),
        buildGroup: (lead, events, groupKey, timeKey) => {
          const evCounts = tallyField(events, (e) => e.event_type);
          const eventTypes = Object.entries(evCounts)
            .map(([event_type, count]) => ({ event_type, count }))
            .sort((a, b) => b.count - a.count);
          const statusCounts = tallyField(events, (e) => e.status || "Success");
          const hasFailure = Object.keys(statusCounts).some((s) => s.toLowerCase() !== "success");
          const uid = lead.actor_uid ?? lead.target_uid ?? lead.uid ?? null;
          const actorName =
            events.find((e) => e.actor_username && e.actor_username !== "System")?.actor_username ||
            lead.actor_username ||
            "System";
          return {
            ...lead,
            uid,
            actor_username: actorName,
            group_key: lead.group_key || groupKey,
            time_bucket: lead.time_bucket || timeKey,
            created_at: lead.time_bucket || timeKey || lead.created_at,
            event_count: events.length,
            event_types: Array.isArray(lead.event_types) && lead.event_types.length > 0 ? lead.event_types : eventTypes,
            status_counts: lead.status_counts || statusCounts,
            has_failure: typeof lead.has_failure === "boolean" ? lead.has_failure : hasFailure,
            events,
          };
        },
      }),
    [logs]
  );

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
            Security &amp; audit logs
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
            Administrative provenance ledger grouped by user UID and timestamp. Click any grouped row to inspect individual events.
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
              <option value="SETTINGS">System settings</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
          Showing <strong style={{ color: "var(--adm-text)" }}>{groupedLogs.length}</strong> of{" "}
          <strong style={{ color: "var(--adm-text)" }}>{total || groupedLogs.length}</strong> grouped records
          {rawTotal > (total || groupedLogs.length) ? (
            <span style={{ color: "var(--adm-muted)" }}> ({rawTotal} total events)</span>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--adm-table-head-bg)", borderBottom: "1px solid var(--adm-border)", color: "var(--adm-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "11px 14px", fontWeight: 600 }}>ID / Group</th>
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
              ) : groupedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "44px 16px", color: "var(--adm-muted)" }}>
                    <FileText size={30} style={{ margin: "0 auto 8px", color: "var(--adm-muted)" }} />
                    <p style={{ margin: 0 }}>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                groupedLogs.map((log) => {
                  const isGroup = log.event_count > 1;
                  const isExpanded = isGroup && expandedKeys.has(log.group_key);
                  const visibleTypes = log.event_types.slice(0, 2);
                  const remainingTypes = Math.max(0, log.event_types.length - 2);
                  const statusOk = !log.has_failure && log.status === "Success";
                  const distinctTargets = [
                    ...new Set(
                      log.events
                        .map((e) => (e.target_username && e.target_username !== "—" ? e.target_username : e.target_uid ? `UID #${e.target_uid}` : null))
                        .filter(Boolean)
                    ),
                  ];
                  return (
                    <React.Fragment key={log.group_key}>
                      <tr
                        onClick={isGroup ? () => setExpandedKeys((prev) => toggleKeyInSet(prev, log.group_key)) : undefined}
                        style={{
                          borderBottom: "1px solid var(--adm-border-soft)",
                          cursor: isGroup ? "pointer" : "default",
                          background: isExpanded ? "var(--adm-table-head-bg)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "var(--adm-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
                                }}
                                title={isExpanded ? "Collapse group" : "Expand grouped events"}
                              >
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </span>
                            ) : null}
                            <span>#{log.id}</span>
                            {isGroup ? (
                              <span
                                style={{
                                  padding: "1px 6px",
                                  borderRadius: "999px",
                                  fontSize: "10.5px",
                                  fontFamily: "sans-serif",
                                  fontWeight: 700,
                                  background: "var(--adm-accent-soft)",
                                  color: "var(--adm-link)",
                                  border: "1px solid var(--adm-accent-border)",
                                }}
                              >
                                ×{log.event_count}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                            {visibleTypes.map(({ event_type: et, count }) => {
                              const badge = getEventBadgeStyle(et);
                              return (
                                <span
                                  key={et}
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 7px",
                                    borderRadius: "5px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "monospace",
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`,
                                  }}
                                >
                                  {et}
                                  {count > 1 ? ` ×${count}` : ""}
                                </span>
                              );
                            })}
                            {remainingTypes > 0 ? (
                              <span style={{ fontSize: "11px", color: "var(--adm-muted)", fontWeight: 600 }}>
                                +{remainingTypes} more
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontWeight: 600, color: "var(--adm-text)" }}>{log.actor_username || "System"}</div>
                          {log.uid != null ? (
                            <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>UID #{log.uid}</div>
                          ) : null}
                        </td>
                        <td style={{ padding: "11px 14px", color: "var(--adm-body)" }}>
                          {distinctTargets.length > 0
                            ? distinctTargets.length === 1
                              ? distinctTargets[0]
                              : `${distinctTargets[0]} (+${distinctTargets.length - 1})`
                            : "—"}
                        </td>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "var(--adm-text-2)", fontSize: "12px" }}>{log.ip_address}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: statusOk ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", color: statusOk ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                            {log.has_failure ? "Attention" : log.status}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", color: "var(--adm-text-2)", fontSize: "12px", whiteSpace: "nowrap" }}>{log.created_at}</td>
                        <td style={{ padding: "11px 14px", color: "var(--adm-text-2)", fontSize: "12px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={isGroup ? `${log.event_count} events in this minute` : log.details}>
                          {isGroup ? `${log.event_count} grouped events · Click to expand` : log.details || "—"}
                        </td>
                      </tr>

                      {isExpanded &&
                        log.events.map((ev, idx) => {
                          const evBadge = getEventBadgeStyle(ev.event_type);
                          const evOk = ev.status === "Success";
                          return (
                            <tr
                              key={`${log.group_key}-ev-${ev.id ?? idx}`}
                              style={{
                                borderBottom: "1px solid var(--adm-border-soft)",
                                background: "var(--adm-surface)",
                                fontSize: "12px",
                              }}
                            >
                              <td style={{ padding: "8px 14px 8px 34px", fontFamily: "monospace", color: "var(--adm-muted)" }}>
                                <span style={{ borderLeft: "2px solid var(--adm-border-strong)", paddingLeft: "8px" }}>
                                  #{ev.id ?? idx + 1}
                                </span>
                              </td>
                              <td style={{ padding: "8px 14px" }}>
                                <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, fontFamily: "monospace", background: evBadge.bg, color: evBadge.color, border: `1px solid ${evBadge.border}` }}>
                                  {ev.event_type}
                                </span>
                              </td>
                              <td style={{ padding: "8px 14px", color: "var(--adm-text-2)" }}>{ev.actor_username || "System"}</td>
                              <td style={{ padding: "8px 14px", color: "var(--adm-text-2)" }}>
                                {ev.target_username && ev.target_username !== "—" ? ev.target_username : ev.target_uid ? `UID #${ev.target_uid}` : "—"}
                              </td>
                              <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "var(--adm-text-2)" }}>{ev.ip_address}</td>
                              <td style={{ padding: "8px 14px" }}>
                                <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 600, background: evOk ? "var(--adm-ok-bg)" : "var(--adm-danger-bg)", color: evOk ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                                  {ev.status}
                                </span>
                              </td>
                              <td style={{ padding: "8px 14px", color: "var(--adm-muted)", whiteSpace: "nowrap" }}>
                                {ev.created_at_exact || ev.created_at}
                              </td>
                              <td style={{ padding: "8px 14px", color: "var(--adm-text-2)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ev.details}>
                                {ev.details || "—"}
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
