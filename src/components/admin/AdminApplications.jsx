import React, { useState, useMemo } from "react";
import { AppWindow, Search, RefreshCw, ShieldCheck, Trash2, Power, Users, X, ChevronRight } from "lucide-react";

export default function AdminApplications({
  apps = [],
  onRefresh,
  onToggleApp,
  onDisconnectApp,
  loading,
}) {
  const [search, setSearch] = useState("");
  const [confirmApp, setConfirmApp] = useState(null);
  const [inspectingAppKey, setInspectingAppKey] = useState(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");

  const normalizedApps = useMemo(
    () =>
      (apps || []).map((a) => {
        const name = a.name || a.app_name || "Connected App";
        const desc = a.desc || a.app_desc || "Enterprise SSO Client";
        const logo = a.logo || a.logo_char || name.substring(0, 1).toUpperCase();
        const lastUsed = a.last_used_at || a.connectedDate || a.connected_date || "Active";
        return { ...a, name, desc, logo, lastUsed };
      }),
    [apps]
  );

  const inspectingApp = useMemo(
    () => normalizedApps.find((a) => (a.app_key || a.id || a.name) === inspectingAppKey) || null,
    [normalizedApps, inspectingAppKey]
  );

  const filteredInspectAccounts = useMemo(() => {
    const list = inspectingApp?.connected_users || [];
    const q = accountSearch.trim().toLowerCase();
    return list.filter((cu) => {
      const matchesStatus =
        accountFilter === "all" ||
        (accountFilter === "active" && cu.is_active) ||
        (accountFilter === "revoked" && !cu.is_active);
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        (cu.email || "").toLowerCase().includes(q) ||
        (cu.username || "").toLowerCase().includes(q) ||
        (cu.full_name || "").toLowerCase().includes(q)
      );
    });
  }, [inspectingApp, accountSearch, accountFilter]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedApps;
    return normalizedApps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        (a.permissions || []).some((p) => p.toLowerCase().includes(q)) ||
        (a.connected_users || []).some(
          (u) =>
            (u.email || "").toLowerCase().includes(q) ||
            (u.username || "").toLowerCase().includes(q) ||
            (u.full_name || "").toLowerCase().includes(q)
        )
    );
  }, [normalizedApps, search]);

  const openAccountsModal = (app) => {
    setAccountSearch("");
    setAccountFilter("all");
    setInspectingAppKey(app.app_key || app.id || app.name);
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
            Connected applications
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
            Inspect integrated OAuth and SSO clients, granted scopes, and active access status.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="btn btn--ghost"
          style={{
            height: "36px",
            padding: "0 13px",
            fontSize: "12.5px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh apps</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: "14px 16px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "420px" }}>
          <Search
            size={15}
            color="var(--adm-muted)"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search connected applications or scopes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <div style={{ fontSize: "12.5px", color: "var(--adm-text-2)" }}>
          Showing <strong style={{ color: "var(--adm-text)" }}>{filteredApps.length}</strong> of{" "}
          <strong style={{ color: "var(--adm-text)" }}>{apps.length}</strong> applications
        </div>
      </div>

      {/* Applications Grid */}
      {loading && apps.length === 0 ? (
        <div className="card" style={{ padding: "40px", borderRadius: "12px", textAlign: "center", color: "var(--adm-muted)" }}>
          Loading connected applications...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", borderRadius: "12px", textAlign: "center", color: "var(--adm-muted)" }}>
          <AppWindow size={32} color="var(--adm-muted-2)" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-text)" }}>
            No connected applications found
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>
            Registered OAuth/SSO client integrations will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredApps.map((app) => {
            const isActive = (app.status || "Active").toLowerCase() === "active";
            return (
              <div
                key={app.id || app.name}
                className="card"
                style={{
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "var(--adm-badge-neutral-bg)",
                          border: "1px solid var(--adm-accent-border)",
                          color: "var(--adm-link)",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        {app.logo || (app.name || "A").substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-text)" }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--adm-text-2)" }}>
                          {app.desc || "Enterprise SSO Client"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: isActive ? "var(--adm-ok-bg)" : "var(--adm-badge-neutral-bg)",
                        border: `1px solid ${isActive ? "var(--adm-ok-border)" : "var(--adm-border-strong)"}`,
                        color: isActive ? "var(--adm-ok-text)" : "var(--adm-text-2)",
                      }}
                    >
                      {app.status || "Active"}
                    </span>
                  </div>

                  {Array.isArray(app.permissions) && app.permissions.length > 0 && (
                    <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {app.permissions.map((perm) => (
                        <span
                          key={perm}
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "var(--adm-input)",
                            border: "1px solid var(--adm-border-strong)",
                            color: "var(--adm-text)",
                          }}
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  )}

                  {(typeof app.active_users_count === "number" || (app.connected_users && app.connected_users.length > 0)) && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "9px 10px",
                        borderRadius: "8px",
                        background: "var(--adm-subtle)",
                        border: "1px solid var(--adm-border-soft)",
                        fontSize: "11.5px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--adm-text-2)", marginBottom: "6px", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600, color: "var(--adm-text)" }}>
                          <Users size={12} color="var(--adm-link)" />
                          {app.active_users_count ?? 0} active · {app.inactive_users_count ?? 0} revoked
                        </span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                          <span>{app.total_logins ?? 1} sign-ins</span>
                          {Array.isArray(app.connected_users) && app.connected_users.length > 0 && (
                            <button
                              type="button"
                              onClick={() => openAccountsModal(app)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--adm-link)",
                                fontWeight: 600,
                                fontSize: "11.5px",
                                cursor: "pointer",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              View all ({app.connected_users.length}) <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      {Array.isArray(app.connected_users) && app.connected_users.length > 0 && (
                        <div style={{ display: "grid", gap: "4px" }}>
                          {app.connected_users.slice(0, 3).map((cu) => (
                            <div
                              key={cu.uid || cu.email}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "8px",
                                color: cu.is_active ? "var(--adm-text-2)" : "var(--adm-muted)",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cu.email || cu.username}
                              </span>
                              <span style={{ flexShrink: 0, fontSize: "11px", color: cu.is_active ? "var(--adm-ok-text)" : "var(--adm-danger-text)" }}>
                                {cu.is_active ? `${cu.login_count || 1}x · ${cu.last_used_at}` : "Disconnected"}
                              </span>
                            </div>
                          ))}
                          {app.connected_users.length > 3 && (
                            <button
                              type="button"
                              onClick={() => openAccountsModal(app)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "2px 0 0",
                                textAlign: "left",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: "var(--adm-link)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              View all {app.connected_users.length} accounts (+{app.connected_users.length - 3} more) →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--adm-border-soft)",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11.5px",
                    color: "var(--adm-muted)",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <ShieldCheck size={13} color={isActive ? "var(--adm-ok-text)" : "var(--adm-muted)"} />
                    Last used {app.lastUsed}
                  </span>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    {onToggleApp && (
                      <button
                        type="button"
                        onClick={() => onToggleApp(app)}
                        style={{
                          background: "none",
                          border: "none",
                          color: isActive ? "var(--adm-text-2)" : "var(--adm-ok-text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Power size={12} /> {isActive ? "Disable" : "Enable"}
                      </button>
                    )}

                    {app.id && onDisconnectApp && isActive && (
                      <button
                        type="button"
                        onClick={() => setConfirmApp(app)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--adm-danger-text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Trash2 size={12} /> Disconnect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--adm-backdrop)",
            display: "grid",
            placeItems: "center",
            zIndex: 110,
            padding: "16px",
          }}
          onClick={() => setConfirmApp(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "24px", borderRadius: "12px", border: "1px solid var(--adm-border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--adm-text)" }}>
              Disconnect {confirmApp.name}?
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--adm-text-2)", lineHeight: 1.5 }}>
              Removing this connection revokes SSO token exchange for this client integration.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmApp(null)} style={{ flex: 1, height: "36px", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = confirmApp;
                  setConfirmApp(null);
                  onDisconnectApp(target);
                }}
                style={{ flex: 1, height: "36px", background: "#dc2626", borderColor: "#dc2626", color: "#ffffff", cursor: "pointer" }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectingApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--adm-backdrop)",
            display: "grid",
            placeItems: "center",
            zIndex: 115,
            padding: "16px",
          }}
          onClick={() => setInspectingAppKey(null)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "620px",
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: "12px",
              border: "1px solid var(--adm-border-strong)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "9px",
                    background: "var(--adm-badge-neutral-bg)",
                    border: "1px solid var(--adm-accent-border)",
                    color: "var(--adm-link)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "15px",
                    flexShrink: 0,
                  }}
                >
                  {inspectingApp.logo}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "var(--adm-text)" }}>
                    {inspectingApp.name} — Connected accounts
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--adm-text-2)", marginTop: "2px" }}>
                    {inspectingApp.active_users_count ?? 0} active · {inspectingApp.inactive_users_count ?? 0} revoked · {inspectingApp.total_logins ?? 0} total sign-ins
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close accounts modal"
                onClick={() => setInspectingAppKey(null)}
                style={{ background: "none", border: "none", color: "var(--adm-text-2)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search & Status Filter */}
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--adm-border-soft)",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <Search size={14} color="var(--adm-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search account email or name..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: "34px",
                    paddingLeft: "32px",
                    paddingRight: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--adm-border-strong)",
                    background: "var(--adm-input)",
                    fontSize: "12.5px",
                    color: "var(--adm-text)",
                  }}
                />
              </div>
              <div style={{ display: "inline-flex", gap: "6px" }}>
                {[
                  { id: "all", label: `All (${(inspectingApp.connected_users || []).length})` },
                  { id: "active", label: `Active (${inspectingApp.active_users_count ?? 0})` },
                  { id: "revoked", label: `Revoked (${inspectingApp.inactive_users_count ?? 0})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAccountFilter(f.id)}
                    style={{
                      height: "32px",
                      padding: "0 10px",
                      borderRadius: "7px",
                      border: `1px solid ${accountFilter === f.id ? "var(--adm-accent-border)" : "var(--adm-border-strong)"}`,
                      background: accountFilter === f.id ? "var(--adm-accent-soft)" : "var(--adm-input)",
                      color: accountFilter === f.id ? "var(--adm-link)" : "var(--adm-text-2)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accounts List */}
            <div style={{ overflowY: "auto", padding: "12px 20px", display: "grid", gap: "8px" }}>
              {filteredInspectAccounts.length === 0 ? (
                <div style={{ padding: "28px 12px", textAlign: "center", fontSize: "13px", color: "var(--adm-muted)" }}>
                  No accounts match your filter in {inspectingApp.name}.
                </div>
              ) : (
                filteredInspectAccounts.map((cu) => (
                  <div
                    key={cu.uid || cu.email}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--adm-subtle)",
                      border: "1px solid var(--adm-border-soft)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cu.full_name || cu.username || cu.email}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--adm-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cu.email} · {cu.login_count || 1} sign-in(s) · Last used {cu.last_used_at}
                      </div>
                    </div>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: cu.is_active ? "var(--adm-ok-bg)" : "var(--adm-danger-soft)",
                          border: `1px solid ${cu.is_active ? "var(--adm-ok-border)" : "var(--adm-danger-border)"}`,
                          color: cu.is_active ? "var(--adm-ok-text)" : "var(--adm-danger-text)",
                        }}
                      >
                        {cu.is_active ? "Active" : "Disconnected"}
                      </span>
                      {onToggleApp && (
                        <button
                          type="button"
                          onClick={() => onToggleApp(inspectingApp, cu)}
                          style={{
                            background: "var(--adm-input)",
                            border: `1px solid ${cu.is_active ? "var(--adm-danger-border)" : "var(--adm-ok-border)"}`,
                            borderRadius: "6px",
                            padding: "4px 9px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: cu.is_active ? "var(--adm-danger-text)" : "var(--adm-ok-text)",
                            cursor: "pointer",
                          }}
                        >
                          {cu.is_active ? "Revoke" : "Restore"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
