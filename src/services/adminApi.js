/**
 * VaultAuth SSO - Admin Dashboard API Service Layer
 * Fully integrated with Flask Backend RBAC Endpoints
 */

const DEFAULT_SERVER = "http://127.0.0.1:5000";
let workingBase = null;

const FLASK_SESSION_TOKEN = /^[a-f0-9]{32}\.\d{9,11}\.[a-f0-9]{64}$/i;

export const getToken = () => {
  if (typeof window === "undefined") return null;
  // Check URL token parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const qToken = urlParams.get("token");
  const token = qToken || localStorage.getItem("vault_auth_token");
  if (!token) return null;
  if (!FLASK_SESSION_TOKEN.test(token)) {
    localStorage.removeItem("vault_auth_token");
    localStorage.removeItem("vault_auth_user");
    return null;
  }
  if (qToken) {
    localStorage.setItem("vault_auth_token", qToken);
  }
  return token;
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("vault_auth_token", token);
  } else {
    localStorage.removeItem("vault_auth_token");
  }
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vault_auth_token");
  localStorage.removeItem("vault_auth_user");
};

async function adminRequest(endpoint, options = {}) {
  const candidates = [
    workingBase,
    "",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
  ].filter((c) => c !== null && c !== undefined);

  const uniqueCandidates = [...new Set(candidates)];
  const method = (options.method || "GET").toUpperCase();
  const canRetry = ["GET", "HEAD", "OPTIONS"].includes(method);
  let lastError = null;

  for (const base of uniqueCandidates) {
    const url = `${base}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
      headers.set("Content-Type", "application/json");
    }

    const token = getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let receivedResponse = false;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
      receivedResponse = true;

      if (response.status === 502 && canRetry && uniqueCandidates.length > 1) {
        try { await response.body?.cancel(); } catch { /* already consumed */ }
        lastError = new Error("Dev proxy 502 Bad Gateway");
        continue;
      }

      workingBase = base;
      const contentType = response.headers.get("content-type") || "";
      let data = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const errorMsg =
          (data && typeof data === "object" && data.message) ||
          (typeof data === "string" && data) ||
          `HTTP Error ${response.status}: ${response.statusText}`;

        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      lastError = err;
      // Writes must never be replayed; nor may a request that already got a
      // response (parse error / HTTP error), since the server may have acted.
      if (!canRetry || receivedResponse || err.status) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to reach VaultAuth API service.");
}

// 1. Current user role check
export async function getCurrentUserRole() {
  return await adminRequest("/api/user/role", { method: "GET" });
}

// 2. Dashboard overview statistics
export async function getAdminStats() {
  return await adminRequest("/api/admin/dashboard/stats", { method: "GET" });
}

// 3. User management (paginated, filtered, searchable)
export async function getAdminUsers({ search = "", role = "all", status = "all", page = 1, per_page = 20 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
    paginate: "true",
  });
  if (search) query.set("search", search);
  if (role && role !== "all") query.set("role", role);
  if (status && status !== "all") query.set("status", status);

  return await adminRequest(`/api/admin/users?${query.toString()}`, { method: "GET" });
}

export async function createAdminUser(userData) {
  return await adminRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateAdminUser(uid, data) {
  return await adminRequest(`/api/admin/users/${uid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleUserStatus(uid, is_active) {
  return await adminRequest(`/api/admin/users/${uid}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active }),
  });
}

export async function deleteAdminUser(uid) {
  return await adminRequest(`/api/admin/users/${uid}`, {
    method: "DELETE",
  });
}

export async function updateUserRole(uid, role) {
  return await adminRequest(`/api/admin/users/${uid}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// 4. Roles & Permissions (RBAC)
export async function getAdminRoles() {
  return await adminRequest("/api/admin/roles", { method: "GET" });
}

// 5. Active Sessions Management
export async function getAdminSessions({ search = "", status = "all", page = 1, per_page = 20 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
  });
  if (search) query.set("search", search);
  if (status && status !== "all") query.set("status", status);

  return await adminRequest(`/api/admin/sessions?${query.toString()}`, { method: "GET" });
}

export async function revokeAdminSession(sessionId) {
  return await adminRequest(`/api/admin/sessions/${encodeURIComponent(sessionId)}/revoke`, {
    method: "POST",
  });
}

export async function revokeAllUserSessions(uid) {
  return await adminRequest(`/api/admin/users/${uid}/sessions/revoke-all`, {
    method: "POST",
  });
}

// 6. Login Activity Monitoring
export async function getAdminLoginActivity({ search = "", status = "all", date_from = "", date_to = "", page = 1, per_page = 25 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
  });
  if (search) query.set("search", search);
  if (status && status !== "all") query.set("status", status);
  if (date_from) query.set("date_from", date_from);
  if (date_to) query.set("date_to", date_to);

  return await adminRequest(`/api/admin/login-activity?${query.toString()}`, { method: "GET" });
}

// 7. Security & Audit Logs
export async function getAdminAuditLogs({ search = "", event = "all", page = 1, per_page = 25 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
  });
  if (search) query.set("search", search);
  if (event && event !== "all") query.set("event", event);

  return await adminRequest(`/api/admin/audit-logs?${query.toString()}`, { method: "GET" });
}

// 8. System Settings
export async function getAdminSettings() {
  return await adminRequest("/api/admin/settings", { method: "GET" });
}

export async function updateAdminSettings(settings) {
  return await adminRequest("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// 9. Connected Applications (Live Workspace SSO Apps)
export async function getAdminConnectedApps() {
  try {
    const res = await adminRequest("/api/admin/connected-apps", { method: "GET" });
    if (Array.isArray(res)) {
      return { apps: res, summary: null };
    }
    return {
      apps: Array.isArray(res?.apps) ? res.apps : [],
      summary: res?.summary || null,
    };
  } catch {
    return { apps: [], summary: null };
  }
}

export async function toggleAdminApp(appKey, isActive, targetUid = null) {
  const body = {};
  if (typeof isActive === "boolean") body.is_active = isActive;
  if (targetUid !== null && targetUid !== undefined) body.uid = targetUid;
  return await adminRequest(`/api/admin/connected-apps/${encodeURIComponent(appKey)}/toggle`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function disconnectAdminApp(appId) {
  return await adminRequest(`/api/admin/connected-apps/${encodeURIComponent(appId)}`, {
    method: "DELETE",
  });
}

// 10. Logout
export async function adminLogout() {
  try {
    await adminRequest("/api/logout", { method: "POST" });
  } catch {
    // Continue even on network issue
  } finally {
    removeToken();
  }
}
