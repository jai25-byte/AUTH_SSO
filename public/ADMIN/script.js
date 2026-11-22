/**
 * VaultAuth SSO — Admin Dashboard
 *
 * Front-end controller for the admin workspace.
 * Handles navigation, mobile menu, and interactive elements.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  //  Configuration & token helpers
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

  async function api(endpoint, opts = {}) {
    const token = getToken();
    const headers = new Headers(opts.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const url = `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, { ...opts, headers, credentials: "include" });
      if (res.status === 401) {
        console.warn("[VaultAuth Admin] Unauthenticated or token expired.");
      }
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error(`[VaultAuth Admin] fetch ${endpoint} failed:`, err);
      return { ok: false, status: 0, data: null, error: err.message };
    }
  }


  // ---------------------------------------------------------------------------
  //  Navigation — sidebar links & data-goto
  // ---------------------------------------------------------------------------

  function switchPage(pageId) {
    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.style.display = "block";

    document.querySelectorAll(".nav-item").forEach((link) => {
      link.classList.toggle("active", link.dataset.page === pageId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (link.dataset.page) switchPage(link.dataset.page);
    });
  });

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
  //  Admin profile loader
  // ---------------------------------------------------------------------------

  async function loadAdminProfile() {
    const res = await api("/api/user/profile");
    let user = res.ok ? res.data : null;

    if (!user) {
      user = getStoredUser() || {
        full_name: "Amitoj Singh",
        email: "amitoj0024@gmail.com",
        role: "Administrator",
      };
    }

    const nameEl = document.getElementById("admin-user-name");
    const roleEl = document.getElementById("admin-user-role");

    if (nameEl) nameEl.textContent = user.full_name || user.username || "Admin";
    if (roleEl) roleEl.textContent = user.role || "Administrator";

    // Update avatar initials
    const avatar = document.querySelector(".user-pill .avatar");
    if (avatar) {
      const name = user.full_name || user.username || "Admin";
      const parts = name.split(" ");
      avatar.textContent = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
  }


  // ---------------------------------------------------------------------------
  //  Admin dashboard data loaders
  // ---------------------------------------------------------------------------

  async function loadAdminOverview() {
    const res = await api("/api/admin/overview");
    if (!res.ok || !res.data) return;

    const d = res.data;

    // Update stat cards if data available
    if (d.total_users !== undefined) {
      setText("stat-total-users", d.total_users.toLocaleString());
    }
    if (d.active_users !== undefined) {
      setText("stat-active-users", d.active_users.toLocaleString());
    }
    if (d.active_sessions !== undefined) {
      setText("stat-active-sessions", d.active_sessions.toLocaleString());
      setText("sessions-count", d.active_sessions.toLocaleString());
    }
    if (d.connected_apps !== undefined) {
      setText("stat-connected-apps", d.connected_apps.toString());
    }
    if (d.failed_logins !== undefined) {
      setText("stat-failed-logins", d.failed_logins.toString());
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value;
  }


  // ---------------------------------------------------------------------------
  //  Revoke session buttons
  // ---------------------------------------------------------------------------

  document.addEventListener("click", (e) => {
    const revokeBtn = e.target.closest(".btn-revoke");
    if (!revokeBtn) return;

    if (!confirm("Are you sure you want to revoke this session?")) return;

    const row = revokeBtn.closest("tr");
    if (row) {
      row.style.opacity = "0.4";
      row.style.pointerEvents = "none";
      revokeBtn.textContent = "Revoked";
    }
  });


  // ---------------------------------------------------------------------------
  //  Sign out
  // ---------------------------------------------------------------------------

  const signoutBtn = document.getElementById("btn-admin-signout");
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
  //  Boot
  // ---------------------------------------------------------------------------

  async function boot() {
    await loadAdminProfile();
    await loadAdminOverview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
