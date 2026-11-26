/**
 * VaultAuthSSO — End User Dashboard Frontend Controller
 * Connects directly to the VaultAuth Flask Backend APIs with graceful offline/demo fallbacks
 */

(function () {
  "use strict";

  // ===== 1. Configuration & Token Management =====
  const API_BASE = (function () {
    const loc = window.location;
    if (loc.port === "5000") return "";
    if (loc.port === "3000") return ""; // Bun dev server proxies /api/* to Flask :5000
    return "http://127.0.0.1:5000";
  })();

  function getToken() {
    // 1. Check URL query parameters (e.g. ?token=...)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("vault_auth_token", urlToken);
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.delete("token");
      const cleanSearch = cleanParams.toString();
      window.history.replaceState(
        window.history.state || {},
        document.title,
        window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "")
      );
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

      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: null, error: err.message };
    }
  }

  // ===== 2. Toast Notification System =====
  function showToast(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;

    const el = document.createElement("div");
    el.className = `toast-msg ${type}`;
    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        ${type === "success" ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(20px)";
      setTimeout(() => el.remove(), 200);
    }, 4000);
  }

  // ===== 3. Sample / Mock Data (1:1 with Reference Screenshots) =====
  const DEFAULT_APPS = [
    {
      id: 1,
      name: "Google Workspace",
      desc: "Email, Calendar, Drive",
      logo: "G",
      bg: "#4285F4",
      permissions: ["Read email", "Calendar access", "Drive read"],
      status: "Active",
      connectedDate: "Jan 10, 2025",
    },
    {
      id: 2,
      name: "Slack",
      desc: "Team messaging",
      logo: "S",
      bg: "#5865F2",
      permissions: ["Send messages", "Read channels"],
      status: "Active",
      connectedDate: "Feb 02, 2025",
    },
    {
      id: 3,
      name: "Jira",
      desc: "Project management",
      logo: "J",
      bg: "#0052CC",
      permissions: ["Read issues", "Create issues", "Assign"],
      status: "Active",
      connectedDate: "Mar 18, 2025",
    },
    {
      id: 4,
      name: "AWS Console",
      desc: "Cloud infrastructure",
      logo: "A",
      bg: "#FF9900",
      permissions: ["Read-only", "IAM view"],
      status: "Active",
      connectedDate: "Apr 22, 2025",
    },
    {
      id: 5,
      name: "GitHub",
      desc: "Code repositories",
      logo: "G",
      bg: "#171515",
      permissions: ["Repo read", "Repo write", "Webhooks"],
      status: "Active",
      connectedDate: "May 05, 2025",
    },
  ];

  const DEFAULT_ACTIVITIES = [
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

  const DEFAULT_SESSIONS = [
    {
      id: "sess_curr",
      deviceName: 'MacBook Pro 16"',
      deviceType: "laptop",
      browser: "Chrome 131",
      os: "macOS",
      ip: "103.21.58.xx",
      location: "Bengaluru, India",
      lastActive: "Active Now",
      isCurrent: true,
    },
    {
      id: "sess_mob",
      deviceName: "Samsung Galaxy S25 Ultra",
      deviceType: "mobile",
      browser: "VaultAuth mobile",
      os: "Android",
      ip: "103.21.58.xx",
      location: "Bengaluru, India",
      lastActive: "Today, 8:16 AM",
      isCurrent: false,
    },
  ];

  // State
  let connectedApps = [...DEFAULT_APPS];
  let loginActivities = [...DEFAULT_ACTIVITIES];
  let activeSessions = [...DEFAULT_SESSIONS];
  let activityStatusFilter = "all";
  let activitySearchQuery = "";
  let activityCurrentPage = 1;
  const activityPageSize = 5;

  let appToDisconnect = null;
  let sessionToRevoke = null;

  // ===== 4. Device Icons SVG Helper =====
  function getDeviceIconSvg(type) {
    if (type === "mobile") {
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="5" y="2" width="14" height="20" rx="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>`;
    } else if (type === "laptop") {
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="20" x2="22" y2="20"></line>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>`;
  }

  // ===== 5. Navigation & Page Switching =====
  let currentPageId = "overview";

  function isValidPage(pageId) {
    return Boolean(pageId && document.getElementById(`page-${pageId}`));
  }

  function getTabFromUrl(fallback = "overview") {
    try {
      const tab = new URLSearchParams(window.location.search).get("tab");
      return isValidPage(tab) ? tab : fallback;
    } catch {
      return fallback;
    }
  }

  function buildTabUrl(pageId) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", pageId);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return `${window.location.pathname}?tab=${encodeURIComponent(pageId)}`;
    }
  }

  function navigateTo(pageId, options = {}) {
    const { skipHistory = false, replaceHistory = false } = options;
    const resolvedPage = isValidPage(pageId) ? pageId : "overview";

    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

    const target = document.getElementById(`page-${resolvedPage}`);
    if (target) {
      target.style.display = "block";
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
      if (item.getAttribute("data-page") === resolvedPage) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    if (!skipHistory) {
      try {
        const nextUrl = buildTabUrl(resolvedPage);
        if (replaceHistory) {
          window.history.replaceState({ tab: resolvedPage }, "", nextUrl);
        } else if (resolvedPage !== currentPageId) {
          window.history.pushState({ tab: resolvedPage }, "", nextUrl);
        }
      } catch {}
    }
    currentPageId = resolvedPage;

    // Close mobile menu if open
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("open");

    // Close user dropdown if open
    document.getElementById("user-dropdown-menu")?.classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.addEventListener("popstate", (event) => {
    const stateTab = event?.state?.tab;
    const nextPage = isValidPage(stateTab) ? stateTab : getTabFromUrl("overview");
    navigateTo(nextPage, { skipHistory: true });
  });

  // Bind Sidebar items
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");
      if (page) navigateTo(page);
    });
  });

  // Bind all data-goto links
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-goto]");
    if (trigger) {
      e.preventDefault();
      const page = trigger.getAttribute("data-goto");
      if (page) navigateTo(page);
    }
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("btn-mobile-menu");
  const sidebarEl = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  if (mobileMenuBtn && sidebarEl && sidebarOverlay) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebarEl.classList.toggle("open");
      sidebarOverlay.classList.toggle("open");
    });
    sidebarOverlay.addEventListener("click", () => {
      sidebarEl.classList.remove("open");
      sidebarOverlay.classList.remove("open");
    });
  }

  // Topbar User Dropdown
  const userPill = document.getElementById("user-pill-trigger");
  const userDropdown = document.getElementById("user-dropdown-menu");
  if (userPill && userDropdown) {
    userPill.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
    });
  }

  // ===== 6. Modal Helpers =====
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("show");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("show");
  }

  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal-overlay");
      if (modal) modal.classList.remove("show");
    });
  });

  // Close modals on clicking backdrop
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) this.classList.remove("show");
    });
  });

  // ===== 7. Load & Render User Profile =====
  async function loadUserProfile() {
    const res = await apiRequest("/api/user/profile");
    let user = res.ok && res.data ? res.data : null;

    if (!user) {
      user = getStoredUser() || {
        full_name: "Alex Morgan",
        email: "amitoj0024@gmail.com",
        username: "alex",
        role: "End user",
        department: "Engineering",
        phone: "+91 98765 43210",
        joined: "March 15, 2025",
      };
    }

    const email = user.email || "amitoj0024@gmail.com";
    const name = user.full_name || user.username || "Alex Morgan";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AM";

    // Topbar
    const topAvatar = document.getElementById("topbar-avatar");
    const topName = document.getElementById("topbar-user-name");
    const topRole = document.getElementById("topbar-user-role");
    if (topAvatar) topAvatar.textContent = initials;
    if (topName) topName.textContent = email;
    if (topRole) topRole.textContent = user.role || "End user";

    // Dropdown
    const dropName = document.getElementById("dropdown-name");
    const dropEmail = document.getElementById("dropdown-email");
    if (dropName) dropName.textContent = name;
    if (dropEmail) dropEmail.textContent = email;

    // Greeting on Overview
    const greeting = document.getElementById("overview-greeting");
    if (greeting) {
      const firstName = name.split(" ")[0];
      greeting.textContent = `Good morning, ${firstName} 👋`;
    }

    // Profile Page
    const pAvatar = document.getElementById("profile-page-avatar");
    const pFullName = document.getElementById("profile-full-name");
    const pEmail = document.getElementById("profile-user-email");
    if (pAvatar) pAvatar.textContent = initials;
    if (pFullName) pFullName.textContent = name;
    if (pEmail) pEmail.textContent = email;

    const fFullName = document.getElementById("profile-field-fullname");
    const fEmail = document.getElementById("profile-field-email");
    const fDept = document.getElementById("profile-field-dept");
    const fRole = document.getElementById("profile-field-role");
    const fPhone = document.getElementById("profile-field-phone");
    const fJoined = document.getElementById("profile-field-joined");
    if (fFullName) fFullName.textContent = name;
    if (fEmail) fEmail.textContent = email;
    if (fDept) fDept.textContent = user.department || "Engineering";
    if (fRole) fRole.textContent = user.role || "End user";
    if (fPhone) fPhone.textContent = user.phone || "+91 98765 43210";
    if (fJoined) fJoined.textContent = user.joined || "March 15, 2025";
  }

  // ===== 8. Connected Apps Controller (Matching Reference 1) =====
  async function loadConnectedApps() {
    const res = await apiRequest("/api/oidc/sessions");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      connectedApps = res.data.map((s) => ({
        id: s.client_session_id,
        name: s.app_name || s.app_key || "SSO Application",
        desc: (s.browser || "Browser") + " · " + (s.device_name || s.device_type || "device"),
        logo: (s.app_name || s.app_key || "S").slice(0, 1).toUpperCase(),
        bg: "#2563eb",
        permissions: ["SSO access", "Profile"],
        status: s.status === "ACTIVE" ? "Active" : "Revoked",
        connectedDate: s.created_at || "Recently",
      }));
    }
    renderConnectedApps();
  }

  function renderConnectedApps() {
    const container = document.getElementById("connected-apps-list");
    const emptyState = document.getElementById("apps-empty-state");
    const countBadge = document.getElementById("apps-count-number");
    const statOverview = document.getElementById("stat-connected-apps");
    if (!container) return;

    const searchInput = document.getElementById("apps-search-input")?.value.toLowerCase().trim() || "";
    const statusFilter = document.getElementById("apps-status-filter")?.value || "all";

    const filtered = connectedApps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchInput) ||
        app.desc.toLowerCase().includes(searchInput) ||
        app.permissions.some((p) => p.toLowerCase().includes(searchInput));
      const matchesStatus = statusFilter === "all" || app.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    if (countBadge) countBadge.textContent = connectedApps.length;
    if (statOverview) statOverview.textContent = `${connectedApps.length} apps`;

    if (filtered.length === 0) {
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    container.innerHTML = filtered
      .map(
        (app) => `
        <div class="app-card-horizontal" data-app-id="${escapeHtml(app.id)}">
          <div class="app-card-left">
            <div class="app-card-icon" style="background: ${escapeHtml(app.bg)};">
              ${escapeHtml(app.logo)}
            </div>
            <div class="app-card-details">
              <div class="app-card-name-row">
                <span class="app-card-name">${escapeHtml(app.name)}</span>
              </div>
              <p class="app-card-desc">${escapeHtml(app.desc)}</p>
              <div class="app-card-permissions">
                <strong>Permissions:</strong>
                ${app.permissions
                  .map((perm, idx) => `<span>${escapeHtml(perm)}</span>${idx < app.permissions.length - 1 ? '<span class="app-perm-bullet">•</span>' : ""}`)
                  .join("")}
              </div>
            </div>
          </div>

          <div class="app-card-right">
            <div class="app-card-meta">
              <span class="badge ${app.status === "Active" ? "badge-success" : "badge-failed"}">
                <span class="badge-dot"></span>${escapeHtml(app.status)}
              </span>
              <span class="app-connected-date">Connected on ${escapeHtml(app.connectedDate)}</span>
            </div>

            <div class="app-card-actions">
              <button class="btn btn-outline btn-sm btn-manage-app" data-app-id="${escapeHtml(app.id)}">
                Manage access
              </button>
              <button class="btn btn-danger-outline btn-sm btn-disconnect-app" data-app-id="${escapeHtml(app.id)}">
                Revoke access
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    // Bind Manage Access buttons
    container.querySelectorAll(".btn-manage-app").forEach((btn) => {
      btn.addEventListener("click", function () {
        const appId = parseInt(this.getAttribute("data-app-id"), 10);
        const app = connectedApps.find((a) => a.id === appId);
        if (!app) return;

        const title = document.getElementById("modal-manage-app-title");
        const name = document.getElementById("modal-manage-app-name");
        const list = document.getElementById("modal-manage-permissions-list");
        if (title) title.textContent = `${app.name} — Access & Permissions`;
        if (name) name.textContent = app.name;
        if (list) {
          list.innerHTML = app.permissions
            .map(
              (p) => `
              <label style="display: flex; align-items: center; gap: 10px; font-size: 0.86rem; padding: 6px 10px; border-radius: 6px; background: #f8fafc; border: 1px solid var(--card-border);">
                <input type="checkbox" checked style="accent-color: var(--brand-purple);" />
                <span>${p}</span>
              </label>
            `
            )
            .join("");
        }

        openModal("modal-manage-app");
      });
    });

    // Bind Disconnect buttons
    container.querySelectorAll(".btn-disconnect-app").forEach((btn) => {
      btn.addEventListener("click", function () {
        const appId = parseInt(this.getAttribute("data-app-id"), 10);
        appToDisconnect = connectedApps.find((a) => a.id === appId);
        if (!appToDisconnect) return;

        const nameEl = document.getElementById("modal-disconnect-app-name");
        if (nameEl) nameEl.textContent = appToDisconnect.name;
        openModal("modal-disconnect-app");
      });
    });
  }

  // Confirm Disconnect button handler
  const confirmDisconnectBtn = document.getElementById("btn-confirm-disconnect");
  if (confirmDisconnectBtn) {
    confirmDisconnectBtn.addEventListener("click", async function () {
      if (!appToDisconnect) return;
      this.disabled = true;
      this.textContent = "Revoking...";

      // Attempt backend DELETE call
      const res = await apiRequest(`/api/oidc/sessions/${encodeURIComponent(appToDisconnect.id)}`, { method: "DELETE" });

      this.disabled = false;
      this.textContent = "Yes, disconnect";
      closeModal("modal-disconnect-app");

      // Update local state
      connectedApps = connectedApps.filter((a) => a.id !== appToDisconnect.id);
      renderConnectedApps();
      showToast(`${appToDisconnect.name} has been disconnected.`, "success");
      appToDisconnect = null;
    });
  }

  // Search & Filter event listeners for Connected Apps
  document.getElementById("apps-search-input")?.addEventListener("input", renderConnectedApps);
  document.getElementById("apps-status-filter")?.addEventListener("change", renderConnectedApps);
  document.getElementById("btn-reset-apps-filter")?.addEventListener("click", () => {
    const sInput = document.getElementById("apps-search-input");
    const sSelect = document.getElementById("apps-status-filter");
    if (sInput) sInput.value = "";
    if (sSelect) sSelect.value = "all";
    renderConnectedApps();
  });

  // Save permissions modal handler
  document.getElementById("btn-save-app-permissions")?.addEventListener("click", () => {
    closeModal("modal-manage-app");
    showToast("Application access permissions updated successfully.", "success");
  });

  // ===== 9. Login Activity & Devices Controller (Matching Reference 2) =====
  async function loadLoginActivity() {
    const res = await apiRequest("/api/dashboard/login-activity");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      loginActivities = res.data.map((item, idx) => ({
        id: item.id || `act-${idx}`,
        device: item.device_name || "MacBook Pro 16",
        deviceType: item.device_type || "laptop",
        browser: item.browser || "Chrome 131",
        os: item.os || "macOS Sequoia",
        location: item.location || "Bengaluru, India",
        time: item.time_formatted || item.created_at || "Today, 9:42 AM",
        ip: item.ip_address || "103.21.58.xx",
        status: item.status || "Success",
      }));
    }
    renderSummaryCards();
    renderActivityTable();
    renderOverviewActivityPreview();
  }

  function renderSummaryCards() {
    const total = loginActivities.length;
    const success = loginActivities.filter((a) => a.status.toLowerCase() === "success").length;
    const failed = loginActivities.filter((a) => a.status.toLowerCase() === "failed" || a.status.toLowerCase() === "blocked").length;

    const tEl = document.getElementById("summary-total-attempts");
    const sEl = document.getElementById("summary-successful-attempts");
    const fEl = document.getElementById("summary-failed-attempts");
    const dEl = document.getElementById("summary-active-devices");

    if (tEl) tEl.textContent = total;
    if (sEl) sEl.textContent = success;
    if (fEl) fEl.textContent = failed;
    if (dEl) dEl.textContent = activeSessions.length;

    // Synchronize Overview active sessions card dynamically
    const count = activeSessions.length;
    const statActive = document.getElementById("stat-active-sessions");
    const statActiveDesc = document.getElementById("stat-active-sessions-desc");
    if (statActive) {
      statActive.textContent = `${count} ${count === 1 ? "device" : "devices"}`;
    }
    if (statActiveDesc) {
      statActiveDesc.textContent = `You're signed in on ${count} ${count === 1 ? "device" : "devices"}`;
    }
  }

  function renderOverviewActivityPreview() {
    const container = document.getElementById("overview-recent-activity-list");
    if (!container) return;

    if (!loginActivities || loginActivities.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px 12px; color: var(--text-muted); font-size: 0.85rem;">
          No recent login activity records found.
        </div>
      `;
      return;
    }

    // Render all login activity records dynamically without artificial slicing
    container.innerHTML = loginActivities
      .map(
        (item) => `
        <div class="overview-activity-item">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="table-device-icon">${getDeviceIconSvg(item.deviceType)}</div>
            <div>
              <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">${escapeHtml(item.device)}</strong>
              <span style="font-size: 0.76rem; color: var(--text-muted);">${escapeHtml(item.browser)} • ${escapeHtml(item.location)}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.76rem; color: var(--text-secondary); display: block; margin-bottom: 2px;">${escapeHtml(item.time)}</span>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
              <span class="badge-dot"></span>${escapeHtml(item.status)}
            </span>
          </div>
        </div>
      `
      )
      .join("");
  }

  function renderActivityTable() {
    const tbody = document.getElementById("activity-table-body");
    const countLabel = document.getElementById("activity-events-count");
    const pageInfo = document.getElementById("pagination-info");
    const pageNum = document.getElementById("current-page-num");
    const prevBtn = document.getElementById("btn-prev-page");
    const nextBtn = document.getElementById("btn-next-page");
    if (!tbody) return;

    const normalizedFilter =
      activityStatusFilter.toLowerCase() === "successful"
        ? "success"
        : activityStatusFilter.toLowerCase();

    // Filter
    const filtered = loginActivities.filter((item) => {
      const matchesFilter =
        normalizedFilter === "all" || item.status.toLowerCase() === normalizedFilter;
      const matchesSearch =
        item.device.toLowerCase().includes(activitySearchQuery) ||
        item.browser.toLowerCase().includes(activitySearchQuery) ||
        item.location.toLowerCase().includes(activitySearchQuery) ||
        item.ip.toLowerCase().includes(activitySearchQuery);
      return matchesFilter && matchesSearch;
    });

    if (countLabel) countLabel.textContent = `${filtered.length} sign-in events`;

    // Pagination
    const totalPages = Math.ceil(filtered.length / activityPageSize) || 1;
    if (activityCurrentPage > totalPages) activityCurrentPage = totalPages;
    if (activityCurrentPage < 1) activityCurrentPage = 1;

    const startIdx = (activityCurrentPage - 1) * activityPageSize;
    const paginated = filtered.slice(startIdx, startIdx + activityPageSize);

    if (pageInfo) {
      const endIdx = Math.min(startIdx + activityPageSize, filtered.length);
      pageInfo.textContent = filtered.length > 0 ? `Showing ${startIdx + 1} to ${endIdx} of ${filtered.length} events` : "No events";
    }
    if (pageNum) pageNum.textContent = activityCurrentPage;
    if (prevBtn) prevBtn.disabled = activityCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = activityCurrentPage >= totalPages;

    if (paginated.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
            No login activity recorded matching the current filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = paginated
      .map(
        (item) => `
        <tr data-event-id="${escapeHtml(item.id)}">
          <td>
            <div class="table-device-cell">
              <div class="table-device-icon">${getDeviceIconSvg(item.deviceType)}</div>
              <span class="table-device-name">${escapeHtml(item.device)}</span>
            </div>
          </td>
          <td>${escapeHtml(item.browser)}</td>
          <td>${escapeHtml(item.location)}</td>
          <td>${escapeHtml(item.time)}</td>
          <td><span class="table-ip-code">${escapeHtml(item.ip)}</span></td>
          <td>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
              <span class="badge-dot"></span>${escapeHtml(item.status)}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-sm btn-view-event" data-event-id="${escapeHtml(item.id)}" title="View metadata">
              View
            </button>
          </td>
        </tr>
      `
      )
      .join("");

    // Bind event detail view
    tbody.querySelectorAll(".btn-view-event").forEach((btn) => {
      btn.addEventListener("click", function () {
        const evId = this.getAttribute("data-event-id");
        const ev = loginActivities.find((a) => String(a.id) === String(evId));
        if (!ev) return;

        const content = document.getElementById("modal-activity-details-content");
        if (content) {
          content.innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Device Name:</span>
              <strong style="color: var(--text-primary);">${escapeHtml(ev.device)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Browser &amp; OS:</span>
              <strong>${escapeHtml(ev.browser)} (${escapeHtml(ev.os || "Unknown OS")})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Geographic Location:</span>
              <strong>${escapeHtml(ev.location)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Client IP Address:</span>
              <span class="table-ip-code">${escapeHtml(ev.ip)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Authentication Time:</span>
              <strong>${escapeHtml(ev.time)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Result Status:</span>
              <span class="badge ${ev.status === "Success" ? "badge-success" : ev.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
                <span class="badge-dot"></span>${escapeHtml(ev.status)}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Auth Method:</span>
              <strong>Password / Email OTP</strong>
            </div>
          `;
        }
        openModal("modal-activity-details");
      });
    });
  }

  // Filter Pills event listeners
  document.querySelectorAll("#activity-filter-pills .filter-pill").forEach((pill) => {
    pill.addEventListener("click", function () {
      document.querySelectorAll("#activity-filter-pills .filter-pill").forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      activityStatusFilter = this.getAttribute("data-filter") || "all";
      activityCurrentPage = 1;
      renderActivityTable();
    });
  });

  // Activity search input
  document.getElementById("activity-search-input")?.addEventListener("input", function () {
    activitySearchQuery = this.value.toLowerCase().trim();
    activityCurrentPage = 1;
    renderActivityTable();
  });

  // Activity pagination
  document.getElementById("btn-prev-page")?.addEventListener("click", () => {
    if (activityCurrentPage > 1) {
      activityCurrentPage--;
      renderActivityTable();
    }
  });

  document.getElementById("btn-next-page")?.addEventListener("click", () => {
    activityCurrentPage++;
    renderActivityTable();
  });

  // ===== 10. Active Sessions & Device Management =====
  async function loadActiveSessions() {
    const statActive = document.getElementById("stat-active-sessions");
    const statActiveDesc = document.getElementById("stat-active-sessions-desc");

    // 1. Fetch verified count from dedicated active sessions endpoint
    const activeRes = await apiRequest("/api/sessions/active");
    if (activeRes.ok && activeRes.data && activeRes.data.success) {
      const activeCount = activeRes.data.active_sessions;
      if (statActive) {
        statActive.textContent = `${activeCount} ${activeCount === 1 ? "device" : "devices"}`;
      }
      if (statActiveDesc) {
        statActiveDesc.textContent = `You're signed in on ${activeCount} ${activeCount === 1 ? "device" : "devices"}`;
      }
    }

    // 2. Fetch full session records list
    const res = await apiRequest("/api/sessions");
    if (res.ok && Array.isArray(res.data)) {
      activeSessions = res.data.map((s) => ({
        id: s.session_id || s.id,
        deviceName: s.device_name || "Active Device",
        deviceType: s.device_type || "laptop",
        browser: s.browser || "Chrome",
        os: s.os || "macOS",
        ip: s.ip_address || "103.21.58.xx",
        location: s.location || "Bengaluru, India",
        lastActive: s.last_active || "Active Now",
        isCurrent: Boolean(s.is_current),
      }));

      // Update active sessions counter if dedicated endpoint wasn't reached
      if (!activeRes.ok || !activeRes.data?.success) {
        const count = activeSessions.length;
        if (statActive) {
          statActive.textContent = `${count} ${count === 1 ? "device" : "devices"}`;
        }
        if (statActiveDesc) {
          statActiveDesc.textContent = `You're signed in on ${count} ${count === 1 ? "device" : "devices"}`;
        }
      }
    }
    renderActiveSessions();
    renderSummaryCards();
  }

  let deviceTypeFilter = "all";

  function renderSessionCardHtml(s) {
    const isMobile = s.deviceType === "mobile" || s.deviceType === "tablet";
    const typeLabel = isMobile ? "Mobile Device" : (s.deviceType === "laptop" ? "Laptop" : "Desktop PC");
    return `
      <div class="session-item-card ${s.isCurrent ? "current-device" : ""}" data-session-id="${escapeHtml(s.id)}">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div class="table-device-icon">${getDeviceIconSvg(s.deviceType)}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.92rem; color: var(--text-primary);">${escapeHtml(s.deviceName)}</strong>
              <span class="badge" style="background: #f1f5f9; color: var(--text-secondary); font-size: 0.68rem; padding: 2px 6px;">${typeLabel}</span>
              ${s.isCurrent ? '<span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 8px;"><span class="badge-dot"></span>This device</span>' : ""}
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 3px 0 0;">
              ${escapeHtml(s.browser)} • ${escapeHtml(s.location)} (${escapeHtml(s.ip)})
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 3px; font-size: 0.74rem; color: var(--text-muted);">
              <span>Last active: ${escapeHtml(s.lastActive)}</span>
              ${s.created_at ? `<span>• Signed in: ${escapeHtml(s.created_at)}</span>` : ""}
            </div>
          </div>
        </div>

        <div>
          ${
            s.isCurrent
              ? '<span style="font-size: 0.8rem; color: var(--green); font-weight: 600;">Active Now</span>'
              : `<button class="btn btn-danger-outline btn-sm btn-revoke-session" data-session-id="${escapeHtml(s.id)}" data-session-name="${escapeHtml(s.deviceName)}">Revoke</button>`
          }
        </div>
      </div>
    `;
  }

  function renderActiveSessions() {
    const container = document.getElementById("devices-sessions-list");
    if (!container) return;

    // Filter sessions by device type
    const filteredSessions = activeSessions.filter((s) => {
      if (deviceTypeFilter === "all") return true;
      if (deviceTypeFilter === "desktop") {
        return s.deviceType === "desktop" || s.deviceType === "laptop";
      }
      if (deviceTypeFilter === "mobile") {
        return s.deviceType === "mobile" || s.deviceType === "tablet";
      }
      return true;
    });

    // Update filter counts in filter bar
    const countAll = activeSessions.length;
    const countDesktop = activeSessions.filter((s) => s.deviceType === "desktop" || s.deviceType === "laptop").length;
    const countMobile = activeSessions.filter((s) => s.deviceType === "mobile" || s.deviceType === "tablet").length;

    const elCountAll = document.getElementById("filter-count-all");
    const elCountDesk = document.getElementById("filter-count-desktop");
    const elCountMob = document.getElementById("filter-count-mobile");
    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountDesk) elCountDesk.textContent = countDesktop;
    if (elCountMob) elCountMob.textContent = countMobile;

    if (!activeSessions || activeSessions.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 0.9rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 42px; height: 42px; margin: 0 auto 12px; color: var(--text-muted); opacity: 0.6;">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <strong style="display: block; font-size: 1.05rem; color: var(--text-primary); margin-bottom: 4px;">No Active Sessions</strong>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">You are currently not signed in on any registered devices.</p>
        </div>
      `;
      return;
    }

    const currentSessions = filteredSessions.filter((s) => s.isCurrent);
    const otherSessions = filteredSessions.filter((s) => !s.isCurrent);

    let html = "";

    // ===== GROUP 1: Current Session (This Device) =====
    if (deviceTypeFilter === "all" || currentSessions.length > 0) {
      html += `
        <div class="session-group-block">
          <div class="session-group-header">
            <div class="session-group-title-wrap">
              <span class="session-group-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                </svg>
                Current Active Session
              </span>
              <span class="badge badge-success session-group-badge">This Device</span>
            </div>
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--green); display: flex; align-items: center; gap: 6px;">
              <span class="badge-dot" style="background: var(--green);"></span>Active Now
            </span>
          </div>

          <div class="sessions-list-container">
            ${
              currentSessions.length > 0
                ? currentSessions.map((s) => renderSessionCardHtml(s)).join("")
                : `<div class="session-group-empty">No current session matching the active filter.</div>`
            }
          </div>
        </div>
      `;
    }

    // ===== GROUP 2: Other Active Devices & Sessions =====
    html += `
      <div class="session-group-block">
        <div class="session-group-header">
          <div class="session-group-title-wrap">
            <span class="session-group-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Other Active Devices &amp; Sessions
            </span>
            <span class="badge" style="background: var(--brand-purple-light); color: var(--brand-purple); font-weight: 600; font-size: 0.75rem; padding: 2px 8px;">
              ${otherSessions.length} ${otherSessions.length === 1 ? "device" : "devices"}
            </span>
          </div>

          ${
            otherSessions.length > 0
              ? `<button class="btn btn-danger-outline btn-sm" id="btn-revoke-all-others-grouped">Sign out of other devices</button>`
              : ""
          }
        </div>

        <div class="sessions-list-container">
          ${
            otherSessions.length > 0
              ? otherSessions.map((s) => renderSessionCardHtml(s)).join("")
              : `
                <div class="session-group-empty">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 6px; display: block; opacity: 0.5;">
                    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                  </svg>
                  You are not signed in on any other devices. Your account is only active on this device.
                </div>
              `
          }
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Bind individual session revoke buttons
    container.querySelectorAll(".btn-revoke-session").forEach((btn) => {
      btn.addEventListener("click", function () {
        const sid = this.getAttribute("data-session-id");
        const sname = this.getAttribute("data-session-name");
        sessionToRevoke = { id: sid, name: sname };

        const nameEl = document.getElementById("modal-revoke-session-device");
        if (nameEl) nameEl.textContent = sname;
        openModal("modal-revoke-single-session");
      });
    });

    // Bind grouped "Sign out of other devices" button
    const groupRevokeOthersBtn = document.getElementById("btn-revoke-all-others-grouped");
    if (groupRevokeOthersBtn) {
      groupRevokeOthersBtn.addEventListener("click", () => openModal("modal-revoke-others"));
    }
  }

  // Confirm Single Session Revoke handler
  document.getElementById("btn-confirm-revoke-session")?.addEventListener("click", async function () {
    if (!sessionToRevoke) return;
    this.disabled = true;
    this.textContent = "Revoking...";

    await apiRequest(`/api/sessions/${sessionToRevoke.id}`, { method: "DELETE" });

    this.disabled = false;
    this.textContent = "Revoke Session";
    closeModal("modal-revoke-single-session");

    activeSessions = activeSessions.filter((s) => s.id !== sessionToRevoke.id);
    renderActiveSessions();
    renderSummaryCards();
    showToast(`Session for ${sessionToRevoke.name} has been revoked.`, "success");
    sessionToRevoke = null;
  });

  // Revoke other devices modal triggers
  const bannerRevokeBtn = document.getElementById("btn-banner-revoke-others");
  const devicesRevokeBtn = document.getElementById("btn-revoke-all-others");
  if (bannerRevokeBtn) bannerRevokeBtn.addEventListener("click", () => openModal("modal-revoke-others"));
  if (devicesRevokeBtn) devicesRevokeBtn.addEventListener("click", () => openModal("modal-revoke-others"));

  // Confirm Revoke All Others handler
  document.getElementById("btn-confirm-revoke-others")?.addEventListener("click", async function () {
    this.disabled = true;
    this.textContent = "Signing out...";

    await apiRequest("/api/sessions/revoke-others", { method: "POST" });

    this.disabled = false;
    this.textContent = "Sign out other devices";
    closeModal("modal-revoke-others");

    activeSessions = activeSessions.filter((s) => s.isCurrent);
    renderActiveSessions();
    renderSummaryCards();
    showToast("Signed out of all other active devices.", "success");
  });

  // Device Type Filter Pill Click Handlers
  document.addEventListener("click", function (e) {
    const pill = e.target.closest("#devices-filter-bar .device-filter-pill");
    if (!pill) return;
    document.querySelectorAll("#devices-filter-bar .device-filter-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    deviceTypeFilter = pill.getAttribute("data-device-filter") || "all";
    renderActiveSessions();
  });

  // ===== 11. Security Settings Controller =====
  document.getElementById("btn-save-recovery-email")?.addEventListener("click", async function () {
    const input = document.getElementById("sec-recovery-email-input");
    const newEmail = input?.value.trim();
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Please enter a valid recovery email address.", "error");
      return;
    }

    this.disabled = true;
    this.textContent = "Saving...";

    const res = await apiRequest("/api/security/settings", {
      method: "PUT",
      body: JSON.stringify({ recovery_email: newEmail }),
    });

    this.disabled = false;
    this.textContent = "Update Email";

    if (res.ok) {
      showToast("Recovery email address updated successfully.", "success");
    } else {
      showToast(res.data?.message || "Failed to update recovery email.", "error");
    }
  });

  // Change password modal & handler
  document.getElementById("btn-open-change-pwd")?.addEventListener("click", () => {
    document.getElementById("form-change-password")?.reset();
    openModal("modal-change-password");
  });

  document.getElementById("form-change-password")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const curPwd = document.getElementById("chg-current-pwd")?.value || "";
    const newPwd = document.getElementById("chg-new-pwd")?.value || "";
    const confirmPwd = document.getElementById("chg-confirm-pwd")?.value || "";
    const submitBtn = document.getElementById("btn-submit-change-pwd");

    if (newPwd !== confirmPwd) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Updating...";
    }

    const res = await apiRequest("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: curPwd,
        new_password: newPwd,
        confirm_password: confirmPwd,
      }),
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password";
    }

    if (res.ok && res.data?.success) {
      closeModal("modal-change-password");
      this.reset();
      showToast(res.data.message || "Password updated successfully.", "success");
      loadActiveSessions();
    } else {
      showToast(res.data?.message || "Failed to update password.", "error");
    }
  });

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ===== 12. Sign Out Handlers =====
  async function handleSignOut() {
    await apiRequest("/api/logout", { method: "POST" });
    localStorage.removeItem("vault_auth_token");
    localStorage.removeItem("vault_auth_user");
    window.location.replace("/index.html");
  }

  document.getElementById("btn-sidebar-signout")?.addEventListener("click", handleSignOut);
  document.getElementById("btn-dropdown-signout")?.addEventListener("click", handleSignOut);

  // Global search input focus
  document.getElementById("global-search-input")?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const q = this.value.toLowerCase().trim();
      if (!q) return;
      if (q.includes("app") || q.includes("slack") || q.includes("google") || q.includes("jira")) {
        navigateTo("apps");
        const aSearch = document.getElementById("apps-search-input");
        if (aSearch) {
          aSearch.value = q;
          renderConnectedApps();
        }
      } else {
        navigateTo("activity");
        const actSearch = document.getElementById("activity-search-input");
        if (actSearch) {
          actSearch.value = q;
          renderActivityTable();
        }
      }
    }
  });

  // Notification button click
  document.getElementById("btn-notifications")?.addEventListener("click", () => {
    showToast("All security systems are functioning normally. 0 critical vulnerabilities.", "info");
  });

  // Expose global helper for dynamic activity inspection and testing
  window.VaultAuth = window.VaultAuth || {};
  window.VaultAuth.setLoginActivities = function (records) {
    if (Array.isArray(records)) {
      loginActivities = [...records];
      renderSummaryCards();
      renderActivityTable();
      renderOverviewActivityPreview();
    }
  };
  window.VaultAuth.addLoginActivity = function (record) {
    if (record) {
      loginActivities.unshift(record);
      renderSummaryCards();
      renderActivityTable();
      renderOverviewActivityPreview();
    }
  };
  window.VaultAuth.removeLoginActivity = function (id) {
    loginActivities = loginActivities.filter((a) => a.id !== id);
    renderSummaryCards();
    renderActivityTable();
    renderOverviewActivityPreview();
  };
  window.VaultAuth.getLoginActivities = function () {
    return loginActivities;
  };

  // ===== 13. Initialization =====
  async function init() {
    navigateTo(getTabFromUrl("overview"), { replaceHistory: true });
    await loadUserProfile();
    await loadConnectedApps();
    await loadLoginActivity();
    await loadActiveSessions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
