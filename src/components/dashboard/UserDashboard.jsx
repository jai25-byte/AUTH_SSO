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
} from "lucide-react";
import { getStoredUser, removeToken } from "../../services/api.js";

// Sample Data Stores
const INITIAL_APPS = [
  {
    id: 1,
    name: "Google Workspace",
    desc: "Gmail, Google Drive, Docs and Enterprise Calendar",
    category: "Productivity",
    logoText: "G",
    bg: "#4285F4",
    permissions: ["Read email", "Calendar access", "Drive read"],
    status: "Active",
    connectedDate: "Jan 10, 2025",
  },
  {
    id: 2,
    name: "Slack",
    desc: "Team messaging and incident alerting",
    category: "Communication",
    logoText: "S",
    bg: "#5865F2",
    permissions: ["Send messages", "Read channels"],
    status: "Active",
    connectedDate: "Feb 02, 2025",
  },
  {
    id: 3,
    name: "Jira Software",
    desc: "Agile project tracking and sprint planning",
    category: "Productivity",
    logoText: "J",
    bg: "#0052CC",
    permissions: ["Read issues", "Create issues"],
    status: "Active",
    connectedDate: "Mar 18, 2025",
  },
  {
    id: 4,
    name: "GitHub",
    desc: "Code repositories and CI/CD developer workflows",
    category: "Developer Tools",
    logoText: "GH",
    bg: "#181717",
    permissions: ["Repo read", "Repo write", "Webhooks"],
    status: "Active",
    connectedDate: "Apr 22, 2025",
  },
  {
    id: 5,
    name: "Notion Enterprise",
    desc: "Internal documentation, knowledge base & roadmaps",
    category: "Productivity",
    logoText: "N",
    bg: "#000000",
    permissions: ["Read workspace", "Edit docs"],
    status: "Active",
    connectedDate: "May 05, 2025",
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    device: 'MacBook Pro 16"',
    deviceType: "laptop",
    browser: "Chrome 131",
    os: "macOS Sequoia",
    location: "Bengaluru, India",
    time: "Today, 9:42 AM",
    ip: "103.21.58.xx",
    status: "Success",
  },
  {
    id: "act-2",
    device: "Samsung Galaxy S25 Ultra",
    deviceType: "mobile",
    browser: "VaultAuth mobile",
    os: "Android 15",
    location: "Bengaluru, India",
    time: "Today, 8:16 AM",
    ip: "103.21.58.xx",
    status: "Success",
  },
  {
    id: "act-3",
    device: "Chrome on Windows",
    deviceType: "desktop",
    browser: "Chrome 131",
    os: "Windows 11",
    location: "Bengaluru, India",
    time: "Yesterday, 6:32 PM",
    ip: "49.37.12.xx",
    status: "Success",
  },
  {
    id: "act-4",
    device: "Unknown Device",
    deviceType: "desktop",
    browser: "Firefox 132",
    os: "Linux x86_64",
    location: "Mumbai, India",
    time: "Nov 9, 4:15 PM",
    ip: "152.58.44.xx",
    status: "Failed",
  },
  {
    id: "act-5",
    device: 'MacBook Pro 16"',
    deviceType: "laptop",
    browser: "Chrome 131",
    os: "macOS Sequoia",
    location: "Bengaluru, India",
    time: "Nov 9, 9:10 AM",
    ip: "103.21.58.xx",
    status: "Success",
  },
  {
    id: "act-6",
    device: "Samsung Galaxy S25 Ultra",
    deviceType: "mobile",
    browser: "VaultAuth mobile",
    os: "Android 15",
    location: "Bengaluru, India",
    time: "Nov 8, 7:30 PM",
    ip: "103.21.58.xx",
    status: "Success",
  },
  {
    id: "act-7",
    device: "Unknown Device",
    deviceType: "desktop",
    browser: "Safari 18",
    os: "iOS 18.1",
    location: "New Delhi, India",
    time: "Nov 7, 2:45 AM",
    ip: "203.122.1.xx",
    status: "Blocked",
  },
];

const INITIAL_SESSIONS = [
  {
    id: "sess-1",
    device: 'MacBook Pro 16"',
    deviceType: "laptop",
    browser: "Chrome 131",
    os: "macOS Sequoia",
    ip: "103.21.58.42",
    location: "Bengaluru, India",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "sess-2",
    device: "Samsung Galaxy S25 Ultra",
    deviceType: "mobile",
    browser: "VaultAuth mobile app",
    os: "Android 15",
    ip: "103.21.58.42",
    location: "Bengaluru, India",
    lastActive: "18 minutes ago",
    isCurrent: false,
  },
  {
    id: "sess-3",
    device: "Chrome on Windows",
    deviceType: "desktop",
    browser: "Chrome 131",
    os: "Windows 11",
    ip: "49.37.12.86",
    location: "Bengaluru, India",
    lastActive: "Yesterday",
    isCurrent: false,
  },
];

export default function UserDashboard({ onNavigate, onNotify }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // User details
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser() || {
      username: "amitoj0024",
      email: "amitoj0024@gmail.com",
      full_name: "Amitoj Singh",
      role: "End user",
    };
  });

  // Data states
  const [apps, setApps] = useState(INITIAL_APPS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  // Filters
  const [appsFilter, setAppsFilter] = useState("all");
  const [appsSearch, setAppsSearch] = useState("");
  const [activityStatusFilter, setActivityStatusFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");

  // Modals
  const [disconnectModalApp, setDisconnectModalApp] = useState(null);
  const [revokeModalSession, setRevokeModalSession] = useState(null);
  const [revokeAllModal, setRevokeAllModal] = useState(false);

  const handleSignOut = () => {
    removeToken();
    onNotify?.("You have been signed out.", "info");
    if (onNavigate) {
      onNavigate("/login");
    } else {
      window.location.href = "/login";
    }
  };

  // Disconnect app handler
  const handleConfirmDisconnect = () => {
    if (!disconnectModalApp) return;
    setApps(apps.filter((a) => a.id !== disconnectModalApp.id));
    onNotify?.(`Disconnected ${disconnectModalApp.name} from your account.`, "success");
    setDisconnectModalApp(null);
  };

  // Revoke session handler
  const handleConfirmRevokeSession = () => {
    if (!revokeModalSession) return;
    setSessions(sessions.filter((s) => s.id !== revokeModalSession.id));
    onNotify?.(`Session on ${revokeModalSession.device} revoked successfully.`, "success");
    setRevokeModalSession(null);
  };

  const handleConfirmRevokeAll = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    onNotify?.("All other remote device sessions have been revoked.", "success");
    setRevokeAllModal(false);
  };

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

  return (
    <div className="dashboard-container">
      {/* ========================================================
           1. SIDEBAR NAVIGATION
          ======================================================== */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-badge-row">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="#fff" strokeWidth="2.2">
                <path d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z" fill="#7047eb" fillOpacity="0.4" stroke="#fff"/>
                <circle cx="12" cy="10" r="2.2" fill="#fff"/>
                <path d="M11 11.5L10 16H14L13 11.5" stroke="#fff" strokeWidth="1.8" fill="#fff"/>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-title">VaultAuth<span style={{ color: "#7047eb" }}>SSO</span></span>
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
                  <span className="nav-badge-pill">{apps.length}</span>
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
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search settings, apps, activity..."
                className="topbar-search-input"
              />
            </div>
          </div>

          <div className="topbar-right">
            <div className="telemetry-badge">
              <span className="telemetry-dot" />
              <span>All Systems Normal</span>
            </div>

            <button type="button" className="btn-icon bell-btn" title="Notifications">
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
                <ChevronDown size={14} color="#64748b" />
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
                  {currentUser.role === "admin" && (
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
                    <div className="stat-icon-wrap" style={{ background: "rgba(112, 71, 235, 0.1)", color: "#7047eb" }}>
                      <Laptop size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{sessions.length} devices</h3>
                  <span className="stat-card-desc">Signed in across {sessions.length} devices</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("security")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Security score</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">94 / 100</h3>
                  <span className="stat-card-desc" style={{ color: "#10b981" }}>✓ Account well protected</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("apps")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Connected apps</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.1)", color: "#0284c7" }}>
                      <Grid size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">{apps.length} apps</h3>
                  <span className="stat-card-desc">Approved enterprise services</span>
                </div>

                <div className="stat-card" onClick={() => setActiveTab("activity")}>
                  <div className="stat-card-header">
                    <span className="stat-card-label">Last sign-in</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <h3 className="stat-card-value">Today, 9:42 AM</h3>
                  <span className="stat-card-desc">From Bengaluru, India</span>
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
                        <CheckCircle2 size={18} color="#10b981" />
                        <div>
                          <strong>Password Health</strong>
                          <p>Updated 30 days ago (Strong score)</p>
                        </div>
                      </div>
                      <div className="checklist-row">
                        <CheckCircle2 size={18} color="#10b981" />
                        <div>
                          <strong>Two-Factor Authentication</strong>
                          <p>Email OTP &amp; Biometric Passkey active</p>
                        </div>
                      </div>
                      <div className="checklist-row">
                        <CheckCircle2 size={18} color="#10b981" />
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
                  <Search size={16} color="#94a3b8" />
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
                            <span>Connected {app.connectedDate}</span>
                            <span>•</span>
                            <span className="badge-perm-count">{app.permissions.length} permissions granted</span>
                          </div>
                        </div>
                      </div>

                      <div className="app-card-right">
                        <span className="status-badge status-success">Active</span>
                        <div className="app-actions-group">
                          <button
                            type="button"
                            className="btn-outline-sm"
                            onClick={() => onNotify?.(`Permissions for ${app.name}: ${app.permissions.join(", ")}`, "info")}
                          >
                            Manage Access
                          </button>
                          <button
                            type="button"
                            className="btn-danger-sm"
                            onClick={() => setDisconnectModalApp(app)}
                          >
                            Disconnect
                          </button>
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
                  <Search size={16} color="#94a3b8" />
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
                            {act.deviceType === "mobile" ? <Smartphone size={16} color="#64748b" /> : <Monitor size={16} color="#64748b" />}
                            <strong>{act.device}</strong>
                          </div>
                        </td>
                        <td>{act.browser} ({act.os})</td>
                        <td>{act.location}</td>
                        <td style={{ color: "#64748b" }}>{act.time}</td>
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
                      <div className="device-avatar-circle" style={{ background: sess.isCurrent ? "rgba(112, 71, 235, 0.15)" : "#f1f5f9" }}>
                        {sess.deviceType === "mobile" ? <Smartphone size={20} color={sess.isCurrent ? "#7047eb" : "#64748b"} /> : <Laptop size={20} color={sess.isCurrent ? "#7047eb" : "#64748b"} />}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem" }}>{sess.device}</h4>
                        <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{sess.browser} • {sess.os}</span>
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

              <div className="content-card" style={{ maxWidth: "680px", marginBottom: "24px" }}>
                <h4 className="card-header-title" style={{ marginBottom: "18px" }}>
                  Change Account Password
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onNotify?.("Password updated successfully across all sessions.", "success");
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div className="form-field">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" required className="modal-input" />
                  </div>
                  <div className="form-field">
                    <label>New Password</label>
                    <input type="password" placeholder="Minimum 8 characters" required className="modal-input" />
                  </div>
                  <div className="form-field">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="Re-enter new password" required className="modal-input" />
                  </div>
                  <button type="submit" className="btn-brand-primary" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
                    Update Password
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
                    <p style={{ margin: "0 0 8px", color: "#64748b" }}>{currentUser.email}</p>
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
                    <strong style={{ color: "#10b981" }}>Active &amp; Compliant</strong>
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
                  <div className="faq-item-box">
                    <strong>How do Passkeys work on VaultAuthSSO?</strong>
                    <p>Passkeys use FIDO2/WebAuthn public-key cryptography tied to your laptop TouchID, FaceID, or hardware security key.</p>
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
            <p style={{ margin: "14px 0 20px", color: "#64748b" }}>
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
            <p style={{ margin: "14px 0 20px", color: "#64748b" }}>
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
            <p style={{ margin: "14px 0 20px", color: "#64748b" }}>
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
