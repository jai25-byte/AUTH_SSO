import React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Monitor,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function AdminSidebar({
  activePage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  adminUser,
  onLogout,
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "roles", label: "Role & Permissions", icon: ShieldCheck },
    { id: "sessions", label: "Active Sessions", icon: Monitor },
    { id: "activity", label: "Login Activity", icon: Activity },
    { id: "audit", label: "Security & Audit Logs", icon: FileText },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  const username = adminUser?.username || "Admin";
  const initials = username.substring(0, 2).toUpperCase();

  return (
    <aside
      className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}
      style={{
        width: isCollapsed ? "72px" : "260px",
        minHeight: "100vh",
        backgroundColor: "var(--sidebar-bg, #111827)",
        color: "var(--sidebar-text, #9ca3af)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid #1f2937",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Top Header & Branding */}
      <div>
        <div
          style={{
            padding: isCollapsed ? "20px 12px" : "20px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
            onClick={() => onNavigate("overview")}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #7047eb, #4f46e5)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(112, 71, 235, 0.35)",
              }}
            >
              <Shield size={20} color="#ffffff" strokeWidth={2.2} />
            </div>

            {!isCollapsed && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
                    VaultAuth<span style={{ color: "#a5b4fc" }}>SSO</span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(112, 71, 235, 0.25)",
                      color: "#c7d2fe",
                      border: "1px solid rgba(199, 210, 254, 0.2)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    ADMIN
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#6b7280", marginTop: "2px" }}>
                  IAM CONTROL CENTER
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#9ca3af",
                padding: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand button */}
        {isCollapsed && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "6px",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation items */}
        <nav style={{ padding: isCollapsed ? "16px 8px" : "16px 12px" }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 10px 10px",
              }}
            >
              Management
            </div>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "4px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: "12px",
                      padding: isCollapsed ? "10px" : "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: isActive ? "#1f2937" : "transparent",
                      color: isActive ? "#ffffff" : "#9ca3af",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s ease",
                      borderLeft: isActive ? "3px solid #7047eb" : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                        e.currentTarget.style.color = "#e5e7eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#9ca3af";
                      }
                    }}
                  >
                    <Icon size={18} color={isActive ? "#818cf8" : "currentColor"} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Switch to End User Dashboard shortcut */}
          <div style={{ marginTop: "24px" }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 10px 8px",
                }}
              >
                Portals
              </div>
            )}
            <a
              href="/DASHBOARD/index.html"
              title="Switch to End User Dashboard"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                padding: isCollapsed ? "10px" : "10px 14px",
                borderRadius: "8px",
                color: "#a5b4fc",
                textDecoration: "none",
                fontSize: "0.84rem",
                fontWeight: 500,
                background: "rgba(112, 71, 235, 0.08)",
                border: "1px solid rgba(165, 180, 252, 0.15)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(112, 71, 235, 0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(112, 71, 235, 0.08)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ExternalLink size={16} />
                {!isCollapsed && <span>User Dashboard</span>}
              </div>
            </a>
          </div>
        </nav>
      </div>

      {/* Bottom: Admin Profile & Logout */}
      <div
        style={{
          padding: isCollapsed ? "14px 8px" : "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        {!isCollapsed ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7047eb, #6366f1)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {username}
                </div>
                <div style={{ color: "#10b981", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  Enterprise Admin
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              aria-label="Logout"
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f87171";
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#9ca3af";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onLogout}
              title="Sign Out"
              aria-label="Logout"
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
