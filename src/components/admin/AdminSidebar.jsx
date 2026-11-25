import React from "react";
import {
  LayoutGrid,
  Users,
  ShieldCheck,
  Monitor,
  AppWindow,
  Activity,
  Settings,
  LogOut,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function AdminSidebar({
  activePage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  activeSessionsCount = 0,
  onOpenHelp,
  onLogout,
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles & permissions", icon: ShieldCheck },
    { id: "sessions", label: "Sessions", icon: Monitor, badge: activeSessionsCount },
    { id: "applications", label: "Applications", icon: AppWindow },
    { id: "activity", label: "Security activity", icon: Activity },
    { id: "settings", label: "Admin settings", icon: Settings },
  ];

  const isNavActive = (itemId) => {
    if (activePage === itemId) return true;
    if (itemId === "activity" && activePage === "audit") return true;
    return false;
  };

  return (
    <aside
      className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}
      style={{
        width: isCollapsed ? "68px" : "232px",
        minHeight: "100vh",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "#000000",
        color: "#a1a1aa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid #1f1f1f",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
      }}
    >
      {/* Top: Brand Header + Primary Nav */}
      <div>
        <div
          style={{
            height: "60px",
            padding: isCollapsed ? "0 14px" : "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            borderBottom: "1px solid #141414",
          }}
        >
          <div
            onClick={() => onNavigate("overview")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              minWidth: 0,
            }}
            title="VaultAuth Identity + Access"
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#F7D794",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#000000", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>
                V
              </span>
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, lineHeight: 1.15 }}>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>
                  VaultAuth
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "#71717a",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "2px",
                  }}
                >
                  IDENTITY + ACCESS
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {isCollapsed && onToggleCollapse && (
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Section Header + Nav List */}
        <nav style={{ padding: isCollapsed ? "10px 8px" : "12px 12px" }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 10px 10px",
              }}
            >
              WORKSPACE
            </div>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "3px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.id);

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "space-between",
                      padding: isCollapsed ? "9px" : "8px 11px",
                      borderRadius: "8px",
                      border: isActive ? "1px solid rgba(247, 215, 148, 0.28)" : "1px solid transparent",
                      background: isActive ? "rgba(247, 215, 148, 0.12)" : "transparent",
                      color: isActive ? "#F7D794" : "#a1a1aa",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "background 0.15s ease, color 0.15s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "#111111";
                        e.currentTarget.style.color = "#ffffff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#a1a1aa";
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <Icon size={16} color={isActive ? "#F7D794" : "currentColor"} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                      )}
                    </span>

                    {!isCollapsed && typeof item.badge === "number" && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: isActive ? "#000000" : "#F7D794",
                          background: isActive ? "#F7D794" : "rgba(247, 215, 148, 0.14)",
                          padding: "1px 7px",
                          borderRadius: "6px",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom: Portal Link, Help, Sign Out & Version */}
      <div
        style={{
          padding: isCollapsed ? "12px 8px" : "12px 12px 14px",
          borderTop: "1px solid #1f1f1f",
          display: "grid",
          gap: "2px",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("/dashboard")}
          title={isCollapsed ? "End User Portal" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "10px",
            padding: isCollapsed ? "8px" : "7px 11px",
            borderRadius: "7px",
            border: "none",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12.5px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F7D794")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        >
          <ExternalLink size={15} />
          {!isCollapsed && <span>User dashboard</span>}
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          title={isCollapsed ? "Help & documentation" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "10px",
            padding: isCollapsed ? "8px" : "7px 11px",
            borderRadius: "7px",
            border: "none",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12.5px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F7D794")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        >
          <CheckCircle2 size={15} />
          {!isCollapsed && <span>Help &amp; documentation</span>}
        </button>

        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? "Sign out" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "10px",
            padding: isCollapsed ? "8px" : "7px 11px",
            borderRadius: "7px",
            border: "none",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12.5px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        >
          <LogOut size={15} />
          {!isCollapsed && <span>Sign out</span>}
        </button>

        {!isCollapsed && (
          <div
            style={{
              fontSize: "10.5px",
              color: "#52525b",
              padding: "8px 11px 0",
              marginTop: "4px",
              borderTop: "1px solid #141414",
            }}
          >
            v1.0.0 · Secure workspace
          </div>
        )}
      </div>
    </aside>
  );
}
