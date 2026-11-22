/**
 * VaultAuth SSO — Admin Dashboard Controller
 *
 * Full-featured controller powering all Admin pages:
 * Overview, Users, Roles & Permissions, Sessions, Applications,
 * Security Activity, and Admin Settings.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  //  1. Configuration & Data Stores
  // ---------------------------------------------------------------------------

  const API_BASE = (() => {
    const { port } = window.location;
    if (port === "5000" || port === "3000") return "";
    return "http://127.0.0.1:5000";
  })();

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("token");
    if (fromUrl) {
      localStorage.setItem("vault_auth_token", fromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
      return fromUrl;
    }
    return localStorage.getItem("vault_auth_token") || null;
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem("vault_auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // --- Initial Data Stores ---

  let usersData = [
    { id: 1, name: "Amitoj Singh", email: "amitoj@decisions.com", role: "Administrator", status: "Active", mfa: "Enforced", dept: "Engineering", location: "Bengaluru, IN", lastActive: "Just now", initials: "AS", bg: "#1e3a5f" },
    { id: 2, name: "Sarah Wilson", email: "sarah@decisions.com", role: "Administrator", status: "Active", mfa: "Enforced", dept: "Security", location: "London, UK", lastActive: "2 min ago", initials: "SW", bg: "#374151" },
    { id: 3, name: "James Miller", email: "james@decisions.com", role: "DevOps", status: "Active", mfa: "Enabled", dept: "Infrastructure", location: "Amsterdam, NL", lastActive: "8 min ago", initials: "JM", bg: "#d97706" },
    { id: 4, name: "Priya Sharma", email: "priya@decisions.com", role: "Member", status: "Active", mfa: "Enabled", dept: "Product", location: "Bengaluru, IN", lastActive: "12 min ago", initials: "PS", bg: "#7c3aed" },
    { id: 5, name: "David Kim", email: "david.kim@decisions.com", role: "Security Lead", status: "Active", mfa: "Enforced", dept: "SecOps", location: "San Francisco, US", lastActive: "35 min ago", initials: "DK", bg: "#2563eb" },
    { id: 6, name: "Elena Rostova", email: "elena.r@decisions.com", role: "Member", status: "Suspended", mfa: "Not set", dept: "Marketing", location: "Berlin, DE", lastActive: "3 days ago", initials: "ER", bg: "#dc2626" },
    { id: 7, name: "Marcus Vance", email: "marcus@decisions.com", role: "DevOps", status: "Active", mfa: "Enabled", dept: "Cloud Eng", location: "Austin, US", lastActive: "1 hour ago", initials: "MV", bg: "#0d9488" },
    { id: 8, name: "Chloe Bennett", email: "chloe.b@decisions.com", role: "Member", status: "Invited", mfa: "Pending", dept: "People Ops", location: "Toronto, CA", lastActive: "Never", initials: "CB", bg: "#6b7280" }
  ];

  let rolesData = [
    {
      id: "admin",
      name: "Administrator",
      usersCount: 12,
      desc: "Full workspace root authority. Manage users, applications, system policies and security credentials.",
      badge: "Full Access",
      badgeClass: "badge-success"
    },
    {
      id: "security",
      name: "Security Lead",
      usersCount: 6,
      desc: "Security audit investigator. Access to real-time session revocations, IP rate limiting, and SIEM logs.",
      badge: "Security Core",
      badgeClass: "badge-good"
    },
    {
      id: "devops",
      name: "DevOps",
      usersCount: 18,
      desc: "Cloud infrastructure manager. Access to OAuth client secrets, API integrations and SAML federations.",
      badge: "Integration Lead",
      badgeClass: "badge-good"
    },
    {
      id: "member",
      name: "Member",
      usersCount: 1244,
      desc: "Default employee access. Authenticates to approved SSO applications with personal identity dashboard.",
      badge: "Standard",
      badgeClass: "badge-good"
    }
  ];

  let matrixPermissions = {
    "Administrator": {
      "Users & Directory": [true, true, true, true, true],
      "Active Sessions": [true, false, true, true, true],
      "Connected Applications": [true, true, true, true, true],
      "Security Audit Logs": [true, false, false, false, true],
      "System Policies": [true, true, true, true, true]
    },
    "Security Lead": {
      "Users & Directory": [true, false, false, false, true],
      "Active Sessions": [true, false, true, true, true],
      "Connected Applications": [true, false, false, false, false],
      "Security Audit Logs": [true, true, true, false, true],
      "System Policies": [true, false, true, false, false]
    },
    "DevOps": {
      "Users & Directory": [true, false, false, false, false],
      "Active Sessions": [true, false, false, false, false],
      "Connected Applications": [true, true, true, true, true],
      "Security Audit Logs": [true, false, false, false, false],
      "System Policies": [true, false, true, false, false]
    },
    "Member": {
      "Users & Directory": [false, false, false, false, false],
      "Active Sessions": [true, false, false, false, false],
      "Connected Applications": [true, false, false, false, false],
      "Security Audit Logs": [false, false, false, false, false],
      "System Policies": [false, false, false, false, false]
    },
    "Auditor": {
      "Users & Directory": [true, false, false, false, false],
      "Active Sessions": [true, false, false, false, false],
      "Connected Applications": [true, false, false, false, false],
      "Security Audit Logs": [true, false, false, false, false],
      "System Policies": [true, false, false, false, false]
    }
  };

  let sessionsData = [
    { id: 1, userName: "Amitoj Singh", email: "amitoj@decisions.com", device: "MacBook Pro", platform: "Chrome 131 · macOS", ip: "103.21.58.42", location: "Bengaluru, India", started: "Today, 9:00 AM", lastActive: "Just now", status: "Current", isSuspicious: false },
    { id: 2, userName: "Sarah Wilson", email: "sarah@decisions.com", device: "Windows PC", platform: "Edge 130 · Windows 11", ip: "49.37.12.86", location: "London, UK", started: "Today, 7:15 AM", lastActive: "2 min ago", status: "Active", isSuspicious: false },
    { id: 3, userName: "James Miller", email: "james@decisions.com", device: "Unknown device", platform: "Firefox 132 · Linux", ip: "185.220.101.7", location: "Amsterdam, NL", started: "Today, 8:40 AM", lastActive: "8 min ago", status: "Suspicious", isSuspicious: true },
    { id: 4, userName: "Priya Sharma", email: "priya@decisions.com", device: "iPhone 16", platform: "Safari 18 · iOS", ip: "103.21.58.91", location: "Bengaluru, India", started: "Today, 8:20 AM", lastActive: "12 min ago", status: "Active", isSuspicious: false },
    { id: 5, userName: "David Kim", email: "david.kim@decisions.com", device: "MacBook Air", platform: "Chrome 130 · macOS", ip: "73.189.44.12", location: "San Francisco, US", started: "Yesterday, 11:00 PM", lastActive: "35 min ago", status: "Active", isSuspicious: false },
    { id: 6, userName: "Marcus Vance", email: "marcus@decisions.com", device: "Ubuntu Workstation", platform: "Chrome 131 · Linux", ip: "108.62.8.19", location: "Austin, US", started: "Today, 6:00 AM", lastActive: "1 hour ago", status: "Active", isSuspicious: false }
  ];

  let appsData = [
    { id: "github", name: "GitHub", desc: "Code repositories & CI/CD developer workflows", category: "Developer Tools", protocol: "OAuth 2.0", users: 184, active: true, color: "#181717", badgeChar: "GH" },
    { id: "gworkspace", name: "Google Workspace", desc: "Gmail, Google Drive, Docs and enterprise calendar", category: "Productivity", protocol: "SAML 2.0", users: 932, active: true, color: "#1a73e8", badgeChar: "GW" },
    { id: "aws", name: "AWS Management Console", desc: "Cloud infrastructure identity federation (IAM)", category: "Cloud Hosting", protocol: "OIDC", users: 48, active: false, color: "#ff9900", badgeChar: "AWS" },
    { id: "slack", name: "Slack", desc: "Real-time team messaging & incident alerting bots", category: "Communication", protocol: "OAuth 2.0", users: 610, active: true, color: "#4a154b", badgeChar: "SL" },
    { id: "jira", name: "Jira Software", desc: "Agile issue tracking and sprint planning", category: "Productivity", protocol: "OAuth 2.0", users: 420, active: true, color: "#0052cc", badgeChar: "JI" },
    { id: "figma", name: "Figma Enterprise", desc: "Collaborative interface design & design system libraries", category: "Design", protocol: "SAML 2.0", users: 85, active: true, color: "#f24e1e", badgeChar: "FG" },
    { id: "datadog", name: "Datadog Monitoring", desc: "Audit trail log telemetry and security event streaming", category: "Security", protocol: "API Token", users: 12, active: true, color: "#632ca6", badgeChar: "DD" },
    { id: "cloudflare", name: "Cloudflare Zero Trust", desc: "Network edge access control and tunnel security", category: "Security", protocol: "OIDC", users: 210, active: true, color: "#f38020", badgeChar: "CF" }
  ];

  let securityLogsData = [
    { id: 101, event: "New administrator role assigned", initiator: "Amitoj Singh", target: "Sarah Wilson", ip: "103.21.58.42", location: "Bengaluru, IN", severity: "Success", time: "2 min ago", payload: { action: "role.assign", actor: "amitoj@decisions.com", target: "sarah@decisions.com", previous_role: "Security Lead", new_role: "Administrator", timestamp: "2026-11-22T17:42:10Z" } },
    { id: 102, event: "Suspicious sign-in detected", initiator: "James Miller", target: "VaultAuth SSO", ip: "185.220.101.7", location: "Amsterdam, NL", severity: "Critical", time: "8 min ago", payload: { action: "auth.flagged", reason: "Anomalous geographic distance + Tor exit node IP", user: "james@decisions.com", risk_score: 94, recommended_action: "immediate_revoke" } },
    { id: 103, event: "OAuth application credentials rotated", initiator: "Marcus Vance", target: "GitHub Integration", ip: "108.62.8.19", location: "Austin, US", severity: "Success", time: "24 min ago", payload: { action: "oauth.token_rotation", client_id: "gh_live_sec_9942", rotated_by: "marcus@decisions.com" } },
    { id: 104, event: "Password policy updated", initiator: "Amitoj Singh", target: "Tenant Policy", ip: "103.21.58.42", location: "Bengaluru, IN", severity: "Success", time: "1 hour ago", payload: { action: "policy.update", min_length: 12, special_char: true, lockout_threshold: 5 } },
    { id: 105, event: "Brute-force login attack mitigated", initiator: "System Guard", target: "Auth Gateway", ip: "152.58.44.19", location: "Mumbai, IN", severity: "Warning", time: "2 hours ago", payload: { action: "rate_limit.block", attempts: 18, window_seconds: 60, status: "IP banned for 24h" } },
    { id: 106, event: "MFA challenge completed via Email OTP", initiator: "Priya Sharma", target: "VaultAuth", ip: "103.21.58.91", location: "Bengaluru, IN", severity: "Success", time: "3 hours ago", payload: { action: "mfa.verify", user: "priya@decisions.com", method: "Email OTP", result: "authorized" } }
  ];


  // ---------------------------------------------------------------------------
  //  2. Toast Notifications
  // ---------------------------------------------------------------------------

  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;

    const icon = type === "success"
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`
      : type === "error"
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }


  // ---------------------------------------------------------------------------
  //  3. Page Navigation & Mobile Menu
  // ---------------------------------------------------------------------------

  function switchPage(pageId) {
    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.style.display = "block";
    }

    document.querySelectorAll(".nav-item").forEach((link) => {
      link.classList.toggle("active", link.dataset.page === pageId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Sidebar links
  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (link.dataset.page) switchPage(link.dataset.page);
    });
  });

  // Cross-page data-goto links
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto]");
    if (trigger) {
      e.preventDefault();
      switchPage(trigger.dataset.goto);
    }
  });

  // Mobile hamburger
  const mobileBtn = document.querySelector(".mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
  }

  // Global Search (Cmd+K / typing in top search)
  const globalSearch = document.getElementById("global-search-input");
  if (globalSearch) {
    globalSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = globalSearch.value.trim().toLowerCase();
        if (!query) return;
        // Smart navigation based on search term
        if (query.includes("user") || query.includes("alex") || query.includes("sarah") || query.includes("amitoj")) {
          switchPage("users");
          const uInput = document.getElementById("users-filter-search");
          if (uInput) { uInput.value = query; renderUsers(); }
        } else if (query.includes("session") || query.includes("device") || query.includes("mac") || query.includes("ip")) {
          switchPage("sessions");
        } else if (query.includes("app") || query.includes("git") || query.includes("aws") || query.includes("slack")) {
          switchPage("applications");
        } else if (query.includes("role") || query.includes("perm")) {
          switchPage("roles");
        } else if (query.includes("audit") || query.includes("log") || query.includes("sec")) {
          switchPage("security");
        } else if (query.includes("setting") || query.includes("policy") || query.includes("pass")) {
          switchPage("settings");
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        globalSearch.focus();
      }
    });
  }


  // ---------------------------------------------------------------------------
  //  4. Page: Overview Renderer
  // ---------------------------------------------------------------------------

  function renderOverview() {
    // 1. Overview sessions preview table
    const overviewSessionsTbody = document.getElementById("overview-sessions-tbody");
    if (overviewSessionsTbody) {
      overviewSessionsTbody.innerHTML = sessionsData.slice(0, 4).map(s => `
        <tr>
          <td>
            <div class="user-cell">
              <span class="user-cell-name">${s.userName}</span>
              <span class="user-cell-email">${s.email}</span>
            </div>
          </td>
          <td>
            <div class="device-cell">${s.device}<br><span class="device-sub">${s.platform}</span></div>
          </td>
          <td>
            <div class="ip-cell">${s.ip}<br><span class="ip-sub">${s.location}</span></div>
          </td>
          <td>${s.lastActive}</td>
          <td><span class="status-pill ${s.status.toLowerCase()}">${s.status}</span></td>
          <td>${s.status === "Current" ? '<span class="action-dash">—</span>' : `<button class="btn-revoke" data-session-id="${s.id}">Revoke</button>`}</td>
        </tr>
      `).join("");
    }

    // 2. Overview apps preview list
    const overviewAppsList = document.getElementById("overview-apps-list");
    if (overviewAppsList) {
      overviewAppsList.innerHTML = appsData.slice(0, 3).map(app => `
        <div class="app-item">
          <div class="app-info">
            <div class="app-icon-circle" style="background:${app.color}"><span>${app.badgeChar}</span></div>
            <div>
              <span class="app-item-name">${app.name}</span>
              <span class="app-item-desc">${app.users} connected users</span>
            </div>
          </div>
          <div class="app-controls">
            <label class="toggle ${app.active ? 'active' : 'inactive'}">
              <input type="checkbox" class="toggle-app-switch" data-app-id="${app.id}" ${app.active ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span class="app-status-text ${app.active ? 'active' : 'inactive'}">${app.active ? 'Active' : 'Inactive'}</span>
            <a href="#" class="manage-link" data-goto="applications">Manage →</a>
          </div>
        </div>
      `).join("");
    }
  }


  // ---------------------------------------------------------------------------
  //  5. Page: Users Directory Renderer & Interactions
  // ---------------------------------------------------------------------------

  let currentUsersFilter = "all";
  let currentUsersRole = "all";

  function renderUsers() {
    const tbody = document.getElementById("users-table-tbody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("users-filter-search")?.value || "").toLowerCase().trim();

    const filtered = usersData.filter(u => {
      const matchFilter = currentUsersFilter === "all" || u.status === currentUsersFilter;
      const matchRole = currentUsersRole === "all" || u.role === currentUsersRole;
      const matchSearch = !searchTerm ||
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        u.role.toLowerCase().includes(searchTerm) ||
        u.dept.toLowerCase().includes(searchTerm);
      return matchFilter && matchRole && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No users found matching current filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const statusClass = u.status === "Active" ? "badge-success" : u.status === "Suspended" ? "badge-failed" : "badge-good";
      const mfaClass = u.mfa === "Enforced" ? "highlight" : "";

      return `
        <tr>
          <td>
            <div class="user-cell-flex">
              <div class="mini-avatar" style="background:${u.bg}">${u.initials}</div>
              <div class="user-cell-meta">
                <span class="user-cell-title">${u.name}</span>
                <span class="user-cell-sub">${u.email}</span>
              </div>
            </div>
          </td>
          <td><span class="role-pill ${u.role === 'Member' ? 'member' : ''}">${u.role}</span></td>
          <td><span class="badge ${statusClass}">● ${u.status}</span></td>
          <td><span class="setting-val ${mfaClass}">${u.mfa}</span></td>
          <td>${u.dept}</td>
          <td>${u.lastActive}</td>
          <td style="text-align: right;">
            <div style="display:inline-flex;gap:6px;">
              <button class="btn btn-outline btn-xs btn-edit-user-role" data-user-id="${u.id}">Role</button>
              <button class="btn btn-outline btn-xs ${u.status === 'Suspended' ? 'btn-activate-user' : 'btn-suspend-user'}" data-user-id="${u.id}">
                ${u.status === 'Suspended' ? 'Activate' : 'Suspend'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    const pageMeta = document.getElementById("users-page-meta");
    if (pageMeta) {
      pageMeta.textContent = `Showing 1 - ${filtered.length} of ${usersData.length} users`;
    }
  }

  // Users filter tabs
  document.querySelectorAll("#users-filter-tabs .filter-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#users-filter-tabs .filter-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentUsersFilter = this.dataset.userFilter;
      renderUsers();
    });
  });

  // Users role select
  const roleSelect = document.getElementById("users-role-select");
  if (roleSelect) {
    roleSelect.addEventListener("change", function () {
      currentUsersRole = this.value;
      renderUsers();
    });
  }

  // Users search input
  const usersSearchInput = document.getElementById("users-filter-search");
  if (usersSearchInput) {
    usersSearchInput.addEventListener("input", renderUsers);
  }

  // User Actions (Role change, Suspend/Activate)
  document.addEventListener("click", (e) => {
    // Suspend / Activate
    const suspendBtn = e.target.closest(".btn-suspend-user");
    if (suspendBtn) {
      const uid = Number(suspendBtn.dataset.userId);
      const user = usersData.find(u => u.id === uid);
      if (user) {
        user.status = "Suspended";
        showToast(`User ${user.name} has been suspended.`, "info");
        renderUsers();
      }
    }

    const activateBtn = e.target.closest(".btn-activate-user");
    if (activateBtn) {
      const uid = Number(activateBtn.dataset.userId);
      const user = usersData.find(u => u.id === uid);
      if (user) {
        user.status = "Active";
        showToast(`User ${user.name} reactivated.`, "success");
        renderUsers();
      }
    }

    // Role changer cycle
    const roleBtn = e.target.closest(".btn-edit-user-role");
    if (roleBtn) {
      const uid = Number(roleBtn.dataset.userId);
      const user = usersData.find(u => u.id === uid);
      if (user) {
        const roles = ["Member", "Administrator", "Security Lead", "DevOps"];
        const nextIndex = (roles.indexOf(user.role) + 1) % roles.length;
        user.role = roles[nextIndex];
        showToast(`Role updated: ${user.name} is now ${user.role}`, "success");
        renderUsers();
      }
    }
  });


  // ---------------------------------------------------------------------------
  //  6. Page: Roles & Permission Matrix
  // ---------------------------------------------------------------------------

  let currentMatrixRole = "Administrator";

  function renderRoles() {
    const container = document.getElementById("roles-cards-container");
    if (container) {
      container.innerHTML = rolesData.map(r => `
        <div class="role-card">
          <div>
            <div class="role-card-top">
              <span class="role-card-title">${r.name}</span>
              <span class="badge ${r.badgeClass}">${r.badge}</span>
            </div>
            <p class="role-card-desc">${r.desc}</p>
          </div>
          <div class="role-card-stats">
            <span class="role-users-count">${r.usersCount} users assigned</span>
            <button class="btn btn-outline btn-xs btn-inspect-role" data-role-name="${r.name}">Permissions</button>
          </div>
        </div>
      `).join("");
    }

    renderPermissionMatrix();
  }

  function renderPermissionMatrix() {
    const tbody = document.getElementById("matrix-table-tbody");
    if (!tbody) return;

    const rolePerms = matrixPermissions[currentMatrixRole] || matrixPermissions["Administrator"];
    const modules = Object.keys(rolePerms);

    tbody.innerHTML = modules.map(mod => {
      const perms = rolePerms[mod];
      return `
        <tr>
          <td><strong>${mod}</strong></td>
          <td style="text-align: center;"><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-idx="0" ${perms[0] ? 'checked' : ''} /></td>
          <td style="text-align: center;"><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-idx="1" ${perms[1] ? 'checked' : ''} /></td>
          <td style="text-align: center;"><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-idx="2" ${perms[2] ? 'checked' : ''} /></td>
          <td style="text-align: center;"><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-idx="3" ${perms[3] ? 'checked' : ''} /></td>
          <td style="text-align: center;"><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-idx="4" ${perms[4] ? 'checked' : ''} /></td>
        </tr>
      `;
    }).join("");
  }

  // Matrix role dropdown
  const matrixDropdown = document.getElementById("matrix-role-dropdown");
  if (matrixDropdown) {
    matrixDropdown.addEventListener("change", function () {
      currentMatrixRole = this.value;
      renderPermissionMatrix();
    });
  }

  // Quick configure buttons on role cards
  document.addEventListener("click", (e) => {
    const inspectRoleBtn = e.target.closest(".btn-inspect-role");
    if (inspectRoleBtn) {
      const roleName = inspectRoleBtn.dataset.roleName;
      if (matrixDropdown) {
        matrixDropdown.value = roleName;
        currentMatrixRole = roleName;
        renderPermissionMatrix();
        matrixDropdown.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });

  // Save permissions button
  const savePermsBtn = document.getElementById("btn-save-permissions");
  if (savePermsBtn) {
    savePermsBtn.addEventListener("click", () => {
      document.querySelectorAll(".perm-checkbox").forEach(cb => {
        const mod = cb.dataset.mod;
        const idx = Number(cb.dataset.idx);
        if (matrixPermissions[currentMatrixRole]?.[mod]) {
          matrixPermissions[currentMatrixRole][mod][idx] = cb.checked;
        }
      });
      showToast(`Permissions saved for role: ${currentMatrixRole}`, "success");
    });
  }


  // ---------------------------------------------------------------------------
  //  7. Page: Sessions & Device Management
  // ---------------------------------------------------------------------------

  let currentSessionFilter = "all";

  function renderSessions() {
    const tbody = document.getElementById("full-sessions-tbody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("sessions-filter-search")?.value || "").toLowerCase().trim();

    const filtered = sessionsData.filter(s => {
      const matchFilter = currentSessionFilter === "all" || s.status === currentSessionFilter;
      const matchSearch = !searchTerm ||
        s.userName.toLowerCase().includes(searchTerm) ||
        s.device.toLowerCase().includes(searchTerm) ||
        s.ip.includes(searchTerm) ||
        s.location.toLowerCase().includes(searchTerm);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No active sessions match the criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td>
          <div class="user-cell">
            <span class="user-cell-name">${s.userName}</span>
            <span class="user-cell-email">${s.email}</span>
          </div>
        </td>
        <td>
          <div class="device-cell">${s.device}<br><span class="device-sub">${s.platform}</span></div>
        </td>
        <td>
          <div class="ip-cell">${s.ip}<br><span class="ip-sub">${s.location}</span></div>
        </td>
        <td>${s.started}</td>
        <td>${s.lastActive}</td>
        <td><span class="status-pill ${s.status.toLowerCase()}">${s.status}</span></td>
        <td style="text-align: right;">
          ${s.status === 'Current'
            ? '<span class="action-dash">—</span>'
            : `<button class="btn btn-outline btn-xs btn-revoke-session-single" data-session-id="${s.id}">Revoke</button>`}
        </td>
      </tr>
    `).join("");

    // Update count labels
    const totalEl = document.getElementById("sessions-page-total");
    if (totalEl) totalEl.textContent = sessionsData.length;
    const flaggedEl = document.getElementById("sessions-page-flagged");
    if (flaggedEl) flaggedEl.textContent = sessionsData.filter(s => s.isSuspicious).length;
  }

  // Sessions filter tabs
  document.querySelectorAll("#sessions-filter-tabs .filter-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#sessions-filter-tabs .filter-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentSessionFilter = this.dataset.sessionFilter;
      renderSessions();
    });
  });

  const sessionsSearch = document.getElementById("sessions-filter-search");
  if (sessionsSearch) {
    sessionsSearch.addEventListener("input", renderSessions);
  }

  // Revoke session actions
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-revoke, .btn-revoke-session-single");
    if (btn) {
      const sid = Number(btn.dataset.sessionId);
      const session = sessionsData.find(s => s.id === sid);
      if (session) {
        if (!confirm(`Are you sure you want to revoke session for ${session.userName} on ${session.device}?`)) return;
        sessionsData = sessionsData.filter(s => s.id !== sid);
        showToast(`Session for ${session.userName} revoked successfully.`, "info");
        renderSessions();
        renderOverview();
      }
    }
  });

  // Quick revoke suspicious session from banner
  const quickRevokeBtn = document.getElementById("btn-quick-revoke-suspicious");
  if (quickRevokeBtn) {
    quickRevokeBtn.addEventListener("click", () => {
      sessionsData = sessionsData.filter(s => !s.isSuspicious);
      const banner = document.getElementById("sessions-threat-alert");
      if (banner) banner.style.display = "none";
      showToast("Suspicious session revoked and IP added to watch list.", "success");
      renderSessions();
      renderOverview();
    });
  }

  // Revoke all other sessions button
  const revokeAllSessionsBtn = document.getElementById("btn-revoke-all-sessions");
  if (revokeAllSessionsBtn) {
    revokeAllSessionsBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to revoke all sessions except this device?")) return;
      sessionsData = sessionsData.filter(s => s.status === "Current");
      showToast("All other active sessions have been signed out.", "success");
      renderSessions();
      renderOverview();
    });
  }


  // ---------------------------------------------------------------------------
  //  8. Page: Applications & OAuth Integrations
  // ---------------------------------------------------------------------------

  function renderApplications() {
    const container = document.getElementById("apps-admin-container");
    if (!container) return;

    container.innerHTML = appsData.map(app => `
      <div class="app-admin-card" id="app-card-${app.id}">
        <div>
          <div class="app-admin-top">
            <div class="app-admin-left">
              <div class="app-admin-icon" style="background:${app.color}">
                <span>${app.badgeChar}</span>
              </div>
              <div>
                <h3 class="app-admin-title">${app.name}</h3>
                <p class="app-admin-desc">${app.desc}</p>
              </div>
            </div>
            <label class="toggle ${app.active ? 'active' : 'inactive'}">
              <input type="checkbox" class="toggle-app-switch" data-app-id="${app.id}" ${app.active ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="app-admin-meta">
            <span class="app-meta-pill">Protocol: ${app.protocol}</span>
            <span class="app-meta-pill">Category: ${app.category}</span>
            <span class="app-meta-pill">${app.users} active grants</span>
          </div>
        </div>
        <div class="app-admin-bottom">
          <span class="badge ${app.active ? 'badge-success' : 'badge-failed'}">● ${app.active ? 'Operational' : 'Disabled'}</span>
          <button class="btn btn-outline btn-xs btn-inspect-app" data-app-id="${app.id}">Config credentials →</button>
        </div>
      </div>
    `).join("");

    // Update app stats
    const totalApps = document.getElementById("apps-stat-total");
    if (totalApps) totalApps.textContent = appsData.length;
    const activeApps = document.getElementById("apps-stat-active");
    if (activeApps) activeApps.textContent = appsData.filter(a => a.active).length;
    const overviewAppsSub = document.getElementById("stat-connected-apps-sub");
    if (overviewAppsSub) {
      overviewAppsSub.textContent = `${appsData.filter(a => a.active).length} active · ${appsData.filter(a => !a.active).length} inactive`;
    }
  }

  // Toggle app active/inactive state
  document.addEventListener("change", (e) => {
    const toggle = e.target.closest(".toggle-app-switch");
    if (toggle) {
      const appId = toggle.dataset.appId;
      const app = appsData.find(a => a.id === appId);
      if (app) {
        app.active = toggle.checked;
        showToast(`${app.name} is now ${app.active ? 'Active' : 'Inactive'}`, app.active ? "success" : "info");
        renderApplications();
        renderOverview();
      }
    }
  });


  // ---------------------------------------------------------------------------
  //  9. Page: Security Activity & Audit Logs
  // ---------------------------------------------------------------------------

  let currentSecurityFilter = "all";

  function renderSecurity() {
    const tbody = document.getElementById("security-table-tbody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("security-filter-search")?.value || "").toLowerCase().trim();

    const filtered = securityLogsData.filter(l => {
      const matchFilter = currentSecurityFilter === "all" || l.severity === currentSecurityFilter;
      const matchSearch = !searchTerm ||
        l.event.toLowerCase().includes(searchTerm) ||
        l.initiator.toLowerCase().includes(searchTerm) ||
        l.target.toLowerCase().includes(searchTerm) ||
        l.ip.includes(searchTerm);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No audit log entries found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(l => {
      const sevClass = l.severity === "Success" ? "badge-success" : l.severity === "Warning" ? "badge-blocked" : "badge-failed";
      return `
        <tr>
          <td><strong>${l.event}</strong></td>
          <td>${l.initiator}</td>
          <td><code>${l.target}</code></td>
          <td>${l.ip} <span style="color:var(--text-muted);font-size:0.75rem;">(${l.location})</span></td>
          <td><span class="badge ${sevClass}">${l.severity}</span></td>
          <td>${l.time}</td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-xs btn-inspect-log" data-log-id="${l.id}">View JSON</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Security filter tabs
  document.querySelectorAll("#security-filter-tabs .filter-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#security-filter-tabs .filter-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentSecurityFilter = this.dataset.securityFilter;
      renderSecurity();
    });
  });

  const securitySearch = document.getElementById("security-filter-search");
  if (securitySearch) {
    securitySearch.addEventListener("input", renderSecurity);
  }

  // Run security scan button
  const runScanBtn = document.getElementById("btn-run-security-scan");
  if (runScanBtn) {
    runScanBtn.addEventListener("click", function () {
      this.disabled = true;
      this.textContent = "Scanning workspace...";
      setTimeout(() => {
        this.disabled = false;
        this.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg> Run security scan`;
        showToast("Vulnerability scan complete: Zero critical exploits found. Organization score: 98/100.", "success");
      }, 1200);
    });
  }

  // Inspect security log JSON
  document.addEventListener("click", (e) => {
    const logBtn = e.target.closest(".btn-inspect-log");
    if (logBtn) {
      const lid = Number(logBtn.dataset.logId);
      const log = securityLogsData.find(l => l.id === lid);
      if (log) {
        document.getElementById("inspect-log-title").textContent = `Audit Log #${log.id}: ${log.event}`;
        document.getElementById("inspect-log-json").textContent = JSON.stringify(log.payload, null, 2);
        openModal("modal-log-inspect");
      }
    }
  });


  // ---------------------------------------------------------------------------
  //  10. Page: Admin Settings
  // ---------------------------------------------------------------------------

  const saveSettingsBtn = document.getElementById("btn-save-settings");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", function () {
      const minPwd = document.getElementById("setting-input-min-pwd")?.value || "12";
      const mfaMode = document.getElementById("setting-select-mfa")?.value || "Required for admins";
      const timeout = document.getElementById("setting-select-timeout")?.value || "30 minutes";
      const orgDomain = document.getElementById("setting-input-org-domain")?.value || "decisions.com";
      const lockout = document.getElementById("setting-input-lockout")?.value || "5";

      // Sync preview values in Overview page
      const prevPwd = document.getElementById("overview-setting-pwd");
      if (prevPwd) prevPwd.textContent = `${minPwd}+ characters`;
      const prevMfa = document.getElementById("overview-setting-mfa");
      if (prevMfa) prevMfa.textContent = mfaMode;
      const prevTimeout = document.getElementById("overview-setting-timeout");
      if (prevTimeout) prevTimeout.textContent = timeout;
      const prevOrg = document.getElementById("overview-setting-org");
      if (prevOrg) prevOrg.textContent = orgDomain;
      const prevLockout = document.getElementById("overview-setting-lockout");
      if (prevLockout) prevLockout.textContent = `${lockout} failed attempts`;

      showToast("Organization security policies saved and deployed across tenants.", "success");
    });
  }

  // Reset defaults button
  const resetSettingsBtn = document.getElementById("btn-reset-settings");
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", () => {
      if (!confirm("Reset all administrative security settings to enterprise baseline?")) return;
      document.getElementById("setting-input-min-pwd").value = "12";
      document.getElementById("setting-select-mfa").value = "Required for admins";
      document.getElementById("setting-select-timeout").value = "30 minutes";
      document.getElementById("setting-input-lockout").value = "5";
      showToast("Baseline settings restored.", "info");
    });
  }

  // Danger zone: Force sign out all
  const forceSignoutAllBtn = document.getElementById("btn-force-signout-all");
  if (forceSignoutAllBtn) {
    forceSignoutAllBtn.addEventListener("click", () => {
      if (!confirm("DANGER: This will immediately invalidate ALL active user tokens across every device and cloud integration. Proceed?")) return;
      sessionsData = sessionsData.filter(s => s.status === "Current");
      showToast("Global revocation complete: All other sessions terminated.", "error");
      renderSessions();
      renderOverview();
    });
  }

  // Danger zone: Rotate keys
  const rotateKeysBtn = document.getElementById("btn-rotate-keys");
  if (rotateKeysBtn) {
    rotateKeysBtn.addEventListener("click", () => {
      if (!confirm("Rotate RSA-4096 signing keys for all tenant JWT tokens?")) return;
      showToast("Master RSA-4096 signing keys rotated. JWKS endpoint published.", "success");
    });
  }


  // ---------------------------------------------------------------------------
  //  11. Modals Handling (Open, Close, Submit)
  // ---------------------------------------------------------------------------

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
    }
  }

  // Wire modal close triggers
  document.querySelectorAll(".modal-close, .modal-cancel").forEach(btn => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal-backdrop");
      if (modal) modal.classList.remove("open");
    });
  });

  // Close modal when clicking outside dialog
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("open");
      }
    });
  });

  // Modal Triggers
  document.querySelectorAll(".btn-open-add-user").forEach(b => {
    b.addEventListener("click", () => openModal("modal-add-user"));
  });

  document.querySelectorAll(".btn-open-add-role").forEach(b => {
    b.addEventListener("click", () => openModal("modal-add-role"));
  });

  document.querySelectorAll(".btn-open-add-app").forEach(b => {
    b.addEventListener("click", () => openModal("modal-add-app"));
  });

  // Form Submission: Add User
  const formAddUser = document.getElementById("form-add-user");
  if (formAddUser) {
    formAddUser.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("add-user-name").value.trim();
      const email = document.getElementById("add-user-email").value.trim();
      const role = document.getElementById("add-user-role").value;
      const dept = document.getElementById("add-user-dept").value;

      const parts = name.split(" ");
      const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();

      const newUser = {
        id: usersData.length + 1,
        name,
        email,
        role,
        status: "Active",
        mfa: role === "Administrator" ? "Enforced" : "Enabled",
        dept,
        location: "Bengaluru, IN",
        lastActive: "Just now",
        initials,
        bg: "#7c3aed"
      };

      usersData.unshift(newUser);
      closeModal("modal-add-user");
      formAddUser.reset();
      showToast(`User ${name} added successfully!`, "success");
      renderUsers();
    });
  }

  // Form Submission: Create Role
  const formAddRole = document.getElementById("form-add-role");
  if (formAddRole) {
    formAddRole.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("add-role-name").value.trim();
      const desc = document.getElementById("add-role-desc").value.trim();

      const newRole = {
        id: title.toLowerCase().replace(/\s+/g, "-"),
        name: title,
        usersCount: 0,
        desc: desc || "Custom enterprise permission configuration role.",
        badge: "Custom",
        badgeClass: "badge-good"
      };

      rolesData.push(newRole);

      // Add to matrix
      matrixPermissions[title] = {
        "Users & Directory": [true, false, false, false, false],
        "Active Sessions": [true, false, false, false, false],
        "Connected Applications": [true, false, false, false, false],
        "Security Audit Logs": [true, false, false, false, false],
        "System Policies": [false, false, false, false, false]
      };

      // Add to matrix dropdown
      const opt = document.createElement("option");
      opt.value = title;
      opt.textContent = title;
      matrixDropdown?.appendChild(opt);

      closeModal("modal-add-role");
      formAddRole.reset();
      showToast(`Custom role "${title}" created!`, "success");
      renderRoles();
    });
  }

  // Form Submission: Add Application
  const formAddApp = document.getElementById("form-add-app");
  if (formAddApp) {
    formAddApp.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("add-app-name").value.trim();
      const desc = document.getElementById("add-app-desc").value.trim();
      const protocol = document.getElementById("add-app-protocol").value;
      const color = document.getElementById("add-app-color").value;

      const badgeChar = name.split(" ").map(w => w[0]).join("").substring(0, 3).toUpperCase();

      const newApp = {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        desc,
        category: "Cloud Workplace",
        protocol,
        users: 1,
        active: true,
        color,
        badgeChar
      };

      appsData.push(newApp);
      closeModal("modal-add-app");
      formAddApp.reset();
      showToast(`Connected application "${name}" registered!`, "success");
      renderApplications();
      renderOverview();
    });
  }


  // ---------------------------------------------------------------------------
  //  12. Topbar & Profile Loader
  // ---------------------------------------------------------------------------

  async function loadAdminProfile() {
    let user = getStoredUser() || {
      full_name: "Amitoj Singh",
      email: "amitoj0024@gmail.com",
      role: "Administrator",
    };

    const nameEl = document.getElementById("admin-user-name");
    const roleEl = document.getElementById("admin-user-role");

    if (nameEl) nameEl.textContent = user.full_name || user.username || "Amitoj Singh";
    if (roleEl) roleEl.textContent = user.role || "Administrator";

    const avatar = document.querySelector(".user-pill .avatar");
    if (avatar) {
      const name = user.full_name || user.username || "Amitoj Singh";
      const parts = name.split(" ");
      avatar.textContent = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
  }

  // Notifications button
  const notifBtn = document.getElementById("btn-notifications");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      showToast("Security Notification: 1 suspicious IP alert detected in past 24h.", "info");
    });
  }

  // Sign out button
  const signoutBtn = document.getElementById("btn-admin-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("vault_auth_token");
      localStorage.removeItem("vault_auth_user");
      window.location.href = "/index.html";
    });
  }


  // ---------------------------------------------------------------------------
  //  13. Boot Sequence
  // ---------------------------------------------------------------------------

  function boot() {
    loadAdminProfile();
    renderOverview();
    renderUsers();
    renderRoles();
    renderSessions();
    renderApplications();
    renderSecurity();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
