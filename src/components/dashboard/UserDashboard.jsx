import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Grid,
  Clock,
  Laptop,
  ShieldCheck,
  User,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Shield,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Lock,
  ArrowRight,
  Filter,
  Trash2,
  Settings,
  Eye,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import {
  getToken,
  getStoredUser,
  setStoredUser,
  removeToken,
  logout as apiLogout,
  getUserProfile,
  getDashboardOverview,
  getLoginActivity,
  getActiveSessions,
  revokeSessionById,
  revokeOtherSessions,
  getConnectedApps,
  disconnectConnectedApp,
  reconnectConnectedApp,
  changePassword,
  validateResetPasswordPolicy,
} from "../../services/api.js";
import { useHistoryTab } from "../../services/navigation.js";

const USER_DASHBOARD_TABS = new Set([
  "overview",
  "apps",
  "activity",
  "devices",
  "security",
  "profile",
  "help",
]);

const USER_TAB_TITLES = {
  overview: "Overview · VaultAuth SSO",
  apps: "Connected apps · VaultAuth SSO",
  activity: "Login activity · VaultAuth SSO",
  devices: "Devices & sessions · VaultAuth SSO",
  security: "Security settings · VaultAuth SSO",
  profile: "My profile · VaultAuth SSO",
  help: "Help & support · VaultAuth SSO",
};

function normalizeAppItem(app) {
  const isAct = app.is_active !== undefined ? Boolean(app.is_active) : (app.status || "Active").toLowerCase() === "active";
  return {
    id: app.id,
    appKey: app.app_key || "",
    name: app.app_name || app.name || "Connected App",
    desc: app.app_desc || app.desc || "",
    category: app.category || "Enterprise App",
    logoText: app.logo_char || app.logo || (app.app_name || app.name || "A").slice(0, 1).toUpperCase(),
    bg: app.logo_bg || app.bg || "#4f46e5",
    permissions: Array.isArray(app.permissions) ? app.permissions : ["Standard access"],
    isActive: isAct,
    status: isAct ? "Active" : "Disconnected",
    connectedDate: app.connected_date || app.connectedDate || "Recently",
    lastUsed: app.last_used_at || app.connected_date || app.connectedDate || "Recently",
    loginCount: app.login_count ?? 1,
  };
}

function normalizeActivityItem(act, idx) {
  return {
    id: act.id ?? `act-${idx}`,
    device: act.device_name || act.device || "Web Browser",
    deviceType: act.device_type || act.deviceType || "desktop",
    browser: act.browser || "Browser",
    os: act.os || "Unknown OS",
    location: act.location || "Active Workspace",
    time: act.time_formatted || act.time || act.created_at || "Recently",
    ip: act.ip_address || act.ip || "—",
    status: act.status || "Success",
  };
}

function normalizeSessionItem(sess) {
  return {
    id: sess.session_id || sess.id,
    device: sess.device_name || sess.device || "Active Device",
    deviceType: sess.device_type || sess.deviceType || "desktop",
    browser: sess.browser || "Browser",
    os: sess.os || "Unknown OS",
    ip: sess.ip_address || sess.ip || "—",
    location: sess.location || "Active Workspace",
    lastActive: sess.last_active || sess.lastActive || sess.last_activity || "Active now",
    isCurrent: Boolean(sess.is_current ?? sess.isCurrent),
  };
}

export default function UserDashboard({ onNavigate, onNotify }) {
  const [activeTab, switchTab] = useHistoryTab(USER_DASHBOARD_TABS, "overview");
  const setActiveTab = (tab) => {
    switchTab(tab);
    setMobileMenuOpen(false);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vault_user_theme");
        if (saved === "light" || saved === "dark") return saved;
      } catch {}
    }
    return "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("vault_user_theme", next);
      } catch {}
      return next;
    });
  };

  // User details & telemetry
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser() || {
      username: "",
      email: "",
      full_name: "",
      role: "End user",
    };
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [overviewStats, setOverviewStats] = useState({
    securityScore: 90,
    scoreDesc: "Account well protected",
    activeSessionsCount: 0,
    connectedAppsCount: 0,
  });

  // Data states
  const [apps, setApps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Filters & search
  const [topbarSearch, setTopbarSearch] = useState("");
  const [appsFilter, setAppsFilter] = useState("all");
  const [appsSearch, setAppsSearch] = useState("");
  const [activityStatusFilter, setActivityStatusFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");

  // Password change state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const [pwdUpdating, setPwdUpdating] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Modals
  const [disconnectModalApp, setDisconnectModalApp] = useState(null);
  const [revokeModalSession, setRevokeModalSession] = useState(null);
  const [revokeAllModal, setRevokeAllModal] = useState(false);

  const loadDashboardData = async () => {
    const [profileRes, overviewRes, activityRes, sessionsRes, appsRes] = await Promise.all([
      getUserProfile(),
      getDashboardOverview().catch(() => null),
      getLoginActivity(25).catch(() => []),
      getActiveSessions().catch(() => []),
      getConnectedApps({ includeInactive: true }).catch(() => []),
    ]);

    if (profileRes) {
      setCurrentUser((prev) => {
        const merged = { ...prev, ...profileRes };
        setStoredUser(merged);
        return merged;
      });
    }
    const normalizedApps = Array.isArray(appsRes) ? appsRes.map(normalizeAppItem) : [];
    if (Array.isArray(appsRes)) {
      setApps(normalizedApps);
    }
    if (Array.isArray(activityRes)) {
      setActivities(activityRes.map(normalizeActivityItem));
    }
    if (Array.isArray(sessionsRes)) {
      setSessions(sessionsRes.map(normalizeSessionItem));
    }
    const activeAppsTotal = normalizedApps.filter((a) => a.isActive).length;
    if (overviewRes) {
      setOverviewStats({
        securityScore: overviewRes.security_score?.score ?? 90,
        scoreDesc: overviewRes.security_score?.description || "Your account is well protected",
        activeSessionsCount: overviewRes.active_sessions?.count ?? (Array.isArray(sessionsRes) ? sessionsRes.length : 0),
        connectedAppsCount: overviewRes.connected_apps?.count ?? activeAppsTotal,
      });
    }
  };

  useEffect(() => {
    document.title = USER_TAB_TITLES[activeTab] || "Workspace · VaultAuth SSO";
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const token = getToken();
      if (!token) {
        if (onNavigate) onNavigate("/login", { replace: true });
        else window.location.replace("/login");
        return;
      }
      try {
        await loadDashboardData();
      } catch (err) {
        if (err?.status === 401 || !active) {
          removeToken();
          if (active) {
            onNotify?.("Your session has expired. Please sign in again.", "info");
            if (onNavigate) onNavigate("/login", { replace: true });
            else window.location.replace("/login");
          }
          return;
        }
        onNotify?.(err?.message || "Failed to load dashboard telemetry.", "error");
      } finally {
        if (active) setAuthChecking(false);
      }
    }
    bootstrap();

    const syncSilently = () => {
      if (active && document.visibilityState === "visible" && getToken()) {
        loadDashboardData().catch(() => {});
      }
    };
    const timer = setInterval(syncSilently, 20000);
    window.addEventListener("focus", syncSilently);
    document.addEventListener("visibilitychange", syncSilently);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", syncSilently);
      document.removeEventListener("visibilitychange", syncSilently);
    };
  }, []);

  const handleSignOut = async () => {
    await apiLogout();
    onNotify?.("You have been signed out.", "info");
    if (onNavigate) {
      onNavigate("/login", { replace: true });
    } else {
      window.location.replace("/login");
    }
  };

  // Disconnect app handler
  const handleConfirmDisconnect = async () => {
    if (!disconnectModalApp) return;
    const targetApp = disconnectModalApp;
    try {
      await disconnectConnectedApp(targetApp.id);
      setApps((prev) =>
        prev.map((a) => (a.id === targetApp.id ? { ...a, isActive: false, status: "Disconnected" } : a))
      );
      onNotify?.(`Disconnected ${targetApp.name} from your account.`, "success");
      getDashboardOverview()
        .then((ov) =>
          setOverviewStats((prev) => ({
            ...prev,
            connectedAppsCount: ov?.connected_apps?.count ?? Math.max(0, prev.connectedAppsCount - 1),
          }))
        )
        .catch(() => {});
    } catch (err) {
      onNotify?.(err.message || `Failed to disconnect ${targetApp.name}.`, "error");
    } finally {
      setDisconnectModalApp(null);
    }
  };

  const handleReconnectApp = async (targetApp) => {
    try {
      await reconnectConnectedApp(targetApp.id);
      onNotify?.(`Reconnected ${targetApp.name}.`, "success");
      await loadDashboardData();
    } catch (err) {
      onNotify?.(err.message || `Failed to reconnect ${targetApp.name}.`, "error");
    }
  };

  // Revoke session handler
  const handleConfirmRevokeSession = async () => {
    if (!revokeModalSession) return;
    const targetSess = revokeModalSession;
    try {
      await revokeSessionById(targetSess.id);
      setSessions((prev) => prev.filter((s) => s.id !== targetSess.id));
      onNotify?.(`Session on ${targetSess.device} revoked successfully.`, "success");
      getDashboardOverview()
        .then((ov) =>
          setOverviewStats((prev) => ({
            ...prev,
            activeSessionsCount: ov?.active_sessions?.count ?? Math.max(0, prev.activeSessionsCount - 1),
          }))
        )
        .catch(() => {});
    } catch (err) {
      onNotify?.(err.message || "Failed to revoke session.", "error");
    } finally {
      setRevokeModalSession(null);
    }
  };

  const handleConfirmRevokeAll = async () => {
    try {
      const res = await revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      onNotify?.(res?.message || "All other remote device sessions have been revoked.", "success");
    } catch (err) {
      onNotify?.(err.message || "Failed to revoke other sessions.", "error");
    } finally {
      setRevokeAllModal(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdUpdating) return;
    setPwdError("");

    const policy = validateResetPasswordPolicy(newPwd);
    if (!policy.isValid) {
      setPwdError(`Password complexity: ${policy.errors.join(", ")}.`);
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setPwdError("New password and confirmation do not match.");
      return;
    }

    setPwdUpdating(true);
    try {
      const res = await changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
        confirmPassword: confirmNewPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmNewPwd("");
      onNotify?.(res?.message || "Password updated successfully.", "success");
      loadDashboardData().catch(() => {});
    } catch (err) {
      const msg = err.message || "Failed to update password.";
      setPwdError(msg);
      onNotify?.(msg, "error");
    } finally {
      setPwdUpdating(false);
    }
  };

  const handleTopbarSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const q = topbarSearch.trim().toLowerCase();
    if (!q) return;
    if (q.includes("app") || apps.some((a) => a.name.toLowerCase().includes(q))) {
      setAppsSearch(topbarSearch.trim());
      setActiveTab("apps");
    } else if (q.includes("pass") || q.includes("sec") || q.includes("mfa")) {
      setActiveTab("security");
    } else if (q.includes("device") || q.includes("sess")) {
      setActiveTab("devices");
    } else if (q.includes("profile")) {
      setActiveTab("profile");
    } else {
      setActivitySearch(topbarSearch.trim());
      setActiveTab("activity");
    }
  };

  const isAdminRole = String(currentUser.role || "").toLowerCase().includes("admin");
  const lastSignIn = activities[0];

  // Filtered Apps
  const filteredApps = apps.filter((app) => {
    const matchesCategory = appsFilter === "all" || app.category.toLowerCase().includes(appsFilter.toLowerCase());
    const matchesSearch = app.name.toLowerCase().includes(appsSearch.toLowerCase()) || app.desc.toLowerCase().includes(appsSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    const matchesStatus = activityStatusFilter === "all" || act.status.toLowerCase() === activityStatusFilter.toLowerCase();
    const matchesSearch =
      act.device.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.browser.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.location.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.ip.includes(activitySearch);
    return matchesStatus && matchesSearch;
  });

  if (authChecking && !currentUser.username) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: theme === "dark" ? "#000000" : "#f8fafc",
          color: theme === "dark" ? "#F7D794" : "#475569",
        }}
      >
        <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>Loading your VaultAuth workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" data-theme={theme}>
      {/* ========================================================
           1. SIDEBAR NAVIGATION
          ======================================================== */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-badge-row">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor"/>
                <circle cx="12" cy="10" r="2.2" fill="currentColor"/>
                <path d="M11 11.5L10 16H14L13 11.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor"/>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-title">VaultAuth<span className="brand-sso-accent">SSO</span></span>
                <span className="brand-subtitle">IDENTITY + ACCESS</span>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-menu-section">
          {!sidebarCollapsed && <span className="sidebar-section-title">WORKSPACE</span>}
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`nav-tab-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
              title="Overview"
            >
              <LayoutDashboard size={18} />
              {!sidebarCollapsed && <span>Overview</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "apps" ? "active" : ""}`}
              onClick={() => setActiveTab("apps")}
              title="Connected Apps"
            >
              <Grid size={18} />
              {!sidebarCollapsed && (
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <span>Connected apps</span>
                  <span className="nav-badge-pill">{apps.filter((a) => a.isActive).length}</span>
                </div>
              )}
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
              title="Login Activity"
            >
              <Clock size={18} />
              {!sidebarCollapsed && <span>Login activity</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "devices" ? "active" : ""}`}
              onClick={() => setActiveTab("devices")}
              title="Devices & Sessions"
            >
              <Laptop size={18} />
              {!sidebarCollapsed && <span>Devices &amp; Sessions</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
              title="Security Settings"
            >
              <ShieldCheck size={18} />
              {!sidebarCollapsed && <span>Security settings</span>}
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
              title="My Profile"
            >
              <User size={18} />
              {!sidebarCollapsed && <span>My profile</span>}
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`nav-tab-item ${activeTab === "help" ? "active" : ""}`}
            onClick={() => setActiveTab("help")}
            title="Help & Support"
          >
            <HelpCircle size={18} />
            {!sidebarCollapsed && <span>Help &amp; Support</span>}
          </button>

          <button
            type="button"
            className="nav-tab-item signout-item"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="sidebar-version-tag">
              <span>v2.4.0 • Zero Trust Core</span>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
           2. MAIN WORKSPACE AREA
          ======================================================== */}
      <div className="dashboard-main-area">
        {/* Top Navbar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn-icon sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Toggle sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="search-bar-wrap">
              <Search size={16} color="var(--ud-muted)" />
              <input
                type="text"
                placeholder="Search settings, apps, activity..."
                className="topbar-search-input"
                value={topbarSearch}
                onChange={(e) => setTopbarSearch(e.target.value)}
                onKeyDown={handleTopbarSearchKeyDown}
              />
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="ud-theme-toggle"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? <Sun size={15} color="#F7D794" /> : <Moon size={15} color="#475569" />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <button
              type="button"
              className="btn-icon bell-btn"
              title="Notifications"
              onClick={() => {
                const failedCount = activities.filter((a) => a.status !== "Success").length;
                onNotify?.(
                  failedCount > 0
                    ? `Security notice: ${failedCount} failed or blocked sign-in attempt(s) recorded.`
                    : "All security systems normal. No anomalous login activity detected.",
                  failedCount > 0 ? "info" : "success"
                );
              }}
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            {/* User Profile Pill */}
            <div className="user-profile-menu-wrap">
              <button
                type="button"
                className="user-profile-pill-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="user-avatar-initials">
                  {(currentUser.username || "AM").slice(0, 2).toUpperCase()}
                </div>
                <div className="user-pill-info">
                  <span className="user-pill-email">{currentUser.email || currentUser.username}</span>
                  <span className="user-pill-role">{currentUser.role || "End user"}</span>
                </div>
                <ChevronDown size={14} color="var(--ud-muted)" />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-popover">
                  <div className="popover-header">
                    <strong>{currentUser.full_name || currentUser.username}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="popover-divider" />
                  <button type="button" onClick={() => { setActiveTab("profile"); setUserDropdownOpen(false); }}>
                    <User size={14} /> My Profile
                  </button>
                  <button type="button" onClick={() => { setActiveTab("security"); setUserDropdownOpen(false); }}>
                    <ShieldCheck size={14} /> Security Settings
                  </button>
                  <button type="button" onClick={() => { toggleTheme(); setUserDropdownOpen(false); }}>
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </button>
                  {isAdminRole && (
                    <button type="button" onClick={() => onNavigate?.("/admin")}>
                      <Shield size={14} /> Admin Workspace
                    </button>
                  )}
                  <div className="popover-divider" />
                  <button type="button" className="text-danger" onClick={handleSignOut}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="dashboard-content-body">
          {/* ========================================================
               TAB: OVERVIEW
              ======================================================== */}
          {activeTab === "overview" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-welcome-banner">
                <h2>Good morning, {currentUser.full_name || currentUser.username} 👋</h2>
                <p>Here is your identity security health and activity summary for today.</p>
              </div>

              {/* 4 Stat Cards */}
              <div className="stats-cards-grid">
                <div className="stat-card" onClick={() => setActiveTab("devices")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Active sessions</span>
                    <div className="stat-icon-wrap stat-icon-accent">
                      <Laptop size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{sessions.length || overviewStats.activeSessionsCount} devices</h3>
                  <span className="stat-card-desc">Signed in across {sessions.length || overviewStats.activeSessionsCount} devices</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("security")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Security score</span>
                    <div className="stat-icon-wrap stat-icon-ok">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{overviewStats.securityScore} / 100</h3>
                  <span className="stat-card-desc" style={{ color: "var(--ud-ok-text)" }}>✓ {overviewStats.scoreDesc}</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("apps")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Connected apps</span>
                    <div className="stat-icon-wrap stat-icon-accent">
                      <Grid size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{apps.filter((a) => a.isActive).length} apps</h3>
                  <span className="stat-card-desc">Approved enterprise services</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("activity")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Last sign-in</span>
                    <div className="stat-icon-wrap stat-icon-accent">
                      <Clock size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{lastSignIn?.time || "Active now"}</h3>
                  <span className="stat-card-desc">From {lastSignIn?.location || "Workspace"}</span>
                </div>
              </div>

              {/* Two Column Split: Dynamic Height Activity Card & Checklist */}
              <div className="overview-split-grid">
                {/* Left: Dynamic Recent Login Activity Container */}
                <div className="content-card dynamic-activity-card">
                  <div className="card-header-row">
                    <div>
                      <h4 className="card-header-title">Recent Login Activity</h4>
                      <p className="card-header-sub">Dynamic log of your recent authentication events</p>
                    </div>
                    <button
                      type="button"
                      className="link-btn-text"
                      onClick={() => setActiveTab("activity")}
                    >
                      View all ({activities.length}) →
                    </button>
                  </div>

                  <div className="dynamic-activity-rows-list">
                    {activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="activity-row-item glass-hover">
                        <div className="activity-item-left">
                          <div className="device-avatar-circle">
                            {act.deviceType === "mobile" ? <Smartphone size={16} /> : <Monitor size={16} />}
                          </div>
                          <div className="activity-meta-col">
                            <span className="activity-device-name">{act.device}</span>
                            <span className="activity-sub-info">
                              {act.browser} • {act.location} • {act.ip}
                            </span>
                          </div>
                        </div>

                        <div className="activity-item-right">
                          <span className="activity-timestamp">{act.time}</span>
                          <span className={`status-badge status-${act.status.toLowerCase()}`}>
                            {act.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Security Checklist & Quick Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="content-card">
                    <h4 className="card-header-title" style={{ marginBottom: "14px" }}>
                      Security Checklist
                    </h4>
                    <div className="checklist-items-stack">
                      <div className="checklist-row">
                        <CheckCircle2 size={18} color="var(--ud-ok-text)" />
                        <div>
                          <strong>Password Health</strong>
                          <p>Updated 30 days ago (Strong score)</p>
                        </div>
                      </div>
                      <div className="checklist-row">
                        <CheckCircle2 size={18} color="var(--ud-ok-text)" />
                        <div>
                          <strong>Two-Factor Authentication</strong>
                          <p>Email OTP active</p>
                        </div>
                      </div>
                      <div className="checklist-row">
                        <CheckCircle2 size={18} color="var(--ud-ok-text)" />
                        <div>
                          <strong>Recovery Email</strong>
                          <p>Verified primary mailbox</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="content-card">
                    <h4 className="card-header-title" style={{ marginBottom: "14px" }}>
                      Quick Actions
                    </h4>
                    <div className="quick-actions-list">
                      <button
                        type="button"
                        className="quick-action-link"
                        onClick={() => setRevokeAllModal(true)}
                      >
                        <Shield size={16} />
                        <span>Sign out of all other devices</span>
                        <ArrowRight size={14} style={{ marginLeft: "auto" }} />
                      </button>
                      <button
                        type="button"
                        className="quick-action-link"
                        onClick={() => setActiveTab("security")}
                      >
                        <Key size={16} />
                        <span>Change account password</span>
                        <ArrowRight size={14} style={{ marginLeft: "auto" }} />
                      </button>
                      <button
                        type="button"
                        className="quick-action-link"
                        onClick={() => setActiveTab("apps")}
                      >
                        <Grid size={16} />
                        <span>Review connected applications</span>
                        <ArrowRight size={14} style={{ marginLeft: "auto" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: CONNECTED APPS
              ======================================================== */}
          {activeTab === "apps" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>Connected Applications</h2>
                  <p>Manage third-party enterprise services authenticated with your VaultAuthSSO ID.</p>
                </div>
                <span className="count-pill">{apps.length} connected</span>
              </div>

              {/* Filters & Search */}
              <div className="filter-controls-bar">
                <div className="search-bar-wrap" style={{ maxWidth: "340px" }}>
                  <Search size={16} color="var(--ud-muted)" />
                  <input
                    type="text"
                    placeholder="Search connected apps..."
                    value={appsSearch}
                    onChange={(e) => setAppsSearch(e.target.value)}
                    className="topbar-search-input"
                  />
                </div>

                <div className="category-filter-chips">
                  {["all", "productivity", "communication", "developer tools"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-chip-btn ${appsFilter === cat ? "active" : ""}`}
                      onClick={() => setAppsFilter(cat)}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apps List */}
              <div className="apps-cards-list">
                {filteredApps.length === 0 ? (
                  <div className="empty-state-card">
                    <Grid size={40} color="#94a3b8" />
                    <h4>No applications match your filter</h4>
                    <p>Try clearing your search query or selecting another category.</p>
                  </div>
                ) : (
                  filteredApps.map((app) => (
                    <div key={app.id} className="app-horizontal-card glass-hover">
                      <div className="app-card-left">
                        <div className="app-logo-box" style={{ backgroundColor: app.bg }}>
                          {app.logoText}
                        </div>
                        <div className="app-info-col">
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong>{app.name}</strong>
                            <span className="badge-category">{app.category}</span>
                          </div>
                          <p>{app.desc}</p>
                          <div className="app-meta-badges">
                            <span>Last used {app.lastUsed}</span>
                            <span>•</span>
                            <span>{app.loginCount || 1} sign-in(s)</span>
                            <span>•</span>
                            <span className="badge-perm-count">{app.permissions.length} permissions granted</span>
                          </div>
                        </div>
                      </div>

                      <div className="app-card-right">
                        <span className={`status-badge ${app.isActive ? "status-success" : "status-failed"}`}>
                          {app.isActive ? "Active" : "Disconnected"}
                        </span>
                        <div className="app-actions-group">
                          <button
                            type="button"
                            className="btn-outline-sm"
                            onClick={() => onNotify?.(`Permissions for ${app.name}: ${app.permissions.join(", ")}`, "info")}
                          >
                            Manage Access
                          </button>
                          {app.isActive ? (
                            <button
                              type="button"
                              className="btn-danger-sm"
                              onClick={() => setDisconnectModalApp(app)}
                            >
                              Disconnect
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-outline-sm"
                              onClick={() => handleReconnectApp(app)}
                            >
                              Reconnect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: LOGIN ACTIVITY
              ======================================================== */}
          {activeTab === "activity" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>Login Activity &amp; Audit</h2>
                  <p>Inspect sign-in timestamps, geolocation logs, and device security states.</p>
                </div>
              </div>

              {/* Table Controls */}
              <div className="filter-controls-bar">
                <div className="search-bar-wrap" style={{ maxWidth: "320px" }}>
                  <Search size={16} color="var(--ud-muted)" />
                  <input
                    type="text"
                    placeholder="Search by device, IP, or location..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="topbar-search-input"
                  />
                </div>

                <div className="category-filter-chips">
                  {["all", "success", "failed", "blocked"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-chip-btn ${activityStatusFilter === st ? "active" : ""}`}
                      onClick={() => setActivityStatusFilter(st)}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Table */}
              <div className="content-card table-card-wrap">
                <table className="enterprise-data-table">
                  <thead>
                    <tr>
                      <th>Device &amp; Hardware</th>
                      <th>Browser / Client</th>
                      <th>Location</th>
                      <th>Date &amp; Time</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act) => (
                      <tr key={act.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {act.deviceType === "mobile" ? <Smartphone size={16} color="var(--ud-text-2)" /> : <Monitor size={16} color="var(--ud-text-2)" />}
                            <strong>{act.device}</strong>
                          </div>
                        </td>
                        <td>{act.browser} ({act.os})</td>
                        <td>{act.location}</td>
                        <td style={{ color: "var(--ud-text-2)" }}>{act.time}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.86rem" }}>{act.ip}</td>
                        <td>
                          <span className={`status-badge status-${act.status.toLowerCase()}`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: DEVICES & SESSIONS
              ======================================================== */}
          {activeTab === "devices" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>Active Devices &amp; Sessions</h2>
                  <p>Devices currently authenticated to your VaultAuth SSO account.</p>
                </div>
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => setRevokeAllModal(true)}
                >
                  <Trash2 size={16} />
                  <span>Sign out of other devices</span>
                </button>
              </div>

              <div className="sessions-grid">
                {sessions.map((sess) => (
                  <div key={sess.id} className="content-card session-device-card glass-hover">
                    <div className="session-card-top">
                      <div className={`device-avatar-circle ${sess.isCurrent ? "current" : ""}`}>
                        {sess.deviceType === "mobile" ? <Smartphone size={20} /> : <Laptop size={20} />}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem" }}>{sess.device}</h4>
                        <span style={{ fontSize: "0.82rem", color: "var(--ud-text-2)" }}>{sess.browser} • {sess.os}</span>
                      </div>
                      {sess.isCurrent && <span className="status-badge status-success" style={{ marginLeft: "auto" }}>Current Device</span>}
                    </div>

                    <div className="session-card-body">
                      <div className="session-detail-line">
                        <span>IP Address:</span>
                        <code>{sess.ip}</code>
                      </div>
                      <div className="session-detail-line">
                        <span>Location:</span>
                        <strong>{sess.location}</strong>
                      </div>
                      <div className="session-detail-line">
                        <span>Activity:</span>
                        <span>{sess.lastActive}</span>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <div className="session-card-bottom">
                        <button
                          type="button"
                          className="btn-danger-sm"
                          style={{ width: "100%" }}
                          onClick={() => setRevokeModalSession(sess)}
                        >
                          Revoke Session
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: SECURITY SETTINGS
              ======================================================== */}
          {activeTab === "security" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>Security Settings</h2>
                  <p>Manage your password, multi-factor credentials, and authentication policies.</p>
                </div>
              </div>

              {/* ── Change Password ── */}
              <div className="content-card" style={{ maxWidth: "680px", marginBottom: "24px" }}>
                <h4 className="card-header-title" style={{ marginBottom: "18px" }}>
                  Change Account Password
                </h4>
                <form
                  onSubmit={handleChangePassword}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div className="form-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPwd}
                      onChange={(e) => { setCurrentPwd(e.target.value); setPwdError(""); }}
                      required
                      className="modal-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Min 8 chars (upper, lower, number, symbol)"
                      value={newPwd}
                      onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); }}
                      required
                      className="modal-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmNewPwd}
                      onChange={(e) => { setConfirmNewPwd(e.target.value); setPwdError(""); }}
                      required
                      className="modal-input"
                    />
                  </div>
                  {pwdError && (
                    <p style={{ color: "#dc2626", fontSize: "0.84rem", margin: 0, fontWeight: 500 }} role="alert">
                      {pwdError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={pwdUpdating}
                    className="btn-brand-primary"
                    style={{ alignSelf: "flex-start", marginTop: "8px" }}
                  >
                    {pwdUpdating ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: MY PROFILE
              ======================================================== */}
          {activeTab === "profile" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>User Profile</h2>
                  <p>Your identity directory attributes and organization membership details.</p>
                </div>
              </div>

              <div className="content-card" style={{ maxWidth: "680px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
                  <div className="profile-large-avatar">
                    {(currentUser.username || "AM").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>{currentUser.full_name || currentUser.username}</h3>
                    <p style={{ margin: "0 0 8px", color: "var(--ud-text-2)" }}>{currentUser.email}</p>
                    <span className="badge-role-pill">{currentUser.role || "End user"}</span>
                  </div>
                </div>

                <div className="profile-attributes-grid">
                  <div className="attr-item">
                    <span>Username:</span>
                    <strong>{currentUser.username}</strong>
                  </div>
                  <div className="attr-item">
                    <span>Department:</span>
                    <strong>Engineering / Security</strong>
                  </div>
                  <div className="attr-item">
                    <span>Account Status:</span>
                    <strong style={{ color: "var(--ud-ok-text)" }}>Active &amp; Compliant</strong>
                  </div>
                  <div className="attr-item">
                    <span>Directory Provider:</span>
                    <strong>VaultAuth Internal Directory</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
               TAB: HELP & SUPPORT
              ======================================================== */}
          {activeTab === "help" && (
            <div className="page-view-wrapper animate-fade-in">
              <div className="page-title-row">
                <div>
                  <h2>Help &amp; Enterprise Support</h2>
                  <p>Frequently asked questions and IT security contact assistance.</p>
                </div>
              </div>

              <div className="content-card" style={{ maxWidth: "720px" }}>
                <h4 className="card-header-title" style={{ marginBottom: "16px" }}>
                  Common Questions
                </h4>
                <div className="faq-stack">
                  <div className="faq-item-box">
                    <strong>How do I connect a new third-party application?</strong>
                    <p>Navigate to Connected Apps and select from approved SSO catalog integrations, or contact your workspace admin.</p>
                  </div>
                  <div className="faq-item-box">
                    <strong>What should I do if I notice an unfamiliar device session?</strong>
                    <p>Immediately open Devices &amp; Sessions and click "Revoke Session" or "Sign out of all other devices", then update your password.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Disconnect App Confirmation Modal */}
      {disconnectModalApp && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Disconnect {disconnectModalApp.name}?</h3>
            <p style={{ margin: "14px 0 20px", color: "var(--ud-text-2)" }}>
              Are you sure you want to revoke {disconnectModalApp.name}'s SSO connection? You will need to re-authenticate next time you access this service.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-modal-cancel" onClick={() => setDisconnectModalApp(null)}>
                Cancel
              </button>
              <button type="button" className="btn-modal-danger" onClick={handleConfirmDisconnect}>
                Disconnect App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Session Confirmation Modal */}
      {revokeModalSession && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Revoke Device Session?</h3>
            <p style={{ margin: "14px 0 20px", color: "var(--ud-text-2)" }}>
              This will immediately terminate the authentication session on <strong>{revokeModalSession.device}</strong> ({revokeModalSession.ip}).
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-modal-cancel" onClick={() => setRevokeModalSession(null)}>
                Cancel
              </button>
              <button type="button" className="btn-modal-danger" onClick={handleConfirmRevokeSession}>
                Revoke Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke All Sessions Confirmation Modal */}
      {revokeAllModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Sign Out of All Other Devices?</h3>
            <p style={{ margin: "14px 0 20px", color: "var(--ud-text-2)" }}>
              All remote sessions will be terminated immediately. Only this current browser device will remain signed in.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-modal-cancel" onClick={() => setRevokeAllModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-modal-danger" onClick={handleConfirmRevokeAll}>
                Sign Out Others
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
