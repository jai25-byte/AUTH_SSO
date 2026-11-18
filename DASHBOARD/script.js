/**
 * VaultAuth SSO — End User Dashboard Frontend Controller
 * Connects directly to the Flask Backend APIs
 */

(function () {
  "use strict";

  // ===== 1. Configuration & Token Management =====
  const API_BASE = (function () {
    const loc = window.location;
    if (loc.port === "5000") return "";
    if (loc.port === "3000") return ""; // Bun dev server proxies /api/*
    return "http://127.0.0.1:5000";
  })();

  function getToken() {
    // 1. Check URL query parameters (e.g. ?token=...)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("vault_auth_token", urlToken);
      // Clean query string from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      return urlToken;
    }
    // 2. Check localStorage
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

  async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        console.warn("[VaultAuth] Session unauthenticated or token expired.");
      }

      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error(`[VaultAuth] API Error on ${endpoint}:`, err);
      return { ok: false, status: 0, data: null, error: err.message };
    }
  }

  // ===== 2. SVG Icon Generators =====
  function getDeviceIcon(deviceType) {
    if (deviceType === "mobile") {
      return `
        <div class="device-icon mobile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>`;
    } else if (deviceType === "laptop") {
      return `
        <div class="device-icon laptop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="20" x2="22" y2="20"></line>
          </svg>
        </div>`;
    }
    return `
      <div class="device-icon desktop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      </div>`;
  }

  // ===== 3. Navigation & Tab Switching =====
  function navigateToPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
      page.style.display = "none";
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.style.display = "block";
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
      if (item.getAttribute("data-page") === pageId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Bind Sidebar Nav
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");
      if (page) navigateToPage(page);
    });
  });

  // Bind all data-goto triggers (quick actions, view-all links, stat cards)
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-goto]");
    if (trigger) {
      e.preventDefault();
      const gotoPage = trigger.getAttribute("data-goto");
      if (gotoPage) {
        navigateToPage(gotoPage);
      }
    }
  });

  // Mobile Menu toggle
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

  // ===== 4. Load & Render User Profile =====
  async function loadUserProfile() {
    const res = await apiRequest("/api/user/profile");
    let user = res.ok ? res.data : null;

    if (!user) {
      const stored = getStoredUser();
      user = stored || {
        full_name: "Alex Morgan",
        username: "alex",
        email: "alex.morgan@company.com",
        initials: "AM",
        role: "End user",
        department: "Engineering",
        phone: "+91 98765 43210",
        joined: "March 15, 2025",
        security: {
          mfa_enabled: true,
          recovery_email: "alex.backup@gmail.com",
          password_changed_desc: "Last changed 30 days ago",
        },
      };
    }

    const firstName = (user.full_name || user.username || "Alex").split(" ")[0];
    const initials = user.initials || firstName.substring(0, 2).toUpperCase();

    // 1. Topbar
    const topAvatar = document.querySelector(".user-pill .avatar");
    const topName = document.querySelector(".user-pill .user-name");
    const topRole = document.querySelector(".user-pill .user-role");
    if (topAvatar) topAvatar.textContent = initials;
    if (topName) topName.textContent = user.full_name || user.username;
    if (topRole) topRole.textContent = user.role || "End user";

    // 2. Overview Greeting
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const greetingEl = document.getElementById("overview-greeting");
    if (greetingEl) {
      greetingEl.textContent = `Good ${timeOfDay}, ${firstName} 👋`;
    }

    // 3. Profile Page Fields
    const pAvatar = document.getElementById("profile-avatar");
    const pName = document.getElementById("profile-name");
    const pEmail = document.getElementById("profile-email");
    if (pAvatar) pAvatar.textContent = initials;
    if (pName) pName.textContent = user.full_name || user.username;
    if (pEmail) pEmail.textContent = user.email;

    const fName = document.getElementById("field-fullname");
    const fEmail = document.getElementById("field-email");
    const fPhone = document.getElementById("field-phone");
    const fDept = document.getElementById("field-dept");
    const fRole = document.getElementById("field-role");
    const fJoined = document.getElementById("field-joined");

    if (fName) fName.textContent = user.full_name || user.username;
    if (fEmail) fEmail.textContent = user.email;
    if (fPhone) fPhone.textContent = user.phone || "Not set";
    if (fDept) fDept.textContent = user.department || "Engineering";
    if (fRole) fRole.textContent = user.role || "End user";
    if (fJoined) fJoined.textContent = user.joined || "March 15, 2025";

    // Security info on profile
    if (user.security) {
      const pwdDesc = document.getElementById("sec-pwd-desc");
      const recEmail = document.getElementById("sec-recovery-email");
      if (pwdDesc && user.security.password_changed_desc) {
        pwdDesc.textContent = user.security.password_changed_desc;
      }
      if (recEmail && user.security.recovery_email) {
        recEmail.textContent = user.security.recovery_email;
      }
    }
  }

  // ===== 5. Load Overview Statistics =====
  async function loadOverviewStats() {
    const res = await apiRequest("/api/dashboard/overview");
    if (!res.ok || !res.data) return;
    const d = res.data;

    // Active Sessions Card
    const sessVal = document.getElementById("stat-active-sessions");
    const sessDesc = document.getElementById("stat-active-sessions-desc");
    if (sessVal && d.active_sessions) sessVal.textContent = d.active_sessions.label;
    if (sessDesc && d.active_sessions) sessDesc.textContent = d.active_sessions.description;

    // Security Score Card
    const scoreVal = document.getElementById("stat-security-score");
    const scoreDesc = document.getElementById("stat-security-score-desc");
    const statusBadge = document.getElementById("overview-status-badge");
    if (scoreVal && d.security_score) scoreVal.textContent = d.security_score.label;
    if (scoreDesc && d.security_score) scoreDesc.textContent = d.security_score.description;
    if (statusBadge && d.system_status) {
      statusBadge.innerHTML = `<span class="status-dot"></span>${d.system_status.status}`;
      if (d.system_status.all_systems_normal) {
        statusBadge.className = "status-badge status-normal";
      } else {
        statusBadge.className = "status-badge";
        statusBadge.style.background = "#fef3c7";
        statusBadge.style.color = "#92400e";
      }
    }

    // Connected Apps Card
    const appsVal = document.getElementById("stat-connected-apps");
    const appsDesc = document.getElementById("stat-connected-apps-desc");
    if (appsVal && d.connected_apps) appsVal.textContent = d.connected_apps.label;
    if (appsDesc && d.connected_apps) appsDesc.textContent = d.connected_apps.description;
  }

  // ===== 6. Load Recent Login Activity =====
  let allActivities = [];

  async function loadLoginActivity(statusFilter = null) {
    const url = statusFilter ? `/api/dashboard/login-activity?status=${statusFilter}` : "/api/dashboard/login-activity";
    const res = await apiRequest(url);
    if (!res.ok || !Array.isArray(res.data)) return;

    allActivities = res.data;
    renderOverviewActivity(allActivities.slice(0, 3));
    renderActivityTable(allActivities);
  }

  function renderOverviewActivity(items) {
    const container = document.getElementById("overview-activity-list");
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<p class="text-secondary" style="padding: 16px; font-size: 0.9rem;">No recent activity found.</p>`;
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
        <div class="activity-item">
          ${getDeviceIcon(item.device_type)}
          <div class="activity-details">
            <span class="device-name">${item.device_name}</span>
            <span class="device-meta">${item.meta || `${item.browser} • ${item.location}`}</span>
          </div>
          <div class="activity-time">
            <span class="time-text">${item.time_formatted}</span>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">${item.status}</span>
          </div>
        </div>`
      )
      .join("");
  }

  function renderActivityTable(items) {
    const tbody = document.getElementById("activity-table-body");
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">No login activity recorded matching this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map(
        (item) => `
        <tr>
          <td>
            <div class="table-device">
              ${getDeviceIcon(item.device_type)}
              ${item.device_name}
            </div>
          </td>
          <td>${item.browser}</td>
          <td>${item.location}</td>
          <td>${item.time_formatted}</td>
          <td><code>${item.ip_address}</code></td>
          <td>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">${item.status}</span>
          </td>
        </tr>`
      )
      .join("");
  }

  // Filter Buttons on Activity Page
  document.querySelectorAll(".activity-filters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".activity-filters .filter-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const filter = this.getAttribute("data-filter") || this.textContent.trim().toLowerCase();
      loadLoginActivity(filter === "all" ? null : filter);
    });
  });

  // ===== 7. Load Active Sessions =====
  async function loadActiveSessions() {
    const res = await apiRequest("/api/sessions");
    const container = document.getElementById("active-sessions-list");
    if (!container) return;

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      container.innerHTML = `<p style="padding: 12px; color: var(--text-secondary); font-size: 0.9rem;">No active sessions found.</p>`;
      return;
    }

    const sessions = res.data;
    container.innerHTML = sessions
      .map(
        (s) => `
        <div class="activity-item" style="padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--card-border); margin-bottom: 8px;">
          ${getDeviceIcon(s.device_type)}
          <div class="activity-details" style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="device-name" style="font-weight: 600;">${s.device_name}</span>
              ${s.is_current ? `<span class="badge badge-success" style="font-size: 0.72rem; padding: 2px 8px;">This device</span>` : ""}
            </div>
            <span class="device-meta">${s.browser} • ${s.location} (IP: ${s.ip_address})</span>
            <span class="device-meta" style="font-size: 0.75rem; color: var(--text-muted);">Signed in: ${s.created_at} • Last active: ${s.last_active}</span>
          </div>
          <div>
            ${
              s.is_current
                ? `<span style="font-size: 0.8rem; color: var(--green); font-weight: 600;">Active Now</span>`
                : `<button class="btn btn-danger-outline btn-sm btn-revoke-session" data-session-id="${s.session_id}">Revoke</button>`
            }
          </div>
        </div>`
      )
      .join("");

    // Bind individual revoke buttons
    container.querySelectorAll(".btn-revoke-session").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const sid = this.getAttribute("data-session-id");
        if (!sid) return;
        this.disabled = true;
        this.textContent = "Revoking...";

        const delRes = await apiRequest(`/api/sessions/${sid}`, { method: "DELETE" });
        if (delRes.ok) {
          loadActiveSessions();
          loadOverviewStats();
        } else {
          alert(delRes.data?.message || "Failed to revoke session.");
          this.disabled = false;
          this.textContent = "Revoke";
        }
      });
    });
  }

  // Bind Revoke Other Sessions button
  const revokeOthersBtn = document.getElementById("btn-revoke-others");
  if (revokeOthersBtn) {
    revokeOthersBtn.addEventListener("click", async function () {
      if (!confirm("Are you sure you want to sign out of all other devices?")) return;
      this.disabled = true;
      this.textContent = "Signing out others...";

      const res = await apiRequest("/api/sessions/revoke-others", { method: "POST" });
      this.disabled = false;
      this.textContent = "Sign out of other devices";

      if (res.ok) {
        alert(res.data?.message || "All other sessions have been signed out.");
        loadActiveSessions();
        loadOverviewStats();
      } else {
        alert(res.data?.message || "Failed to sign out other sessions.");
      }
    });
  }

  // ===== 8. Load Connected Applications =====
  async function loadConnectedApps() {
    const res = await apiRequest("/api/connected-apps");
    const grid = document.getElementById("connected-apps-grid");
    const heading = document.getElementById("apps-count-heading");
    if (!grid) return;

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-secondary);">No third-party applications currently connected.</div>`;
      if (heading) heading.textContent = "0 apps connected";
      return;
    }

    const apps = res.data;
    if (heading) {
      heading.textContent = `${apps.length} app${apps.length === 1 ? "" : "s"} connected`;
    }

    grid.innerHTML = apps
      .map(
        (app) => `
        <div class="card app-card" id="app-card-${app.id}">
          <div class="app-card-top">
            <div class="app-logo" style="background:${app.logo_bg};color:#fff">${app.logo_char}</div>
            <div>
              <h3 class="app-name">${app.app_name}</h3>
              <p class="app-desc">${app.app_desc}</p>
            </div>
            <span class="badge ${app.status === "Active" ? "badge-success" : "badge-failed"}" style="margin-left:auto">${app.status}</span>
          </div>
          <div class="app-permissions">
            <p class="perm-label">Permissions</p>
            <div class="perm-tags">
              ${(app.permissions || []).map((p) => `<span class="perm-tag">${p}</span>`).join("")}
            </div>
          </div>
          <div class="app-card-footer">
            <span class="app-meta">Connected on ${app.connected_date}</span>
            <button class="btn btn-danger-outline btn-sm btn-revoke-app" data-app-id="${app.id}">Revoke</button>
          </div>
        </div>`
      )
      .join("");

    // Bind app revoke buttons
    grid.querySelectorAll(".btn-revoke-app").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const appId = this.getAttribute("data-app-id");
        if (!appId) return;
        if (!confirm("Are you sure you want to revoke access for this application?")) return;

        this.disabled = true;
        this.textContent = "Revoking...";

        const delRes = await apiRequest(`/api/connected-apps/${appId}`, { method: "DELETE" });
        if (delRes.ok) {
          loadConnectedApps();
          loadOverviewStats();
        } else {
          alert(delRes.data?.message || "Failed to disconnect application.");
          this.disabled = false;
          this.textContent = "Revoke";
        }
      });
    });
  }

  // ===== 9. Load Security Checklist =====
  async function loadSecurityChecklist() {
    const res = await apiRequest("/api/security/checklist");
    const container = document.getElementById("overview-checklist");
    const badge = document.getElementById("overview-checklist-badge");
    if (!container || !res.ok || !res.data) return;

    const data = res.data;
    if (badge && data.badge) {
      badge.textContent = data.badge;
      badge.className = `badge ${data.badge === "GOOD" ? "badge-good" : data.badge === "FAIR" ? "badge-failed" : "badge-blocked"}`;
    }

    if (Array.isArray(data.items)) {
      container.innerHTML = data.items
        .map(
          (item) => `
          <li class="checklist-item">
            <div class="check-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="${item.enabled ? "#16a34a" : "#e5e7eb"}"></circle>
                <path d="M9 12l2 2 4-4" stroke="${item.enabled ? "#fff" : "#9ca3af"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div>
              <span class="check-title">${item.title}</span>
              <span class="check-desc">${item.description}</span>
            </div>
          </li>`
        )
        .join("");
    }
  }

  // ===== 10. Update Security Settings Handlers =====
  const updateRecoveryBtn = document.getElementById("btn-update-recovery");
  if (updateRecoveryBtn) {
    updateRecoveryBtn.addEventListener("click", async function () {
      const cur = document.getElementById("sec-recovery-email")?.textContent || "";
      const newEmail = prompt("Enter your updated recovery email address:", cur);
      if (!newEmail || !newEmail.includes("@")) {
        if (newEmail !== null) alert("Please enter a valid email address.");
        return;
      }

      this.disabled = true;
      this.textContent = "Saving...";

      const res = await apiRequest("/api/security/settings", {
        method: "PUT",
        body: JSON.stringify({ recovery_email: newEmail.trim() }),
      });

      this.disabled = false;
      this.textContent = "Update";

      if (res.ok) {
        alert("Recovery email updated successfully.");
        loadUserProfile();
        loadSecurityChecklist();
        loadOverviewStats();
      } else {
        alert(res.data?.message || "Failed to update recovery email.");
      }
    });
  }

  const refreshProfileBtn = document.getElementById("btn-edit-profile");
  if (refreshProfileBtn) {
    refreshProfileBtn.addEventListener("click", () => {
      loadUserProfile();
      alert("Profile data reloaded from VaultAuth identity service.");
    });
  }

  // Sign out handler
  const signoutBtn = document.getElementById("btn-dashboard-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      await apiRequest("/api/logout", { method: "POST" });
      localStorage.removeItem("vault_auth_token");
      localStorage.removeItem("vault_auth_user");
      window.location.href = "/index.html";
    });
  }

  // Search Input focus effect
  const searchBox = document.querySelector(".search-box");
  const searchInput = searchBox?.querySelector("input");
  if (searchInput && searchBox) {
    searchInput.addEventListener("focus", () => {
      searchBox.style.borderColor = "#2563eb";
      searchBox.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
    });
    searchInput.addEventListener("blur", () => {
      searchBox.style.borderColor = "";
      searchBox.style.boxShadow = "";
    });
  }

  // ===== 11. Initial Orchestration =====
  async function initDashboard() {
    await loadUserProfile();
    await loadOverviewStats();
    await loadSecurityChecklist();
    await loadLoginActivity();
    await loadActiveSessions();
    await loadConnectedApps();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();
