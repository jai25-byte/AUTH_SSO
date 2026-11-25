/**
 * Vault Auth API Client
 * Matched to openapi.json / openapi.yaml
 */

const DEFAULT_SERVER = "http://127.0.0.1:5000";

let detectedWorkingBase = null;

export const getApiBaseUrl = () => {
  if (typeof window !== "undefined" && window.__API_URL__) {
    return window.__API_URL__.replace(/\/+$/, "");
  }
  if (detectedWorkingBase !== null) {
    return detectedWorkingBase;
  }
  // If served via web browser (localhost:3000, 127.0.0.1:3000, etc.), default to relative path
  if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
    return "";
  }
  return DEFAULT_SERVER;
};

// Token Storage Helpers (CookieAuth & BearerAuth support)
export const TOKEN_KEY = "vault_auth_token";
export const USER_KEY = "vault_auth_user";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Universal fetch wrapper for Vault Auth API endpoints with automatic fallback
 */
async function request(endpoint, options = {}) {
  const primary = getApiBaseUrl();
  const candidates = [
    primary,
    "",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
  ];
  const uniqueCandidates = [...new Set(candidates)];

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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // If status 502, the dev proxy could not reach the backend on this route; try direct
      if (response.status === 502 && uniqueCandidates.length > 1) {
        lastError = new Error("Proxy received 502 Bad Gateway");
        continue;
      }

      detectedWorkingBase = base;

      let responseData = null;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }

      if (!response.ok) {
        const errorMsg =
          (responseData && typeof responseData === "object" && responseData.message) ||
          (typeof responseData === "string" && responseData) ||
          `HTTP Error ${response.status}: ${response.statusText}`;

        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = responseData;
        throw err;
      }

      return responseData;
    } catch (error) {
      lastError = error;
      if (error.status && error.status !== 502) {
        // Legitimate HTTP response error from backend (e.g. 400, 404, 500)
        throw error;
      }
      // If network/CORS error, try next candidate
    }
  }

  throw lastError || new Error("Unable to reach backend service.");
}

/**
 * Register a new user
 * POST /api/register
 */
export async function register({ username, password, email, fullName, name, uid, requireOtp }) {
  const payload = {
    username: username?.trim(),
    password,
    email: email?.trim(),
  };

  const nameVal = fullName || name;
  if (nameVal && typeof nameVal === "string") {
    payload.fullName = nameVal.trim();
  }

  if (typeof uid === "number") {
    payload.uid = uid;
  }

  if (typeof requireOtp === "boolean") {
    payload.require_otp = requireOtp;
  }

  return await request("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Authenticate user and receive session token
 * POST /api/login
 */
export async function login({ login: loginIdentifier, username, email, password, requireOtp }) {
  const identifier = (loginIdentifier || username || email || "").trim();
  const payload = {
    login: identifier,
    username: identifier,
    email: identifier,
    password,
  };

  if (typeof requireOtp === "boolean") {
    payload.require_otp = requireOtp;
  }

  const response = await request("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response?.token) {
    setToken(response.token);
  }

  return response;
}

/**
 * List all users
 * GET /api/users
 */
export async function getAllUsers() {
  return await request("/api/users", {
    method: "GET",
  });
}

/**
 * Get user by numeric UID
 * GET /api/users/{uid}
 */
export async function getUserByUid(uid) {
  return await request(`/api/users/${uid}`, {
    method: "GET",
  });
}

/**
 * Get user by username or email
 * GET /api/users/{id}
 */
export async function getUserByUsernameOrEmail(id) {
  return await request(`/api/users/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/**
 * Check backend connectivity / health status across candidate URLs
 */
export async function checkBackendHealth() {
  const candidates = [];

  if (typeof window !== "undefined" && window.__API_URL__) {
    candidates.push(window.__API_URL__.replace(/\/+$/, ""));
  }

  if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
    candidates.push(""); // Try proxy first
  }

  candidates.push("http://127.0.0.1:5000");
  candidates.push("http://localhost:5000");

  const uniqueCandidates = [...new Set(candidates)];

  for (const base of uniqueCandidates) {
    try {
      const res = await fetch(`${base}/api/users`, {
        method: "GET",
        credentials: "include",
      });

      // 502/503 from reverse proxy means backend unreachable on that path
      if (res.status === 502 || res.status === 503) {
        continue;
      }

      // Any HTTP response (200, 401 Unauthorized, 403, 404, etc.) confirms the server is alive
      detectedWorkingBase = base;
      return { ok: true, status: res.status, url: base || "relative /api" };
    } catch {
      // Network error, try next candidate
    }
  }

  return { ok: false, error: "Backend not reachable on candidate addresses" };
}

/**
 * Send real 6-digit OTP to employee's registered Gmail address
 * POST /api/otp/send
 */
export async function sendOtp(identifier) {
  const cleanId = (identifier || "").trim();
  return await request("/api/otp/send", {
    method: "POST",
    body: JSON.stringify({ identifier: cleanId }),
  });
}

/**
 * Verify OTP on the backend and create authenticated session
 * POST /api/otp/verify
 */
export async function verifyOtp(identifier, otp) {
  const cleanId = (identifier || "").trim();
  const cleanOtp = (otp || "").trim();

  const response = await request("/api/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      identifier: cleanId,
      otp: cleanOtp,
    }),
  });

  if (response?.token) {
    setToken(response.token);
  }
  if (response?.user) {
    setStoredUser(response.user);
  }

  return response;
}

/**
 * Log out and destroy session
 * POST /api/logout
 */
export async function logout() {
  try {
    await request("/api/logout", {
      method: "POST",
    });
  } catch {
    // Continue even if network error
  } finally {
    removeToken();
  }
}

export {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
  loginWithPasskey,
  getPasskeyCredentials,
  deletePasskeyCredential,
} from "./webauthn.js";

/**
 * Evaluate password complexity rules for password reset & registration
 */
export function validateResetPasswordPolicy(password = "") {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };

  const errors = [];
  if (!checks.minLength) errors.push("At least 8 characters");
  if (!checks.uppercase) errors.push("At least one uppercase letter");
  if (!checks.lowercase) errors.push("At least one lowercase letter");
  if (!checks.number) errors.push("At least one number");
  if (!checks.special) errors.push("At least one special character");

  const metCount = Object.values(checks).filter(Boolean).length;
  let score = 0;
  if (password) {
    if (metCount <= 2) score = 1;
    else if (metCount <= 3) score = 2;
    else if (metCount === 4) score = 3;
    else score = password.length >= 12 ? 4 : 3;
  }

  const meta = [
    { label: "Password strength: none", color: "#e2e8f0" },
    { label: "Weak password", color: "#dc2626" },
    { label: "Medium password", color: "#f59e0b" },
    { label: "Strong password", color: "#2563eb" },
    { label: "Very strong password", color: "#16a34a" },
  ][score];

  return {
    isValid: errors.length === 0,
    checks,
    errors,
    score,
    label: meta.label,
    color: meta.color,
  };
}

/**
 * Step 1: Request Forgot Password OTP
 * POST /api/auth/forgot-password
 */
export async function requestPasswordReset(email) {
  return await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: (email || "").trim().toLowerCase() }),
  });
}

/**
 * Resend Password Reset OTP (enforces 60s cooldown)
 * POST /api/auth/resend-reset-otp
 */
export async function resendResetOtp(email) {
  return await request("/api/auth/resend-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email: (email || "").trim().toLowerCase() }),
  });
}

/**
 * Step 3: Verify Password Reset OTP -> returns single-use reset_token
 * POST /api/auth/verify-reset-otp
 */
export async function verifyResetOtp(email, otp) {
  return await request("/api/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({
      email: (email || "").trim().toLowerCase(),
      otp: (otp || "").trim(),
    }),
  });
}

/**
 * Step 5: Complete Password Reset using single-use reset_token
 * POST /api/auth/reset-password
 */
export async function resetPasswordWithToken({ resetToken, newPassword, confirmPassword }) {
  return await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

/**
 * Authenticated password update
 * POST /api/auth/change-password
 */
export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  return await request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

// ─── End-User Dashboard APIs ─────────────────────────────────────────────────

export async function getUserProfile() {
  return await request("/api/user/profile", { method: "GET" });
}

export async function getDashboardOverview() {
  return await request("/api/dashboard/overview", { method: "GET" });
}

export async function getLoginActivity(limit = 25) {
  return await request(`/api/dashboard/login-activity?limit=${limit}`, { method: "GET" });
}

export async function getActiveSessions() {
  return await request("/api/sessions", { method: "GET" });
}

export async function revokeSessionById(sessionId) {
  return await request(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export async function revokeOtherSessions() {
  return await request("/api/sessions/revoke-others", { method: "POST" });
}

export async function getConnectedApps() {
  return await request("/api/connected-apps", { method: "GET" });
}

export async function disconnectConnectedApp(appId) {
  return await request(`/api/connected-apps/${encodeURIComponent(appId)}`, {
    method: "DELETE",
  });
}


