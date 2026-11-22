/**
 * VaultAuth SSO — End User Dashboard
 *
 * Front-end controller that powers every page in the dashboard.
 * Talks to the Flask backend for live data, but falls back
 * gracefully to sensible defaults when the API is unreachable
 * (so you can still eyeball the UI during local development).
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  //  Configuration & token helpers
  // ---------------------------------------------------------------------------

  const API_BASE = (() => {
    const { port } = window.location;
    // Both the Flask dev server (5000) and the Bun proxy (3000) work without a prefix
    if (port === "5000" || port === "3000") return "";
    return "http://127.0.0.1:5000";
  })();

  /** Pull the JWT from the URL (first visit) or localStorage (return visit). */
  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("token");

    if (fromUrl) {
      localStorage.setItem("vault_auth_token", fromUrl);
      // Strip the query string so it doesn't hang around in the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      return fromUrl;
    }

    return localStorage.getItem("vault_auth_token") || null;
  }

  /** Quick grab of the cached user object we stash after login. */
  function getStoredUser() {
    try {
      const raw = localStorage.getItem("vault_auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Thin wrapper around fetch — attaches the token and handles JSON. */
  async function api(endpoint, opts = {}) {
    const token = getToken();
    const headers = new Headers(opts.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const url = `${API_BASE}${endpoint}`;

    try {
      const res = await fetch(url, { ...opts, headers, credentials: "include" });

      if (res.status === 401) {
        console.warn("[VaultAuth] Unauthenticated or token expired.");
      }

      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error(`[VaultAuth] fetch ${endpoint} failed:`, err);
      return { ok: false, status: 0, data: null, error: err.message };
    }
  }


  // ---------------------------------------------------------------------------
  //  SVG icon factory — returns the right device graphic for each row
  // ---------------------------------------------------------------------------

  function deviceIconHtml(type) {
    const svgMap = {
      mobile: `<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>`,
      laptop: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/>`,
    };
    const fallback = `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`;
    const css = type === "mobile" ? "mobile" : type === "laptop" ? "laptop" : "desktop";

    return `
      <div class="device-icon ${css}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${svgMap[type] || fallback}
        </svg>
      </div>`;
  }


  // ---------------------------------------------------------------------------
  //  Navigation — sidebar links, quick-action cards, data-goto attributes
  // ---------------------------------------------------------------------------

  function switchPage(pageId) {
    // Hide every page, then reveal the target
    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.style.display = "block";

    // Highlight the matching sidebar link
    document.querySelectorAll(".nav-item").forEach((link) => {
      link.classList.toggle("active", link.dataset.page === pageId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Sidebar clicks
  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (link.dataset.page) switchPage(link.dataset.page);
    });
  });

  // Any element with data-goto="<page>" acts as a cross-page link
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto]");
    if (trigger) {
      e.preventDefault();
      switchPage(trigger.dataset.goto);
    }
  });

  // Mobile hamburger toggle
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


  // ---------------------------------------------------------------------------
  //  User profile — populates topbar, greeting, and "My profile" page
  // ---------------------------------------------------------------------------

  async function loadUserProfile() {
    const res = await api("/api/user/profile");
    let user = res.ok ? res.data : null;

    // Sensible fallback so the UI still looks good without a backend
    if (!user) {
      user = getStoredUser() || {
        full_name: "Amitoj Singh",
        username: "amitoj",
        email: "amitoj0024@gmail.com",
        initials: "AS",
        role: "End user",
        department: "Engineering",
        phone: "Not set",
        joined: "March 15, 2025",
        security: {
          mfa_enabled: true,
          recovery_email: "amitoj0024@gmail.com",
          password_changed_desc: "Last changed 0 days ago",
        },
      };
    }

    const firstName = (user.full_name || user.username || "Amitoj").split(" ")[0];
    const initials = user.initials || firstName.substring(0, 2).toUpperCase();

    // -- Top bar --
    const topAvatar = document.querySelector(".user-pill .avatar");
    const topName = document.querySelector(".user-pill .user-name");
    const topRole = document.querySelector(".user-pill .user-role");
    if (topAvatar) topAvatar.textContent = initials;
    if (topName) topName.textContent = user.email || user.full_name || user.username;
    if (topRole) topRole.textContent = user.role || "End user";

    // -- Greeting on the Overview page --
    const hour = new Date().getHours();
    const greetWord = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const greetEl = document.getElementById("overview-greeting");
    if (greetEl) greetEl.textContent = `Good ${greetWord}, ${firstName} 👋`;

    // -- Profile page fields --
    setText("profile-avatar", initials);
    setText("profile-name", user.full_name || user.username);
    setText("profile-email", user.email);
    setText("field-fullname", user.full_name || user.username);
    setText("field-email", user.email);
    setText("field-phone", user.phone || "Not set");
    setText("field-dept", user.department || "Engineering");
    setText("field-role", user.role || "End user");
    setText("field-joined", user.joined || "March 15, 2025");

    // -- Security section on profile page --
    if (user.security) {
      setText("sec-pwd-desc", user.security.password_changed_desc);
      setText("sec-recovery-email", user.security.recovery_email);
    }
  }

  /** Tiny helper so we don't repeat getElementById + null-check everywhere. */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value;
  }


  // ---------------------------------------------------------------------------
  //  Overview statistics (session count, security score, app count)
  // ---------------------------------------------------------------------------

  async function loadOverviewStats() {
    const res = await api("/api/dashboard/overview");
    if (!res.ok || !res.data) return;

    const d = res.data;

    // Active sessions card
    setText("stat-active-sessions", d.active_sessions?.label);
    setText("stat-active-sessions-desc", d.active_sessions?.description);

    // Security score card
    setText("stat-security-score", d.security_score?.label);
    setText("stat-security-score-desc", d.security_score?.description);

    // System-wide status badge
    const badge = document.getElementById("overview-status-badge");
    if (badge && d.system_status) {
      badge.innerHTML = `<span class="status-dot"></span>${d.system_status.status}`;
      if (d.system_status.all_systems_normal) {
        badge.className = "status-badge status-normal";
      } else {
        badge.className = "status-badge";
        badge.style.background = "#fef3c7";
        badge.style.color = "#92400e";
      }
    }

    // Connected apps card
    setText("stat-connected-apps", d.connected_apps?.label);
    setText("stat-connected-apps-desc", d.connected_apps?.description);
  }


  // ---------------------------------------------------------------------------
  //  Login activity — table + overview mini-list
  // ---------------------------------------------------------------------------

  let allActivity = [];

  async function loadLoginActivity(statusFilter = null) {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    const res = await api(`/api/dashboard/login-activity${qs}`);
    if (!res.ok || !Array.isArray(res.data)) return;

    allActivity = res.data;
    renderOverviewActivity(allActivity.slice(0, 3));
    renderActivityTable(allActivity);

    // Update the event counter
    const countEl = document.getElementById("event-count");
    if (countEl) countEl.textContent = `${allActivity.length} sign-in events`;
  }

  function statusBadgeClass(status) {
    if (status === "Success") return "badge-success";
    if (status === "Blocked") return "badge-blocked";
    return "badge-failed";
  }

  function renderOverviewActivity(items) {
    const container = document.getElementById("overview-activity-list");
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<p style="padding:16px;font-size:0.9rem;color:var(--text-secondary)">No recent activity found.</p>`;
      return;
    }

    container.innerHTML = items
      .map(
        (i) => `
        <div class="activity-item">
          ${deviceIconHtml(i.device_type)}
          <div class="activity-details">
            <span class="device-name">${i.device_name}</span>
            <span class="device-meta">${i.meta || `${i.browser} • ${i.location}`}</span>
          </div>
          <div class="activity-time">
            <span class="time-text">${i.time_formatted}</span>
            <span class="badge ${statusBadgeClass(i.status)}">● ${i.status}</span>
          </div>
        </div>`
      )
      .join("");
  }

  function renderActivityTable(items) {
    const tbody = document.getElementById("activity-table-body");
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary)">No login activity recorded matching this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map(
        (i) => `
        <tr>
          <td>
            <div class="table-device">
              ${deviceIconHtml(i.device_type)}
              ${i.device_name}
            </div>
          </td>
          <td>${i.browser}</td>
          <td>${i.location}</td>
          <td>${i.time_formatted}</td>
          <td><code>${i.ip_address}</code></td>
          <td><span class="badge ${statusBadgeClass(i.status)}">● ${i.status}</span></td>
        </tr>`
      )
      .join("");
  }

  // Filter tab buttons
  document.querySelectorAll(".activity-filters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".activity-filters .filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filter = this.dataset.filter || this.textContent.trim().toLowerCase();
      loadLoginActivity(filter === "all" ? null : filter);
    });
  });


  // ---------------------------------------------------------------------------
  //  Active sessions — rendered inside the Login Activity page
  // ---------------------------------------------------------------------------

  async function loadActiveSessions() {
    const res = await api("/api/sessions");
    const container = document.getElementById("active-sessions-list");
    if (!container) return;

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      container.innerHTML = `<p style="padding:12px;font-size:0.9rem;color:var(--text-secondary)">No active sessions found.</p>`;
      return;
    }

    container.innerHTML = res.data
      .map(
        (s) => `
        <div class="activity-item" style="padding:12px 14px;border-radius:var(--radius);border:1px solid var(--card-border);margin-bottom:8px;">
          ${deviceIconHtml(s.device_type)}
          <div class="activity-details" style="flex:1">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="device-name">${s.device_name}</span>
              ${s.is_current ? '<span class="badge badge-success" style="font-size:0.72rem;padding:2px 8px">This device</span>' : ""}
            </div>
            <span class="device-meta">${s.browser} • ${s.location} (IP: ${s.ip_address})</span>
            <span class="device-meta" style="font-size:0.75rem;color:var(--text-muted)">Signed in: ${s.created_at} • Last active: ${s.last_active}</span>
          </div>
          <div>
            ${
              s.is_current
                ? '<span style="font-size:0.8rem;color:var(--green);font-weight:600">Active Now</span>'
                : `<button class="btn btn-danger-outline btn-sm btn-revoke-session" data-session-id="${s.session_id}">Revoke</button>`
            }
          </div>
        </div>`
      )
      .join("");

    // Wire up per-session revoke buttons
    container.querySelectorAll(".btn-revoke-session").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const sid = this.dataset.sessionId;
        if (!sid) return;

        this.disabled = true;
        this.textContent = "Revoking...";

        const del = await api(`/api/sessions/${sid}`, { method: "DELETE" });
        if (del.ok) {
          loadActiveSessions();
          loadOverviewStats();
        } else {
          alert(del.data?.message || "Failed to revoke session.");
          this.disabled = false;
          this.textContent = "Revoke";
        }
      });
    });
  }

  // "Sign out of other devices" button
  const revokeOthersBtn = document.getElementById("btn-revoke-others");
  if (revokeOthersBtn) {
    revokeOthersBtn.addEventListener("click", async function () {
      if (!confirm("Are you sure you want to sign out of all other devices?")) return;

      this.disabled = true;
      this.textContent = "Signing out others...";

      const res = await api("/api/sessions/revoke-others", { method: "POST" });

      this.disabled = false;
      this.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out of other devices`;

      if (res.ok) {
        alert(res.data?.message || "All other sessions have been signed out.");
        loadActiveSessions();
        loadOverviewStats();
      } else {
        alert(res.data?.message || "Failed to sign out other sessions.");
      }
    });
  }


  // ---------------------------------------------------------------------------
  //  Connected apps — list view matching the Figma
  // ---------------------------------------------------------------------------

  async function loadConnectedApps() {
    const res = await api("/api/connected-apps");
    const grid = document.getElementById("connected-apps-grid");
    const heading = document.getElementById("apps-count-heading");
    if (!grid) return;

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      grid.innerHTML = `<div class="app-row" style="justify-content:center;color:var(--text-secondary)">No third-party applications currently connected.</div>`;
      if (heading) heading.innerHTML = `<strong>0</strong> active connections`;
      return;
    }

    const apps = res.data;
    if (heading) {
      heading.innerHTML = `<strong>${apps.length}</strong> active connections`;
    }

    grid.innerHTML = apps
      .map(
        (app) => `
        <div class="app-row" id="app-card-${app.id}">
          <div class="app-row-left">
            <div class="app-logo-circle" style="background:${app.logo_bg || "#8b5cf6"};color:#fff">${app.logo_char || "A"}</div>
            <div class="app-row-info">
              <h3 class="app-name">${app.app_name}</h3>
              <p class="app-category">${app.app_desc}</p>
              <p class="app-perms">Permissions: ${(app.permissions || []).join(" · ")}</p>
            </div>
          </div>
          <div class="app-row-right">
            <div class="app-status-col">
              <span class="badge ${app.status === "Active" ? "badge-success" : "badge-failed"}">${app.status}</span>
              <span class="app-connected-label">Connected date</span>
              <span class="app-connected-date">${app.connected_date}</span>
            </div>
            <button class="btn-revoke-text btn-revoke-app" data-app-id="${app.id}">Revoke access</button>
          </div>
        </div>`
      )
      .join("");

    // Wire up revoke buttons
    grid.querySelectorAll(".btn-revoke-app").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const appId = this.dataset.appId;
        if (!appId) return;
        if (!confirm("Are you sure you want to revoke access for this application?")) return;

        this.disabled = true;
        this.textContent = "Revoking...";

        const del = await api(`/api/connected-apps/${appId}`, { method: "DELETE" });
        if (del.ok) {
          loadConnectedApps();
          loadOverviewStats();
        } else {
          alert(del.data?.message || "Failed to disconnect application.");
          this.disabled = false;
          this.textContent = "Revoke access";
        }
      });
    });
  }


  // ---------------------------------------------------------------------------
  //  Security checklist (overview card)
  // ---------------------------------------------------------------------------

  async function loadSecurityChecklist() {
    const res = await api("/api/security/checklist");
    const container = document.getElementById("overview-checklist");
    const badge = document.getElementById("overview-checklist-badge");
    if (!container || !res.ok || !res.data) return;

    const data = res.data;

    if (badge && data.badge) {
      badge.textContent = data.badge;
      const cls =
        data.badge === "GOOD" ? "badge-good" : data.badge === "FAIR" ? "badge-failed" : "badge-blocked";
      badge.className = `badge ${cls}`;
    }

    if (Array.isArray(data.items)) {
      container.innerHTML = data.items
        .map(
          (item) => `
          <li class="checklist-item">
            <div class="check-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="${item.enabled ? "#16a34a" : "#e5e7eb"}"/>
                <path d="M9 12l2 2 4-4" stroke="${item.enabled ? "#fff" : "#9ca3af"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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


  // ---------------------------------------------------------------------------
  //  Profile-page action handlers
  // ---------------------------------------------------------------------------

  // Update recovery email
  const updateRecoveryBtn = document.getElementById("btn-update-recovery");
  if (updateRecoveryBtn) {
    updateRecoveryBtn.addEventListener("click", async function () {
      const current = document.getElementById("sec-recovery-email")?.textContent || "";
      const newEmail = prompt("Enter your updated recovery email address:", current);

      if (!newEmail || !newEmail.includes("@")) {
        if (newEmail !== null) alert("Please enter a valid email address.");
        return;
      }

      this.disabled = true;
      this.textContent = "Saving...";

      const res = await api("/api/security/settings", {
        method: "PUT",
        body: JSON.stringify({ recovery_email: newEmail.trim() }),
      });

      this.disabled = false;
      this.innerHTML = 'Update recovery email <span class="arrow-right">›</span>';

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

  // Refresh profile
  const refreshBtn = document.getElementById("btn-edit-profile");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadUserProfile();
      alert("Profile data reloaded from VaultAuth identity service.");
    });
  }

  // Sign out
  const signoutBtn = document.getElementById("btn-dashboard-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await api("/api/logout", { method: "POST" });
      localStorage.removeItem("vault_auth_token");
      localStorage.removeItem("vault_auth_user");
      window.location.href = "/index.html";
    });
  }


  // ---------------------------------------------------------------------------
  //  Boot sequence — kick everything off once the DOM is ready
  // ---------------------------------------------------------------------------

  async function boot() {
    await loadUserProfile();
    // Fire the remaining fetches in parallel — they don't depend on each other
    await Promise.all([
      loadOverviewStats(),
      loadSecurityChecklist(),
      loadLoginActivity(),
      loadActiveSessions(),
      loadConnectedApps(),
    ]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
