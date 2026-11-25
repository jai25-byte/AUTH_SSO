import React, { useState, useMemo } from "react";
import { AppWindow, Search, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

export default function AdminApplications({
  apps = [],
  onRefresh,
  onDisconnectApp,
  loading,
}) {
  const [search, setSearch] = useState("");
  const [confirmApp, setConfirmApp] = useState(null);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.desc || "").toLowerCase().includes(q) ||
        (a.permissions || []).some((p) => p.toLowerCase().includes(q))
    );
  }, [apps, search]);

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
          <AppWindow size={32} color="#52525b" style={{ margin: "0 auto 10px" }} />
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
                    <ShieldCheck size={13} color="var(--adm-ok-text)" />
                    Connected {app.connectedDate || app.connected_date || "Active"}
                  </span>

                  {app.id && onDisconnectApp && (
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
            );
          })}
        </div>
      )}

      {confirmApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
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
                style={{ flex: 1, height: "36px", background: "#dc2626", borderColor: "#dc2626", color: "var(--adm-text)", cursor: "pointer" }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
