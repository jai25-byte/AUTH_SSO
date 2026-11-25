import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminOverview from "./AdminOverview.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminRoles from "./AdminRoles.jsx";
import AdminSessions from "./AdminSessions.jsx";
import AdminApplications from "./AdminApplications.jsx";
import AdminSecurityActivity from "./AdminSecurityActivity.jsx";
import AdminSettings from "./AdminSettings.jsx";
import { useHistoryTab } from "../../services/navigation.js";
import {
  getCurrentUserRole,
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  updateUserRole,
  getAdminRoles,
  getAdminSessions,
  revokeAdminSession,
  revokeAllUserSessions,
  getAdminLoginActivity,
  getAdminAuditLogs,
  getAdminSettings,
  updateAdminSettings,
  getAdminConnectedApps,
  disconnectAdminApp,
  adminLogout,
} from "../../services/adminApi.js";
import {
  Menu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Search,
  LogOut,
  X,
  ChevronDown,
  User,
  ExternalLink,
  AlertTriangle,
  Settings,
} from "lucide-react";

const ADMIN_PAGES = new Set([
  "overview",
  "users",
  "roles",
  "sessions",
  "applications",
  "activity",
  "audit",
  "settings",
]);

const QUICK_PAGES = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "roles", label: "Roles & permissions" },
  { id: "sessions", label: "Sessions" },
  { id: "applications", label: "Applications" },
  { id: "activity", label: "Security activity (Login logs)" },
  { id: "audit", label: "Security activity (Audit ledger)" },
  { id: "settings", label: "Admin settings" },
];

export default function AdminDashboard({ onNavigate }) {
  const [activePage, setActivePage] = useHistoryTab(ADMIN_PAGES, "overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  // Header Popovers & Search Modal
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Auth State (server-verified via /api/user/role)
  const [authStatus, setAuthStatus] = useState("checking");
  const [adminUser, setAdminUser] = useState(null);

  // Data States
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [usersData, setUsersData] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [rolesData, setRolesData] = useState({ roles: [], permissions: [] });
  const [sessionsData, setSessionsData] = useState({ sessions: [], total: 0, page: 1, pages: 1 });
  const [appsData, setAppsData] = useState([]);
  const [activityData, setActivityData] = useState({ activities: [], total: 0, page: 1, pages: 1 });
  const [auditData, setAuditData] = useState({ logs: [], total: 0, page: 1, pages: 1 });
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(false);

  // Filter States
  const [userFilters, setUserFilters] = useState({ search: "", role: "all", status: "all", page: 1 });
  const [sessionFilters, setSessionFilters] = useState({ search: "", status: "all", page: 1 });
  const [activityFilters, setActivityFilters] = useState({ search: "", status: "all", date_from: "", date_to: "", page: 1 });
  const [auditFilters, setAuditFilters] = useState({ search: "", event: "all", page: 1 });

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "user",
  });
  const [editUserForm, setEditUserForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const notify = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { message: "", type: "info" } : prev));
    }, 4500);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setHelpOpen(false);
      }
    };
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await getCurrentUserRole();
        if (res && (res.role === "admin" || (res.role && res.role.toLowerCase().includes("admin")))) {
          setAdminUser(res);
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      } catch (err) {
        if (err.status === 403) setAuthStatus("unauthorized");
        else setAuthStatus("unauthenticated");
      }
    }
    verifyAuth();
  }, []);

  const loadPageData = useCallback(
    async (pageId = activePage) => {
      if (authStatus !== "authorized") return;
      setLoading(true);
      try {
        if (pageId === "overview") {
          const [statsRes, usersRes, rolesRes, sessRes, actRes, settingsRes, appsRes] =
            await Promise.allSettled([
              getAdminStats(),
              getAdminUsers({ page: 1, per_page: 20 }),
              getAdminRoles(),
              getAdminSessions({ page: 1, per_page: 20 }),
              getAdminLoginActivity({ page: 1, per_page: 20 }),
              getAdminSettings(),
              getAdminConnectedApps(),
            ]);
          if (statsRes.status === "fulfilled") setStats(statsRes.value);
          else throw statsRes.reason;

          if (usersRes.status === "fulfilled") setUsersData(usersRes.value);
          if (rolesRes.status === "fulfilled") setRolesData(rolesRes.value);
          if (sessRes.status === "fulfilled") setSessionsData(sessRes.value);
          if (actRes.status === "fulfilled") setRecentActivity(actRes.value?.activities || []);
          if (settingsRes.status === "fulfilled") setSettingsData(settingsRes.value || {});
          if (appsRes.status === "fulfilled") setAppsData(appsRes.value || []);
        } else if (pageId === "users") {
          const res = await getAdminUsers(userFilters);
          setUsersData(res);
        } else if (pageId === "roles") {
          const [rolesRes, usersRes] = await Promise.all([
            getAdminRoles(),
            getAdminUsers({ page: 1, per_page: 100 }),
          ]);
          setRolesData(rolesRes);
          setUsersData(usersRes);
        } else if (pageId === "sessions") {
          const res = await getAdminSessions(sessionFilters);
          setSessionsData(res);
        } else if (pageId === "applications") {
          const appsRes = await getAdminConnectedApps();
          setAppsData(appsRes || []);
        } else if (pageId === "activity" || pageId === "audit") {
          const [actRes, audRes] = await Promise.allSettled([
            getAdminLoginActivity(activityFilters),
            getAdminAuditLogs(auditFilters),
          ]);
          if (actRes.status === "fulfilled") setActivityData(actRes.value);
          if (audRes.status === "fulfilled") setAuditData(audRes.value);
        } else if (pageId === "settings") {
          const res = await getAdminSettings();
          setSettingsData(res);
        }
      } catch (err) {
        notify(err.message || "Failed to load admin data", "error");
      } finally {
        setLoading(false);
      }
    },
    [authStatus, activePage, userFilters, sessionFilters, activityFilters, auditFilters]
  );

  useEffect(() => {
    if (authStatus === "authorized") {
      loadPageData(activePage);
    }
  }, [authStatus, activePage, loadPageData]);

  // Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createAdminUser(newUserForm);
      notify(`User '${newUserForm.username}' created successfully!`, "success");
      setIsAddUserOpen(false);
      setNewUserForm({ username: "", email: "", password: "", full_name: "", phone: "", role: "user" });
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.uid, editUserForm);
      notify("User updated successfully!", "success");
      setEditingUser(null);
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleToggleStatus = async (uid, newStatus) => {
    try {
      await toggleUserStatus(uid, newStatus);
      notify(`Account status updated to ${newStatus ? "Active" : "Deactivated"}`, "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleDeleteUser = async (uid) => {
    try {
      await deleteAdminUser(uid);
      notify("User permanently deleted from directory", "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleAssignRole = async (uid, role) => {
    try {
      await updateUserRole(uid, role);
      notify(`User role assigned to '${role}'`, "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeAdminSession(sessionId);
      notify("Session revoked immediately", "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleRevokeAllUserSessions = async (uid) => {
    try {
      await revokeAllUserSessions(uid);
      notify("All sessions for user revoked", "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      await updateAdminSettings(newSettings);
      notify("System settings successfully saved", "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleDisconnectApp = async (app) => {
    try {
      await disconnectAdminApp(app.id);
      notify(`Disconnected application '${app.name}'`, "success");
      loadPageData(activePage);
    } catch (err) {
      notify(err.message || "Unable to modify application connection", "error");
    }
  };

  const handleExportReport = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      workspace: settingsData?.app_name || "VaultAuth SSO",
      stats,
      active_sessions_count: sessionsData.total,
      applications_count: appsData.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultauth-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Security workspace report exported", "success");
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {}
    if (onNavigate) onNavigate("/login", { replace: true });
    else window.location.replace("/login");
  };

  const failedAlertItems = useMemo(
    () => recentActivity.filter((a) => (a.status || "").toLowerCase() !== "success").slice(0, 5),
    [recentActivity]
  );

  const filteredCommands = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    return {
      pages: QUICK_PAGES.filter((p) => !q || p.label.toLowerCase().includes(q)),
      users: q
        ? (usersData.users || [])
            .filter(
              (u) =>
                (u.username || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.full_name || "").toLowerCase().includes(q)
            )
            .slice(0, 5)
        : [],
      apps: q
        ? appsData.filter((a) => (a.name || "").toLowerCase().includes(q)).slice(0, 4)
        : [],
    };
  }, [cmdQuery, usersData.users, appsData]);

  // Auth Guard Views
  if (authStatus === "unauthenticated") {
    return (
      <div
        className="admin-app-layout"
        style={{ display: "grid", placeItems: "center", padding: "24px 16px" }}
      >
        <div className="card" style={{ width: "100%", maxWidth: "430px", textAlign: "center", padding: "36px 32px", borderRadius: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(247, 215, 148, 0.14)",
              border: "1px solid rgba(247, 215, 148, 0.35)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldAlert size={24} color="#F7D794" />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
            Admin Session Required
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "13.5px", lineHeight: 1.5, margin: "0 0 24px" }}>
            Sign in with an administrator account to access the VaultAuth Admin workspace.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate("/login", { replace: true }) : window.location.replace("/login"))}
              className="btn"
              style={{ width: "100%", height: "40px", cursor: "pointer" }}
            >
              Sign In to VaultAuth
            </button>
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate("/dashboard") : (window.location.href = "/dashboard"))}
              className="btn btn--ghost"
              style={{ width: "100%", height: "38px", cursor: "pointer" }}
            >
              Switch to User Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="admin-app-layout" style={{ display: "grid", placeItems: "center", padding: "24px 16px" }}>
        <div className="card" style={{ width: "100%", maxWidth: "440px", textAlign: "center", padding: "36px", borderRadius: "14px" }}>
          <Shield size={42} color="#f87171" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
            403 — Access Forbidden
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "13.5px", margin: "0 0 24px", lineHeight: 1.5 }}>
            Your account is assigned the <strong style={{ color: "#ffffff" }}>End User</strong> role. Administrator access is enforced by the backend.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate("/dashboard") : (window.location.href = "/dashboard"))}
              className="btn"
              style={{ width: "100%", height: "40px", cursor: "pointer" }}
            >
              Go to User Dashboard
            </button>
            <button type="button" onClick={handleLogout} className="btn btn--ghost" style={{ width: "100%", height: "38px", cursor: "pointer" }}>
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "checking") {
    return (
      <div className="admin-app-layout" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            className="btn__spinner"
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              borderWidth: "3px",
              borderColor: "#1f1f1f",
              borderTopColor: "#F7D794",
            }}
          />
          <p style={{ marginTop: "14px", fontSize: "13px", color: "#a1a1aa" }}>
            Verifying workspace session &amp; permissions...
          </p>
        </div>
      </div>
    );
  }

  const adminName = adminUser?.full_name || adminUser?.username || "Administrator";
  const adminRoleTitle = adminUser?.role_title || "Super administrator";

  return (
    <div className="admin-app-layout">
      {/* Left Sidebar */}
      <AdminSidebar
        activePage={activePage}
        onNavigate={(p) => {
          if (typeof p === "string" && p.startsWith("/")) {
            if (onNavigate) onNavigate(p);
            else window.location.href = p;
            return;
          }
          setActivePage(p);
        }}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((c) => !c)}
        activeSessionsCount={stats?.active_sessions ?? sessionsData.total ?? 0}
        onOpenHelp={() => setHelpOpen(true)}
        onLogout={handleLogout}
      />

      {/* Right Workspace Column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#000000" }}>
        {/* Black Top Header Bar */}
        <header
          style={{
            height: "60px",
            background: "#000000",
            borderBottom: "1px solid #1f1f1f",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30,
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCmdQuery("");
                setCmdOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                width: "100%",
                maxWidth: "340px",
                height: "36px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #262626",
                background: "#0a0a0a",
                color: "#a1a1aa",
                fontSize: "12.5px",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", whiteSpace: "nowrap" }}>
                <Search size={14} color="#71717a" />
                <span>Search users, applications, activity...</span>
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  color: "#F7D794",
                  background: "#141414",
                  border: "1px solid #262626",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                ⌘K
              </span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                background: "rgba(247, 215, 148, 0.12)",
                border: "1px solid rgba(247, 215, 148, 0.3)",
                color: "#F7D794",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={13} />
              <span>Admin workspace</span>
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Security notifications"
                style={{
                  position: "relative",
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "1px solid #262626",
                  background: "#0a0a0a",
                  color: "#a1a1aa",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Bell size={15} />
                {(stats?.failed_logins_24h ?? 0) > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "7px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#F7D794",
                    }}
                  />
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "300px",
                    background: "#0a0a0a",
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    boxShadow: "0 14px 32px rgba(0, 0, 0, 0.65)",
                    padding: "10px",
                    zIndex: 60,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px 8px", borderBottom: "1px solid #1f1f1f", fontSize: "12.5px" }}>
                    <strong style={{ color: "#ffffff" }}>Security alerts</strong>
                    <span style={{ fontSize: "11px", color: "#F7D794" }}>
                      {stats?.failed_logins_24h ?? 0} failed (24h)
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: "6px", padding: "8px 0" }}>
                    {failedAlertItems.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#a1a1aa", padding: "8px 4px" }}>
                        No recent failed login alerts.
                      </div>
                    ) : (
                      failedAlertItems.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => {
                            setNotifOpen(false);
                            setActivePage("activity");
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "7px",
                            background: "#000000",
                            border: "1px solid #1f1f1f",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            gap: "8px",
                            alignItems: "flex-start",
                          }}
                        >
                          <AlertTriangle size={13} color="#F7D794" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "#ffffff" }}>
                              Failed login: {ev.username || "Unknown"}
                            </div>
                            <div style={{ color: "#a1a1aa", fontSize: "11px" }}>
                              {ev.ip_address || "127.0.0.1"} · {ev.created_at || "Recent"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotifOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(247, 215, 148, 0.16)",
                    border: "1px solid rgba(247, 215, 148, 0.35)",
                    color: "#F7D794",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "12.5px",
                  }}
                >
                  {adminName.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#ffffff" }}>
                    {adminName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#a1a1aa" }}>
                    {adminRoleTitle}
                  </div>
                </div>
                <ChevronDown size={13} color="#a1a1aa" />
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "210px",
                    background: "#0a0a0a",
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    boxShadow: "0 14px 32px rgba(0, 0, 0, 0.65)",
                    padding: "6px",
                    zIndex: 60,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setActivePage("settings");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "#e4e4e7",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    <Settings size={14} color="#F7D794" /> Admin settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      if (onNavigate) onNavigate("/dashboard");
                      else window.location.href = "/dashboard";
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "#e4e4e7",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    <ExternalLink size={14} color="#F7D794" /> User dashboard
                  </button>
                  <div style={{ height: "1px", background: "#1f1f1f", margin: "4px 0" }} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "#f87171",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main style={{ padding: "24px 28px 36px", flex: 1, minWidth: 0 }}>
          {activePage === "overview" && (
            <AdminOverview
              stats={stats}
              sessions={sessionsData.sessions}
              sessionsTotal={sessionsData.total}
              users={usersData.users}
              rolesData={rolesData}
              apps={appsData}
              settings={settingsData}
              adminUser={adminUser}
              loading={loading}
              onRefresh={() => loadPageData("overview")}
              onNavigate={setActivePage}
              onOpenAddUser={() => setIsAddUserOpen(true)}
              onRevokeSession={handleRevokeSession}
              onAssignRole={handleAssignRole}
              onToggleApp={() => setActivePage("applications")}
              onExportReport={handleExportReport}
            />
          )}

          {activePage === "users" && (
            <AdminUsers
              users={usersData.users}
              total={usersData.total}
              page={usersData.page}
              perPage={usersData.per_page}
              totalPages={usersData.pages}
              search={userFilters.search}
              roleFilter={userFilters.role}
              statusFilter={userFilters.status}
              onSearchChange={(search) => setUserFilters((prev) => ({ ...prev, search, page: 1 }))}
              onRoleFilterChange={(role) => setUserFilters((prev) => ({ ...prev, role, page: 1 }))}
              onStatusFilterChange={(status) => setUserFilters((prev) => ({ ...prev, status, page: 1 }))}
              onPageChange={(page) => setUserFilters((prev) => ({ ...prev, page }))}
              onOpenAddUser={() => setIsAddUserOpen(true)}
              onOpenEditUser={(u) => {
                setEditingUser(u);
                setEditUserForm({
                  full_name: u.full_name || "",
                  email: u.email || "",
                  phone: u.phone || "",
                });
              }}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
              currentAdminUid={adminUser?.uid}
              loading={loading}
            />
          )}

          {activePage === "roles" && (
            <AdminRoles
              rolesData={rolesData}
              onAssignRole={handleAssignRole}
              usersList={usersData.users}
              loading={loading}
            />
          )}

          {activePage === "sessions" && (
            <AdminSessions
              sessions={sessionsData.sessions}
              total={sessionsData.total}
              page={sessionsData.page}
              totalPages={sessionsData.pages}
              search={sessionFilters.search}
              statusFilter={sessionFilters.status}
              onSearchChange={(search) => setSessionFilters((prev) => ({ ...prev, search, page: 1 }))}
              onStatusFilterChange={(status) => setSessionFilters((prev) => ({ ...prev, status, page: 1 }))}
              onPageChange={(page) => setSessionFilters((prev) => ({ ...prev, page }))}
              onRevokeSession={handleRevokeSession}
              onRevokeAllUserSessions={handleRevokeAllUserSessions}
              onRefresh={() => loadPageData("sessions")}
              loading={loading}
            />
          )}

          {activePage === "applications" && (
            <AdminApplications
              apps={appsData}
              onRefresh={() => loadPageData("applications")}
              onDisconnectApp={handleDisconnectApp}
              loading={loading}
            />
          )}

          {(activePage === "activity" || activePage === "audit") && (
            <AdminSecurityActivity
              initialTab={activePage === "audit" ? "audit" : "logins"}
              activities={activityData.activities}
              activityTotal={activityData.total}
              activityPage={activityData.page}
              activityTotalPages={activityData.pages}
              activitySearch={activityFilters.search}
              activityStatusFilter={activityFilters.status}
              dateFrom={activityFilters.date_from}
              dateTo={activityFilters.date_to}
              onActivitySearchChange={(search) => setActivityFilters((prev) => ({ ...prev, search, page: 1 }))}
              onActivityStatusChange={(status) => setActivityFilters((prev) => ({ ...prev, status, page: 1 }))}
              onDateFromChange={(date_from) => setActivityFilters((prev) => ({ ...prev, date_from, page: 1 }))}
              onDateToChange={(date_to) => setActivityFilters((prev) => ({ ...prev, date_to, page: 1 }))}
              onActivityPageChange={(page) => setActivityFilters((prev) => ({ ...prev, page }))}
              logs={auditData.logs}
              auditTotal={auditData.total}
              auditPage={auditData.page}
              auditTotalPages={auditData.pages}
              auditSearch={auditFilters.search}
              eventFilter={auditFilters.event}
              onAuditSearchChange={(search) => setAuditFilters((prev) => ({ ...prev, search, page: 1 }))}
              onEventFilterChange={(event) => setAuditFilters((prev) => ({ ...prev, event, page: 1 }))}
              onAuditPageChange={(page) => setAuditFilters((prev) => ({ ...prev, page }))}
              onRefresh={() => loadPageData(activePage)}
              loading={loading}
            />
          )}

          {activePage === "settings" && (
            <AdminSettings
              settings={settingsData}
              onSaveSettings={handleSaveSettings}
              loading={loading}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      {cmdOpen && (
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
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "500px", borderRadius: "12px", overflow: "hidden", border: "1px solid #262626" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #1f1f1f" }}>
              <Search size={16} color="#F7D794" />
              <input
                type="text"
                autoFocus
                placeholder="Search users, applications, or pages..."
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "13.5px", color: "#ffffff" }}
              />
              <button type="button" onClick={() => setCmdOpen(false)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: "320px", overflowY: "auto", padding: "10px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#71717a", padding: "4px 8px", textTransform: "uppercase" }}>
                Pages
              </div>
              {filteredCommands.pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setCmdOpen(false);
                    setActivePage(p.id);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "none",
                    background: "transparent",
                    color: "#e4e4e7",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}

              {filteredCommands.users.length > 0 && (
                <>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#71717a", padding: "8px 8px 4px", textTransform: "uppercase" }}>
                    Users
                  </div>
                  {filteredCommands.users.map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      onClick={() => {
                        setCmdOpen(false);
                        setUserFilters((prev) => ({ ...prev, search: u.email || u.username, page: 1 }));
                        setActivePage("users");
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "none",
                        background: "transparent",
                        color: "#ffffff",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <User size={13} color="#F7D794" /> {u.full_name || u.username}
                      </span>
                      <span style={{ color: "#71717a", fontSize: "12px" }}>{u.email}</span>
                    </button>
                  ))}
                </>
              )}

              {filteredCommands.apps.length > 0 && (
                <>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#71717a", padding: "8px 8px 4px", textTransform: "uppercase" }}>
                    Applications
                  </div>
                  {filteredCommands.apps.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setCmdOpen(false);
                        setActivePage("applications");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "none",
                        background: "transparent",
                        color: "#ffffff",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {a.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpOpen && (
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
          onClick={() => setHelpOpen(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "24px", borderRadius: "12px", border: "1px solid #262626" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>VaultAuth Admin Documentation</h3>
              <button type="button" onClick={() => setHelpOpen(false)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#a1a1aa", lineHeight: 1.55 }}>
              Press <kbd style={{ color: "#F7D794" }}>⌘K</kbd> or <kbd style={{ color: "#F7D794" }}>Ctrl+K</kbd> anywhere in the console to search directory users, applications, or jump across admin pages.
              All administrative actions and role changes are validated server-side.
            </p>
            <button type="button" onClick={() => setHelpOpen(false)} className="btn" style={{ width: "100%", height: "36px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setIsAddUserOpen(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "460px", padding: "26px", borderRadius: "12px", border: "1px solid #262626" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", color: "#ffffff" }}>Add user</h3>
              <button onClick={() => setIsAddUserOpen(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#a1a1aa" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "13px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah.wilson"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@company.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Wilson"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Initial password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars with variety"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Role
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", padding: "0 12px", background: "#000000", color: "#ffffff", fontSize: "13px" }}
                >
                  <option value="user">Member (End User)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="btn btn--ghost" onClick={() => setIsAddUserOpen(false)} style={{ flex: 1, height: "38px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ flex: 1, height: "38px", cursor: "pointer" }}>
                  Create user
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setEditingUser(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "430px", padding: "26px", borderRadius: "12px", border: "1px solid #262626" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", color: "#ffffff" }}>Edit user details</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#a1a1aa" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: "grid", gap: "13px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa", marginBottom: "4px" }}>
                  Phone number
                </label>
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid #262626", background: "#000000", color: "#ffffff", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditingUser(null)} style={{ flex: 1, height: "38px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ flex: 1, height: "38px", cursor: "pointer" }}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <div
          style={{
            position: "fixed",
            top: "18px",
            right: "22px",
            zIndex: 1000,
            background: "#0a0a0a",
            padding: "12px 16px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
            border: "1px solid #262626",
            borderLeft: `4px solid ${toast.type === "success" ? "#4ade80" : toast.type === "error" ? "#f87171" : "#F7D794"}`,
            fontSize: "13px",
            fontWeight: 500,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "toast-in 0.25s ease both",
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ message: "", type: "info" })}
            style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
