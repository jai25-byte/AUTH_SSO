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
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Connected applications
          </h1>
          <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: "13px" }}>
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
            color="#71717a"
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
              border: "1px solid #262626",
              background: "#000000",
              fontSize: "13px",
              color: "#ffffff",
            }}
          />
        </div>

        <div style={{ fontSize: "12.5px", color: "#a1a1aa" }}>
          Showing <strong style={{ color: "#ffffff" }}>{filteredApps.length}</strong> of{" "}
          <strong style={{ color: "#ffffff" }}>{apps.length}</strong> applications
        </div>
      </div>

      {/* Applications Grid */}
      {loading && apps.length === 0 ? (
        <div className="card" style={{ padding: "40px", borderRadius: "12px", textAlign: "center", color: "#71717a" }}>
          Loading connected applications...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", borderRadius: "12px", textAlign: "center", color: "#71717a" }}>
          <AppWindow size={32} color="#52525b" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7" }}>
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
                          background: "#141414",
                          border: "1px solid rgba(247, 215, 148, 0.35)",
                          color: "#F7D794",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        {app.logo || (app.name || "A").substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
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
                        background: isActive ? "rgba(34, 197, 94, 0.14)" : "#141414",
                        border: `1px solid ${isActive ? "rgba(34, 197, 94, 0.3)" : "#262626"}`,
                        color: isActive ? "#4ade80" : "#a1a1aa",
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
                            background: "#000000",
                            border: "1px solid #262626",
                            color: "#d4d4d8",
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
                    borderTop: "1px solid #171717",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11.5px",
                    color: "#71717a",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <ShieldCheck size={13} color="#4ade80" />
                    Connected {app.connectedDate || app.connected_date || "Active"}
                  </span>

                  {app.id && onDisconnectApp && (
                    <button
                      type="button"
                      onClick={() => setConfirmApp(app)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f87171",
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
          <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "24px", borderRadius: "12px", border: "1px solid #262626" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#ffffff" }}>
              Disconnect {confirmApp.name}?
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#a1a1aa", lineHeight: 1.5 }}>
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
    </div>
  );
}
