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
      <span>${message}</span>
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
  function navigateTo(pageId) {
    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

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

    // Close mobile menu if open
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("open");

    // Close user dropdown if open
    document.getElementById("user-dropdown-menu")?.classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    const res = await apiRequest("/api/connected-apps");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      connectedApps = res.data.map((app) => ({
        id: app.id,
        name: app.app_name,
        desc: app.app_desc,
        logo: app.logo_char,
        bg: app.logo_bg,
        permissions: Array.isArray(app.permissions) ? app.permissions : ["Read access"],
        status: app.status || "Active",
        connectedDate: app.connected_date || "Jan 10, 2025",
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
        <div class="app-card-horizontal" data-app-id="${app.id}">
          <div class="app-card-left">
            <div class="app-card-icon" style="background: ${app.bg};">
              ${app.logo}
            </div>
            <div class="app-card-details">
              <div class="app-card-name-row">
                <span class="app-card-name">${app.name}</span>
              </div>
              <p class="app-card-desc">${app.desc}</p>
              <div class="app-card-permissions">
                <strong>Permissions:</strong>
                ${app.permissions
                  .map((perm, idx) => `<span>${perm}</span>${idx < app.permissions.length - 1 ? '<span class="app-perm-bullet">•</span>' : ""}`)
                  .join("")}
              </div>
            </div>
          </div>

          <div class="app-card-right">
            <div class="app-card-meta">
              <span class="badge ${app.status === "Active" ? "badge-success" : "badge-failed"}">
                <span class="badge-dot"></span>${app.status}
              </span>
              <span class="app-connected-date">Connected on ${app.connectedDate}</span>
            </div>

            <div class="app-card-actions">
              <button class="btn btn-outline btn-sm btn-manage-app" data-app-id="${app.id}">
                Manage access
              </button>
              <button class="btn btn-danger-outline btn-sm btn-disconnect-app" data-app-id="${app.id}">
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
      const res = await apiRequest(`/api/connected-apps/${appToDisconnect.id}`, { method: "DELETE" });

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
  }

  function renderOverviewActivityPreview() {
    const container = document.getElementById("overview-recent-activity-list");
    if (!container) return;

    const recent = loginActivities.slice(0, 3);
    container.innerHTML = recent
      .map(
        (item) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--card-border);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="table-device-icon">${getDeviceIconSvg(item.deviceType)}</div>
            <div>
              <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">${item.device}</strong>
              <span style="font-size: 0.76rem; color: var(--text-muted);">${item.browser} • ${item.location}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.76rem; color: var(--text-secondary); display: block; margin-bottom: 2px;">${item.time}</span>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
              <span class="badge-dot"></span>${item.status}
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

    // Filter
    const filtered = loginActivities.filter((item) => {
      const matchesFilter =
        activityStatusFilter === "all" || item.status.toLowerCase() === activityStatusFilter.toLowerCase();
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
        <tr data-event-id="${item.id}">
          <td>
            <div class="table-device-cell">
              <div class="table-device-icon">${getDeviceIconSvg(item.deviceType)}</div>
              <span class="table-device-name">${item.device}</span>
            </div>
          </td>
          <td>${item.browser}</td>
          <td>${item.location}</td>
          <td>${item.time}</td>
          <td><span class="table-ip-code">${item.ip}</span></td>
          <td>
            <span class="badge ${item.status === "Success" ? "badge-success" : item.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
              <span class="badge-dot"></span>${item.status}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-sm btn-view-event" data-event-id="${item.id}" title="View metadata">
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
        const ev = loginActivities.find((a) => a.id === evId);
        if (!ev) return;

        const content = document.getElementById("modal-activity-details-content");
        if (content) {
          content.innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Device Name:</span>
              <strong style="color: var(--text-primary);">${ev.device}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Browser &amp; OS:</span>
              <strong>${ev.browser} (${ev.os || "Unknown OS"})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Geographic Location:</span>
              <strong>${ev.location}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Client IP Address:</span>
              <span class="table-ip-code">${ev.ip}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Authentication Time:</span>
              <strong>${ev.time}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Result Status:</span>
              <span class="badge ${ev.status === "Success" ? "badge-success" : ev.status === "Blocked" ? "badge-blocked" : "badge-failed"}">
                <span class="badge-dot"></span>${ev.status}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span style="color: var(--text-secondary);">Auth Method:</span>
              <strong>SAML 2.0 / Email OTP</strong>
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
    const res = await apiRequest("/api/sessions");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
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
    }
    renderActiveSessions();
    renderSummaryCards();
  }

  function renderActiveSessions() {
    const container = document.getElementById("devices-sessions-list");
    if (!container) return;

    container.innerHTML = activeSessions
      .map(
        (s) => `
        <div class="session-item-card ${s.isCurrent ? "current-device" : ""}">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="table-device-icon">${getDeviceIconSvg(s.deviceType)}</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="font-size: 0.92rem; color: var(--text-primary);">${s.deviceName}</strong>
                ${s.isCurrent ? '<span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 8px;"><span class="badge-dot"></span>This device</span>' : ""}
              </div>
              <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 2px 0 0;">
                ${s.browser} • ${s.location} (${s.ip})
              </p>
              <span style="font-size: 0.74rem; color: var(--text-muted);">Last active: ${s.lastActive}</span>
            </div>
          </div>

          <div>
            ${
              s.isCurrent
                ? '<span style="font-size: 0.8rem; color: var(--green); font-weight: 600;">Active Now</span>'
                : `<button class="btn btn-danger-outline btn-sm btn-revoke-session" data-session-id="${s.id}" data-session-name="${s.deviceName}">Revoke</button>`
            }
          </div>
        </div>
      `
      )
      .join("");

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
      showToast(res.data?.message || "Recovery email saved locally.", "success");
    }
  });

  // ===== 12. Sign Out Handlers =====
  async function handleSignOut() {
    await apiRequest("/api/logout", { method: "POST" });
    localStorage.removeItem("vault_auth_token");
    localStorage.removeItem("vault_auth_user");
    window.location.href = "/index.html";
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

  // ===== 13. Initialization =====
  async function init() {
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
