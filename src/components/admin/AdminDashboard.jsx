import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminOverview from "./AdminOverview.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminRoles from "./AdminRoles.jsx";
import AdminSessions from "./AdminSessions.jsx";
import AdminLoginActivity from "./AdminLoginActivity.jsx";
import AdminAuditLogs from "./AdminAuditLogs.jsx";
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
  adminLogout,
} from "../../services/adminApi.js";
import {
  Menu,
  Shield,
  ShieldAlert,
  Bell,
  RefreshCw,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";

const ADMIN_PAGES = new Set([
  "overview",
  "users",
  "roles",
  "sessions",
  "activity",
  "audit",
  "settings",
]);

export default function AdminDashboard({ onNavigate }) {
  // Navigation & UI State (synced with browser history)
  const [activePage, setActivePage] = useHistoryTab(ADMIN_PAGES, "overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  // Auth State
  const [authStatus, setAuthStatus] = useState("checking"); // 'checking' | 'authorized' | 'unauthorized' | 'unauthenticated'
  const [adminUser, setAdminUser] = useState(null);

  // Data States
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [usersData, setUsersData] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [rolesData, setRolesData] = useState({ roles: [], permissions: [] });
  const [sessionsData, setSessionsData] = useState({ sessions: [], total: 0, page: 1, pages: 1 });
  const [activityData, setActivityData] = useState({ activities: [], total: 0, page: 1, pages: 1 });
  const [auditData, setAuditData] = useState({ logs: [], total: 0, page: 1, pages: 1 });
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(false);

  // Filter States
  const [userFilters, setUserFilters] = useState({ search: "", role: "all", status: "all", page: 1 });
  const [sessionFilters, setSessionFilters] = useState({ search: "", status: "all", page: 1 });
  const [activityFilters, setActivityFilters] = useState({ search: "", status: "all", date_from: "", date_to: "", page: 1 });
  const [auditFilters, setAuditFilters] = useState({ search: "", event: "all", page: 1 });

  // Modal States
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

  // 1. Initial Authentication & Role Check (strictly server-verified; never trust localStorage)
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
        if (err.status === 403) {
          setAuthStatus("unauthorized");
        } else {
          setAuthStatus("unauthenticated");
        }
      }
    }
    verifyAuth();
  }, []);

  // 2. Load Page Data
  const loadPageData = useCallback(async (pageId = activePage) => {
    if (authStatus !== "authorized") return;
    setLoading(true);
    try {
      if (pageId === "overview") {
        const [statsRes, actRes] = await Promise.all([
          getAdminStats(),
          getAdminLoginActivity({ page: 1, per_page: 8 }),
        ]);
        setStats(statsRes);
        setRecentActivity(actRes?.activities || []);
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
      } else if (pageId === "activity") {
        const res = await getAdminLoginActivity(activityFilters);
        setActivityData(res);
      } else if (pageId === "audit") {
        const res = await getAdminAuditLogs(auditFilters);
        setAuditData(res);
      } else if (pageId === "settings") {
        const res = await getAdminSettings();
        setSettingsData(res);
      }
    } catch (err) {
      notify(err.message || "Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  }, [authStatus, activePage, userFilters, sessionFilters, activityFilters, auditFilters]);

  useEffect(() => {
    if (authStatus === "authorized") {
      loadPageData(activePage);
    }
  }, [authStatus, activePage, loadPageData]);

  // Handlers for User Management
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createAdminUser(newUserForm);
      notify(`User '${newUserForm.username}' created successfully!`, "success");
      setIsAddUserOpen(false);
      setNewUserForm({ username: "", email: "", password: "", full_name: "", phone: "", role: "user" });
      loadPageData("users");
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
      loadPageData("users");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleToggleStatus = async (uid, newStatus) => {
    try {
      await toggleUserStatus(uid, newStatus);
      notify(`Account status updated to ${newStatus ? "Active" : "Deactivated"}`, "success");
      loadPageData("users");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleDeleteUser = async (uid) => {
    try {
      await deleteAdminUser(uid);
      notify("User permanently deleted from directory", "success");
      loadPageData("users");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleAssignRole = async (uid, role) => {
    try {
      await updateUserRole(uid, role);
      notify(`User role assigned to '${role}'`, "success");
      loadPageData("roles");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Handlers for Session Revocation
  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeAdminSession(sessionId);
      notify("Session revoked immediately", "success");
      loadPageData("sessions");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const handleRevokeAllUserSessions = async (uid) => {
    try {
      await revokeAllUserSessions(uid);
      notify("All sessions for user revoked", "success");
      loadPageData("sessions");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings) => {
    try {
      await updateAdminSettings(newSettings);
      notify("System settings successfully saved", "success");
      loadPageData("settings");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Sign out
  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {}
    if (onNavigate) {
      onNavigate("/login", { replace: true });
    } else {
      window.location.replace("/login");
    }
  };

  // Unauthenticated screen
  if (authStatus === "unauthenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "grid",
          placeItems: "center",
          background: "#0c1014",
          padding: "24px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "460px",
            textAlign: "center",
            padding: "36px 32px",
            background: "#121824",
            color: "#f8fafc",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(245, 158, 11, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldAlert size={32} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
            Admin Session Required
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 24px" }}>
            Sign in with an active administrative identity to access the VaultAuth Enterprise IAM Control Center.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("/login", { replace: true });
                } else {
                  window.location.replace("/login");
                }
              }}
              className="btn btn--primary"
              style={{
                width: "100%",
                padding: "13px",
                background: "linear-gradient(135deg, #7047eb, #4f46e5)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.94rem",
                boxShadow: "0 4px 14px rgba(112, 71, 235, 0.4)",
              }}
            >
              Sign In to VaultAuth SSO
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("/dashboard");
                } else {
                  window.location.href = "/dashboard";
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#a78bfa",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Switch to End User Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized screen (Logged in but non-admin role)
  if (authStatus === "unauthorized") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "460px", textAlign: "center", padding: "36px" }}>
          <Shield size={48} color="#dc2626" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>
            403 - Access Forbidden
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 24px" }}>
            Your account is assigned the <strong>End User</strong> role. The Enterprise Admin Dashboard requires elevated administrator privileges.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <a href="/DASHBOARD/index.html" className="btn" style={{ textDecoration: "none" }}>
              Go to End User Dashboard
            </a>
            <button onClick={handleLogout} className="btn btn--ghost">
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading initial authentication
  if (authStatus === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1220", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="btn__spinner" style={{ display: "inline-block", width: "32px", height: "32px", borderWidth: "3px", borderTopColor: "#7047eb" }} />
          <p style={{ marginTop: "16px", fontSize: "0.92rem", color: "#9ca3af" }}>
            Verifying cryptographic identity &amp; RBAC authorizations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app-layout" style={{ display: "flex", minHeight: "100vh", width: "100%", backgroundColor: "var(--page-bg, #f8fafc)" }}>
      {/* 1. Sidebar */}
      <AdminSidebar
        activePage={activePage}
        onNavigate={(p) => {
          if (p === "/dashboard" || p === "/login" || (typeof p === "string" && p.startsWith("/"))) {
            if (onNavigate) {
              onNavigate(p);
            } else {
              window.location.href = p;
            }
            return;
          }
          setActivePage(p);
          setMobileMenuOpen(false);
        }}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Workspace */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: "64px",
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
              }}
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              <span>VaultAuth SSO</span>
              <span style={{ margin: "0 6px" }}>/</span>
              <strong style={{ color: "#111827", textTransform: "capitalize" }}>
                {activePage === "overview"
                  ? "IAM Overview"
                  : activePage === "users"
                  ? "User Management"
                  : activePage === "roles"
                  ? "Role & Permissions"
                  : activePage === "sessions"
                  ? "Active Sessions"
                  : activePage === "activity"
                  ? "Login Activity"
                  : activePage === "audit"
                  ? "Security & Audit Logs"
                  : "System Settings"}
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.76rem",
                fontWeight: 600,
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
              Live Identity Telemetry
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7047eb, #818cf8)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                {(adminUser?.username || "A").substring(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ padding: "28px", flex: 1, minWidth: 0 }}>
          {activePage === "overview" && (
            <AdminOverview
              stats={stats}
              recentActivity={recentActivity}
              loading={loading}
              onRefresh={() => loadPageData("overview")}
              onNavigate={setActivePage}
              onOpenAddUser={() => setIsAddUserOpen(true)}
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

          {activePage === "activity" && (
            <AdminLoginActivity
              activities={activityData.activities}
              total={activityData.total}
              page={activityData.page}
              totalPages={activityData.pages}
              search={activityFilters.search}
              statusFilter={activityFilters.status}
              dateFrom={activityFilters.date_from}
              dateTo={activityFilters.date_to}
              onSearchChange={(search) => setActivityFilters((prev) => ({ ...prev, search, page: 1 }))}
              onStatusFilterChange={(status) => setActivityFilters((prev) => ({ ...prev, status, page: 1 }))}
              onDateFromChange={(date_from) => setActivityFilters((prev) => ({ ...prev, date_from, page: 1 }))}
              onDateToChange={(date_to) => setActivityFilters((prev) => ({ ...prev, date_to, page: 1 }))}
              onPageChange={(page) => setActivityFilters((prev) => ({ ...prev, page }))}
              onRefresh={() => loadPageData("activity")}
              loading={loading}
            />
          )}

          {activePage === "audit" && (
            <AdminAuditLogs
              logs={auditData.logs}
              total={auditData.total}
              page={auditData.page}
              totalPages={auditData.pages}
              search={auditFilters.search}
              eventFilter={auditFilters.event}
              onSearchChange={(search) => setAuditFilters((prev) => ({ ...prev, search, page: 1 }))}
              onEventFilterChange={(event) => setAuditFilters((prev) => ({ ...prev, event, page: 1 }))}
              onPageChange={(page) => setAuditFilters((prev) => ({ ...prev, page }))}
              onRefresh={() => loadPageData("audit")}
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

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setIsAddUserOpen(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "460px", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>
                Provision New Employee Account
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "14px" }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah.connor"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@enterprise.io"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars with variety"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Assigned IAM Role
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px", backgroundColor: "#fff" }}
                >
                  <option value="user">End User</option>
                  <option value="admin">Enterprise Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setIsAddUserOpen(false)}
                  style={{ flex: 1, height: "40px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ flex: 1, height: "40px", background: "linear-gradient(135deg, #7047eb, #4f46e5)" }}
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setEditingUser(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "440px", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>
                Edit Employee Details
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: "grid", gap: "14px" }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #d1d5db", padding: "0 12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setEditingUser(null)}
                  style={{ flex: 1, height: "40px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ flex: 1, height: "40px", background: "#7047eb" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast.message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 1000,
            background: "#ffffff",
            padding: "12px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
            border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${toast.type === "success" ? "#16a34a" : toast.type === "error" ? "#dc2626" : "#7047eb"}`,
            fontSize: "0.88rem",
            fontWeight: 500,
            color: "#111827",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "toast-in 0.25s ease both",
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ message: "", type: "info" })}
            style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
