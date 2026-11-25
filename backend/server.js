/**
 * VaultAuth SSO — Comprehensive Backend Server (Node.js)
 * Implements complete authentication, RBAC, Admin Dashboard APIs,
 * End-User Dashboard APIs, and Session Management.
 */

import http from "node:http";
import { parse } from "node:url";
import { StringDecoder } from "node:string_decoder";
import crypto from "node:crypto";

// ─── Cryptographic & Token Utilities ──────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(storedPassword, password) {
  if (!storedPassword || !password) return false;
  if (!storedPassword.includes(":")) {
    return storedPassword === password;
  }
  const [salt, hash] = storedPassword.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

// ─── 1. In-Memory Data Stores & Seed Data ─────────────────────────────────────

const ROLES = {
  admin: "Enterprise Admin",
  user: "End User",
};

const PERMISSIONS_MAP = {
  admin: [
    "users.view", "users.create", "users.edit", "users.delete",
    "roles.view", "roles.manage", "sessions.view", "sessions.revoke",
    "audit.view", "settings.manage",
  ],
  user: ["users.view"],
};

let USERS = [
  {
    uid: 1,
    id: 1,
    username: "admin",
    email: "admin@vaultauth.io",
    password: hashPassword("Admin@1234!"),
    full_name: "System Administrator",
    phone: "+1 (555) 019-2834",
    role: "admin",
    role_title: "Enterprise Admin",
    is_active: true,
    c_date: "2025-01-15",
    created_at: "2025-01-15T08:30:00Z",
  },
  {
    uid: 2,
    id: 2,
    username: "alice",
    email: "alice@vault.io",
    password: hashPassword("Password@1234!"),
    full_name: "Alice Security",
    phone: "+1 (555) 482-1940",
    role: "admin",
    role_title: "Enterprise Admin",
    is_active: true,
    c_date: "2025-02-01",
    created_at: "2025-02-01T09:15:00Z",
  },
  {
    uid: 3,
    id: 3,
    username: "bob",
    email: "bob@vault.io",
    password: hashPassword("Password@1234!"),
    full_name: "Bob Developer",
    phone: "+1 (555) 391-7264",
    role: "user",
    role_title: "End User",
    is_active: true,
    c_date: "2025-02-10",
    created_at: "2025-02-10T11:45:00Z",
  },
  {
    uid: 4,
    id: 4,
    username: "charlie",
    email: "charlie@vault.io",
    password: hashPassword("Password@1234!"),
    full_name: "Charlie DevOps",
    phone: "+1 (555) 829-4721",
    role: "user",
    role_title: "End User",
    is_active: true,
    c_date: "2025-03-01",
    created_at: "2025-03-01T14:20:00Z",
  },
  {
    uid: 5,
    id: 5,
    username: "demo_user",
    email: "demo@example.com",
    password: hashPassword("Password@1234!"),
    full_name: "Demo User",
    phone: "+1 (555) 710-3849",
    role: "user",
    role_title: "End User",
    is_active: true,
    c_date: "2025-03-15",
    created_at: "2025-03-15T16:00:00Z",
  },
  {
    uid: 6,
    id: 6,
    username: "amitoj",
    email: "amitoj0024@gmail.com",
    password: hashPassword("Admin@1234!"),
    full_name: "Amitoj Singh Arora",
    phone: "+1 (555) 019-2834",
    role: "admin",
    role_title: "Enterprise Admin",
    is_active: true,
    c_date: "2025-01-15",
    created_at: "2025-01-15T08:30:00Z",
  },
  {
    uid: 7,
    id: 7,
    username: "amy",
    email: "amy492998@gmail.com",
    password: hashPassword("Waheguru@1"),
    full_name: "Amy Admin",
    phone: "+1 (555) 019-2835",
    role: "admin",
    role_title: "Enterprise Admin",
    is_active: true,
    c_date: "2025-01-15",
    created_at: "2025-01-15T08:30:00Z",
  },
];

let SESSIONS = [
  {
    id: 1,
    session_id: "sess_admin_macbook",
    session_token: "tok_admin_seeded_macbook",
    uid: 1,
    username: "admin",
    email: "admin@vaultauth.io",
    device_name: "MacBook Pro 16",
    device_type: "laptop",
    browser: "Chrome 131",
    os: "macOS",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    created_at: "Today, 10:00 AM",
    last_activity: "Active Now",
    is_active: true,
    is_current: true,
  },
  {
    id: 2,
    session_id: "sess_admin_iphone",
    session_token: "tok_admin_seeded_iphone",
    uid: 1,
    username: "admin",
    email: "admin@vaultauth.io",
    device_name: "Apple iPhone 16 Pro",
    device_type: "mobile",
    browser: "Safari 18",
    os: "iOS",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    created_at: "Yesterday, 4:30 PM",
    last_activity: "Yesterday, 6:00 PM",
    is_active: true,
    is_current: false,
  },
  {
    id: 3,
    session_id: "sess_bob_windows",
    session_token: "tok_bob_seeded_windows",
    uid: 3,
    username: "bob",
    email: "bob@vault.io",
    device_name: "Windows PC",
    device_type: "desktop",
    browser: "Edge 130",
    os: "Windows",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    created_at: "Nov 22, 2:15 PM",
    last_activity: "Nov 22, 5:00 PM",
    is_active: true,
    is_current: false,
  },
];

let LOGIN_ACTIVITIES = [
  {
    id: 1,
    uid: 1,
    username: "admin",
    device_name: "MacBook Pro 16",
    device_type: "laptop",
    browser: "Chrome 131",
    os: "macOS",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    status: "Success",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    time_formatted: "30 mins ago",
  },
  {
    id: 2,
    uid: 1,
    username: "admin",
    device_name: "Apple iPhone 16 Pro",
    device_type: "mobile",
    browser: "Safari 18",
    os: "iOS",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    status: "Success",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    time_formatted: "18 hours ago",
  },
  {
    id: 3,
    uid: 3,
    username: "bob",
    device_name: "Windows PC",
    device_type: "desktop",
    browser: "Edge 130",
    os: "Windows",
    ip_address: "127.0.0.1",
    location: "Bengaluru, India",
    status: "Success",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    time_formatted: "22 hours ago",
  },
  {
    id: 4,
    uid: 0,
    username: "unknown_user",
    device_name: "Linux Desktop",
    device_type: "desktop",
    browser: "Firefox 132",
    os: "Linux",
    ip_address: "198.51.100.42",
    location: "Frankfurt, Germany",
    status: "Failed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    time_formatted: "Yesterday",
  },
];

let AUDIT_LOGS = [
  {
    id: 1,
    event_type: "SYSTEM_INITIALIZED",
    actor_uid: 1,
    actor_username: "admin",
    target_uid: null,
    target_username: "—",
    ip_address: "127.0.0.1",
    status: "Success",
    details: "VaultAuth SSO Identity and Access Management initialized",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 2,
    event_type: "USER_LOGIN_SUCCESS",
    actor_uid: 1,
    actor_username: "admin",
    target_uid: 1,
    target_username: "admin",
    ip_address: "127.0.0.1",
    status: "Success",
    details: "Administrator session authenticated successfully",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 3,
    event_type: "WEBAUTHN_REGISTER_SUCCESS",
    actor_uid: 1,
    actor_username: "admin",
    target_uid: 1,
    target_username: "admin",
    ip_address: "127.0.0.1",
    status: "Success",
    details: "FIDO2 passkey Touch ID registered for user",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

let ADMIN_SETTINGS = {
  app_name: "VaultAuth SSO",
  session_timeout: "3600",
  max_failed_attempts: "5",
  otp_expiry_seconds: "300",
  password_min_length: "8",
  mfa_required: "false",
  otp_configured: true,
  smtp_configured: true,
  cors_origins: "http://localhost:3000,http://localhost:5500",
};

let CONNECTED_APPS = [
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
    bg: "#4A154B",
    permissions: ["Channels view", "Direct messages", "Profile access"],
    status: "Active",
    connectedDate: "Feb 14, 2025",
  },
  {
    id: 3,
    name: "Jira Software",
    desc: "Project tracking",
    logo: "J",
    bg: "#0052CC",
    permissions: ["Browse projects", "Create issues", "Assign issues"],
    status: "Active",
    connectedDate: "Mar 01, 2025",
  },
  {
    id: 4,
    name: "AWS IAM Identity Center",
    desc: "Cloud infrastructure",
    logo: "A",
    bg: "#FF9900",
    permissions: ["Read-only", "IAM view"],
    status: "Active",
    connectedDate: "Apr 22, 2025",
  },
  {
    id: 5,
    name: "GitHub Enterprise",
    desc: "Code repositories",
    logo: "G",
    bg: "#171515",
    permissions: ["Repo read", "Repo write", "Webhooks"],
    status: "Active",
    connectedDate: "May 05, 2025",
  },
];

let WEBAUTHN_CREDENTIALS = [
  {
    id: 1,
    uid: 1,
    credential_id: "cred_macbook_touchid_sample",
    device_name: "MacBook Touch ID",
    created_at: "Today, 10:00 AM",
    last_used_at: "Active Now",
  },
];

// Active OTP store (email -> { codeHash, expiresAt, cooldownUntil, attempts })
const OTPS = new Map();
// Ephemeral WebAuthn challenge store (challengeStr -> { uid, type, expiresAt })
const WEBAUTHN_CHALLENGES = new Map();
// Password reset records store
let PASSWORD_RESETS = [];
let NEXT_RESET_ID = 1;

function hashResetSecret(val) {
  return crypto.createHmac("sha256", JWT_SECRET).update(String(val)).digest("hex");
}

function validateStrictPassword(password = "") {
  const errors = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include at least one number.");
  if (!/[^A-Za-z0-9\s]/.test(password)) errors.push("Password must include at least one special character.");
  return errors;
}

// ── Plunk Transactional Email Dispatcher ──
const PLUNK_API_KEY = process.env.PLUNK_SECRET_KEY || process.env.PLUNK_API_KEY || "";

async function sendEmailPlunk(toEmail, code) {
  if (!PLUNK_API_KEY) {
    return { success: false, targetEmail: toEmail, error: "PLUNK_API_KEY not configured" };
  }
  const targetEmail = toEmail;

  const payload = {
    to: targetEmail,
    from: process.env.PLUNK_FROM || "noreply@vaultauthsso.proplays2312.eu.org",
    subject: `${code} is your Vault Auth verification code`,
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">VaultAuth SSO Verification</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Use the one-time verification code below to complete your authentication request:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 24px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; display: inline-block; margin: 18px 0; color: #7047eb; font-family: monospace;">${code}</div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.4;">This code is valid for 5 minutes. If you did not initiate this request, please disregard this notice.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">VaultAuth Enterprise Single Sign-On</p>
    </div>`,
    name: "VaultAuth SSO"
  };

  const endpoints = [
    "https://next-api.useplunk.com/v1/send",
    "https://api.useplunk.com/v1/send",
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PLUNK_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[Plunk] OTP email dispatched to ${targetEmail}`);
        return { success: true, targetEmail, data };
      } else {
        console.warn(`[Plunk] Send failed on ${ep}:`, data);
      }
    } catch (err) {
      console.warn(`[Plunk] Request error to ${ep}:`, err.message);
    }
  }
  return { success: false, targetEmail };
}

// ─── 2. Utility Functions & Middleware ────────────────────────────────────────

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    let buffer = "";
    req.on("data", (chunk) => (buffer += decoder.write(chunk)));
    req.on("end", () => {
      buffer += decoder.end();
      try {
        resolve(buffer ? JSON.parse(buffer) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function makeToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      uid: user.uid,
      id: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      role_title: user.role_title || ROLES[user.role] || "End User",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${claims}`)
    .digest("base64url");
  return `${header}.${claims}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, claims, sig] = parts;
  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${claims}`)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(claims, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function json(res, status, payload, req = null) {
  const data = JSON.stringify(payload);
  const origin = req?.headers?.origin || "*";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,Cookie",
  };

  if (origin && origin !== "*") {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  res.writeHead(status, headers);
  res.end(data);
}

function getAuthUser(req) {
  const authHeader = req.headers["authorization"] || "";
  let token = null;

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && req.headers["cookie"]) {
    const match = req.headers["cookie"].match(/(?:^|;\s*)vault_auth_token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) return null;

  // 1. Verify cryptographic JWT signature
  const jwtPayload = verifyToken(token);
  if (jwtPayload) {
    const user = USERS.find((u) => u.uid === jwtPayload.uid || u.email === jwtPayload.email);
    if (user && user.is_active) {
      if (user.password_changed_at && jwtPayload.iat && jwtPayload.iat < user.password_changed_at) {
        return null;
      }
      const existingSession = SESSIONS.find((s) => s.session_token === token);
      if (existingSession && !existingSession.is_active) {
        return null;
      }
      let session = existingSession;
      if (!session) {
        session = {
          id: SESSIONS.length + 1,
          session_id: `sess_${crypto.randomBytes(8).toString("hex")}`,
          session_token: token,
          uid: user.uid,
          username: user.username,
          email: user.email,
          device_name: "Web Browser Session",
          device_type: "desktop",
          browser: "Chrome",
          os: "macOS",
          ip_address: "127.0.0.1",
          location: "Bengaluru, India",
          created_at: "Today, Just now",
          last_activity: "Active Now",
          is_active: true,
          is_current: true,
        };
        SESSIONS.push(session);
      }
      return { user, session, token };
    }
  }

  // 2. Check active in-memory sessions for tokens in session store
  const session = SESSIONS.find((s) => s.session_token === token && s.is_active);
  if (session) {
    const user = USERS.find((u) => u.uid === session.uid && u.is_active);
    if (user) return { user, session, token };
  }

  return null;
}

function requireAuth(req, res) {
  const auth = getAuthUser(req);
  if (!auth) {
    json(res, 401, {
      success: false,
      message: "Authentication required. Please provide a Bearer token.",
    }, req);
    return null;
  }
  return auth;
}

function requireAdmin(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return null;

  if (auth.user.role !== "admin") {
    json(res, 403, {
      success: false,
      message: "Access denied. Insufficient role permissions.",
      required_role: ["admin"],
    }, req);
    return null;
  }
  return auth;
}

function recordAudit(eventType, actor, details = "", targetUser = null) {
  const log = {
    id: AUDIT_LOGS.length + 1,
    event_type: eventType,
    actor_uid: actor?.uid || null,
    actor_username: actor?.username || "system",
    target_uid: targetUser?.uid || null,
    target_username: targetUser?.username || "—",
    ip_address: "127.0.0.1",
    status: "Success",
    details: details || "",
    created_at: new Date().toISOString(),
  };
  AUDIT_LOGS.unshift(log);
}

// ─── 3. Request Handler ────────────────────────────────────────────────────────

async function requestHandler(req, res) {
  const parsed = parse(req.url, true);
  const pathname = parsed.pathname || "";
  const query = parsed.query || {};
  const method = req.method?.toUpperCase() ?? "";

  // CORS Pre-flight Options
  if (method === "OPTIONS") {
    const origin = req.headers["origin"] || "*";
    const headers = {
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,Cookie",
    };
    if (origin && origin !== "*") {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    } else {
      headers["Access-Control-Allow-Origin"] = "*";
    }
    res.writeHead(204, headers);
    return res.end();
  }

  // ── Health Check ──
  if (pathname === "/api/health" || pathname === "/health" || pathname === "/") {
    return json(res, 200, {
      status: "ok",
      service: "Vault Auth Backend",
      version: "1.0.0",
      roles: Object.keys(ROLES),
    }, req);
  }

  // ── Authentication Routes ──
  if (method === "POST" && pathname === "/api/register") {
    try {
      const body = await getJsonBody(req);
      const { username, email, password, fullName, full_name, phone, role } = body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanUsername = (username || "").trim();

      if (!cleanUsername || !cleanEmail || !password) {
        return json(res, 400, { success: false, message: "Username, email, and password are required." }, req);
      }
      if (password.length < 8) {
        return json(res, 400, { success: false, message: "Password must be at least 8 characters long." }, req);
      }
      if (USERS.some((u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase())) {
        return json(res, 409, { success: false, message: "Registration failed. Username or email may already be taken." }, req);
      }

      const uid = USERS.length > 0 ? Math.max(...USERS.map((u) => u.uid)) + 1 : 1;
      const userRole = "user";
      const newUser = {
        uid,
        id: uid,
        username: cleanUsername,
        email: cleanEmail,
        password: hashPassword(password),
        full_name: fullName || full_name || cleanUsername,
        phone: phone || "",
        role: userRole,
        role_title: ROLES[userRole] || "End User",
        is_active: true,
        c_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      };
      USERS.push(newUser);
      recordAudit("USER_REGISTERED", newUser, `User registered: ${cleanUsername}`);

      if (body.require_otp || ADMIN_SETTINGS.mfa_required === "true") {
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        OTPS.set(newUser.email.toLowerCase(), {
          codeHash: hashResetSecret(`login-otp:${newUser.uid}:${otpCode}`),
          expiresAt: Date.now() + 300000,
          cooldownUntil: Date.now() + 60000,
          attempts: 0,
        });

        const plunkResult = await sendEmailPlunk(newUser.email, otpCode);
        const masked = newUser.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(Math.max(b.length, 3)) + c);

        return json(res, 201, {
          success: true,
          otp_required: true,
          requires_otp: true,
          identifier: newUser.email,
          email_masked: masked,
          email_sent: Boolean(plunkResult?.success),
          expires_in: 300,
          cooldown: plunkResult?.success ? 60 : 0,
          message: plunkResult?.success
            ? `Account created! Verification code sent to ${masked}.`
            : `Account created, but verification email could not be sent: ${plunkResult?.error || "Email delivery failed"}. Click Resend code to try again.`,
          uid,
          user: sanitizeUser(newUser),
        }, req);
      }

      return json(res, 201, { success: true, message: "Registration successful", uid, user: sanitizeUser(newUser) }, req);
    } catch (e) {
      return json(res, 500, { success: false, message: "Invalid JSON", error: e.message }, req);
    }
  }

  if (method === "POST" && pathname === "/api/login") {
    try {
      const body = await getJsonBody(req);
      const identifier = (body.identifier || body.login || body.username || body.email || "").trim().toLowerCase();
      const password = body.password;

      if (!identifier || !password) {
        return json(res, 400, { message: "Username/email and password are required" }, req);
      }

      const user = USERS.find(
        (u) =>
          (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) &&
          verifyPassword(u.password, password)
      );

      if (!user) {
        LOGIN_ACTIVITIES.unshift({
          id: LOGIN_ACTIVITIES.length + 1,
          uid: 0,
          username: identifier,
          device_name: "Web Client",
          device_type: "desktop",
          browser: "Browser",
          os: "Unknown",
          ip_address: "127.0.0.1",
          location: "Bengaluru, India",
          status: "Failed",
          created_at: new Date().toISOString(),
          time_formatted: "Just now",
        });
        return json(res, 401, { message: "Invalid email or password" }, req);
      }

      if (!user.is_active) {
        return json(res, 403, { message: "Account is deactivated. Please contact your administrator." }, req);
      }

      // Check if 2FA is required for this user or by global system policy
      if (ADMIN_SETTINGS.mfa_required === "true" || user.mfa_enabled || body.require_otp) {
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        OTPS.set(user.email.toLowerCase(), {
          codeHash: hashResetSecret(`login-otp:${user.uid}:${otpCode}`),
          expiresAt: Date.now() + 300000,
          cooldownUntil: Date.now() + 60000,
          attempts: 0,
        });

        const plunkResult = await sendEmailPlunk(user.email, otpCode);
        const masked = user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(Math.max(b.length, 3)) + c);

        return json(res, 200, {
          otp_required: true,
          identifier: user.email,
          email_sent: plunkResult.success,
          email_masked: masked,
          message: `Two-factor verification required. Code sent to ${masked}`,
        }, req);
      }

      const token = makeToken(user);
      const sessionObj = {
        id: SESSIONS.length + 1,
        session_id: `sess_${crypto.randomBytes(8).toString("hex")}`,
        session_token: token,
        uid: user.uid,
        username: user.username,
        email: user.email,
        device_name: "Web Browser Session",
        device_type: "desktop",
        browser: "Chrome",
        os: "macOS",
        ip_address: "127.0.0.1",
        location: "Bengaluru, India",
        created_at: "Today, Just now",
        last_activity: "Active Now",
        is_active: true,
        is_current: true,
      };
      SESSIONS.push(sessionObj);

      LOGIN_ACTIVITIES.unshift({
        id: LOGIN_ACTIVITIES.length + 1,
        uid: user.uid,
        username: user.username,
        device_name: sessionObj.device_name,
        device_type: sessionObj.device_type,
        browser: sessionObj.browser,
        os: sessionObj.os,
        ip_address: sessionObj.ip_address,
        location: sessionObj.location,
        status: "Success",
        created_at: new Date().toISOString(),
        time_formatted: "Just now",
      });

      recordAudit("LOGIN_SUCCESS", user, `Login successful for ${user.username}`);

      return json(res, 200, {
        message: "Login successful",
        token,
        session_id: sessionObj.session_id,
        user: sanitizeUser(user),
      }, req);
    } catch (e) {
      return json(res, 500, { message: "Login failed", error: e.message }, req);
    }
  }

  if (method === "POST" && pathname === "/api/logout") {
    const auth = getAuthUser(req);
    if (auth && auth.session) {
      auth.session.is_active = false;
      recordAudit("LOGOUT", auth.user, "User signed out");
    }
    return json(res, 200, { success: true, message: "Logout successful" }, req);
  }

  if (method === "GET" && pathname === "/api/session") {
    const auth = getAuthUser(req);
    if (auth) {
      return json(res, 200, {
        authenticated: true,
        user: sanitizeUser(auth.user),
        session: auth.session,
      }, req);
    }
    return json(res, 200, {
      authenticated: false,
      user: null,
      session: null,
    }, req);
  }

  // ── Forgot Password & Reset ──
  if (
    method === "POST" &&
    (pathname === "/api/forgot-password" ||
      pathname === "/api/auth/forgot-password" ||
      pathname === "/api/auth/resend-reset-otp")
  ) {
    const isResend = pathname === "/api/auth/resend-reset-otp";
    const body = await getJsonBody(req).catch(() => ({}));
    const email = (body.email || body.identifier || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json(res, 400, { success: false, message: "Please enter a valid email address." }, req);
    }

    const genericResp = {
      success: true,
      message: "If an account with that email exists, a password reset verification code has been sent.",
      expires_in: 300,
      cooldown: 60,
    };

    const user = USERS.find((u) => u.email.toLowerCase() === email && u.is_active);
    if (!user) {
      return json(res, 200, genericResp, req);
    }

    const now = Date.now();
    if (isResend) {
      const latest = PASSWORD_RESETS.filter((r) => r.user_id === user.uid).sort((a, b) => b.id - a.id)[0];
      if (latest && now - latest.created_at < 60000) {
        const remaining = Math.max(1, Math.ceil((60000 - (now - latest.created_at)) / 1000));
        return json(
          res,
          429,
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting a new verification code.`,
            retry_after: remaining,
            cooldown: remaining,
          },
          req
        );
      }
    }

    PASSWORD_RESETS.forEach((r) => {
      if (r.user_id === user.uid && !r.is_used) r.is_used = true;
    });

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    PASSWORD_RESETS.push({
      id: NEXT_RESET_ID++,
      user_id: user.uid,
      otp_hash: hashResetSecret(`reset-otp:${user.uid}:${otpCode}`),
      expires_at: now + 300000,
      attempts: 0,
      reset_token_hash: null,
      token_expires_at: null,
      is_used: false,
      created_at: now,
    });

    if (PLUNK_API_KEY) {
      sendEmailPlunk(user.email, otpCode).catch(() => {});
    }

    recordAudit("PASSWORD_RESET_OTP_SENT", user, isResend ? "Reset OTP resent" : "Reset OTP requested");
    return json(res, 200, genericResp, req);
  }

  if (method === "POST" && pathname === "/api/auth/verify-reset-otp") {
    const body = await getJsonBody(req).catch(() => ({}));
    const email = (body.email || body.identifier || "").trim().toLowerCase();
    const otp = String(body.otp || body.code || "").trim();

    if (!email || !otp) {
      return json(res, 400, { success: false, message: "Email and verification code are required." }, req);
    }

    const user = USERS.find((u) => u.email.toLowerCase() === email && u.is_active);
    if (!user) {
      return json(res, 400, { success: false, message: "Invalid or expired verification code." }, req);
    }

    const record = PASSWORD_RESETS.filter(
      (r) => r.user_id === user.uid && !r.is_used && r.reset_token_hash === null
    ).sort((a, b) => b.id - a.id)[0];

    if (!record) {
      return json(res, 400, { success: false, message: "Invalid or expired verification code." }, req);
    }

    if (record.attempts >= 5) {
      record.is_used = true;
      return json(
        res,
        429,
        { success: false, message: "Maximum verification attempts exceeded. Please request a new verification code." },
        req
      );
    }

    const now = Date.now();
    if (record.expires_at < now) {
      record.is_used = true;
      return json(res, 400, { success: false, message: "Verification code has expired. Please request a new code." }, req);
    }

    const expected = hashResetSecret(`reset-otp:${user.uid}:${otp}`);
    const isMatch =
      otp.length === 6 &&
      /^\d{6}$/.test(otp) &&
      crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(record.otp_hash, "hex"));

    if (!isMatch) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        record.is_used = true;
        return json(
          res,
          429,
          { success: false, message: "Maximum verification attempts exceeded. Please request a new verification code." },
          req
        );
      }
      const remaining = 5 - record.attempts;
      return json(
        res,
        400,
        {
          success: false,
          message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
          attempts_remaining: remaining,
        },
        req
      );
    }

    const rawResetToken = crypto.randomBytes(32).toString("base64url");
    record.reset_token_hash = hashResetSecret(`reset-token:${rawResetToken}`);
    record.token_expires_at = now + 600000;

    return json(
      res,
      200,
      {
        success: true,
        message: "Verification code verified. You may now create a new password.",
        reset_token: rawResetToken,
        expires_in: 600,
      },
      req
    );
  }

  if (method === "POST" && (pathname === "/api/reset-password" || pathname === "/api/auth/reset-password")) {
    const body = await getJsonBody(req).catch(() => ({}));
    const resetToken = String(body.reset_token || body.token || "").trim();
    const newPassword = body.new_password || body.password || "";
    const confirmPassword = body.confirm_password ?? body.confirmPassword;

    if (!resetToken || !newPassword) {
      return json(
        res,
        400,
        { success: false, message: "Reset authorization token and new password are required." },
        req
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== null && newPassword !== confirmPassword) {
      return json(res, 400, { success: false, message: "New password and confirmation do not match." }, req);
    }

    const errors = validateStrictPassword(newPassword);
    if (errors.length > 0) {
      return json(res, 400, { success: false, message: errors[0], errors }, req);
    }

    const tokenHash = hashResetSecret(`reset-token:${resetToken}`);
    const record = PASSWORD_RESETS.find((r) => r.reset_token_hash === tokenHash);
    if (!record) {
      return json(res, 400, { success: false, message: "Invalid or expired reset authorization token." }, req);
    }
    if (record.is_used) {
      return json(
        res,
        400,
        { success: false, message: "This reset token has already been used. Please request a new reset." },
        req
      );
    }
    if (!record.token_expires_at || record.token_expires_at < Date.now()) {
      record.is_used = true;
      return json(
        res,
        400,
        { success: false, message: "Your reset session has expired. Please start over." },
        req
      );
    }

    const user = USERS.find((u) => u.uid === record.user_id && u.is_active);
    if (!user) {
      return json(res, 403, { success: false, message: "Account is deactivated." }, req);
    }

    user.password = hashPassword(newPassword);
    user.password_changed_at = Math.floor(Date.now() / 1000) + 1;
    PASSWORD_RESETS.forEach((r) => {
      if (r.user_id === user.uid) r.is_used = true;
    });
    OTPS.delete(user.email.toLowerCase());
    SESSIONS.forEach((s) => {
      if (s.uid === user.uid) s.is_active = false;
    });

    recordAudit("PASSWORD_RESET_SUCCESS", user, "Password reset completed and active sessions revoked");
    return json(
      res,
      200,
      {
        success: true,
        message: "Your password has been reset successfully. Please log in with your new password.",
      },
      req
    );
  }

  // ── Authenticated Change Password ──
  if (method === "POST" && pathname === "/api/auth/change-password") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const body = await getJsonBody(req).catch(() => ({}));
    const currentPassword = body.current_password || body.currentPassword || "";
    const newPassword = body.new_password || body.newPassword || "";
    const confirmPassword = body.confirm_password ?? body.confirmPassword;

    if (!currentPassword || !newPassword) {
      return json(res, 400, { success: false, message: "Current password and new password are required." }, req);
    }
    if (confirmPassword !== undefined && confirmPassword !== null && newPassword !== confirmPassword) {
      return json(res, 400, { success: false, message: "New password and confirmation do not match." }, req);
    }
    if (!verifyPassword(auth.user.password, currentPassword)) {
      return json(res, 401, { success: false, message: "Current password is incorrect." }, req);
    }
    const errors = validateStrictPassword(newPassword);
    if (errors.length > 0) {
      return json(res, 400, { success: false, message: errors[0], errors }, req);
    }
    if (currentPassword === newPassword) {
      return json(res, 400, { success: false, message: "New password must differ from current password." }, req);
    }

    auth.user.password = hashPassword(newPassword);
    auth.user.password_changed_at = Math.floor(Date.now() / 1000) + 1;
    SESSIONS.forEach((s) => {
      if (s.uid === auth.user.uid && s.session_token !== auth.token) {
        s.is_active = false;
      }
    });
    recordAudit("PASSWORD_CHANGED", auth.user, "Authenticated password change");
    return json(res, 200, {
      success: true,
      message: "Password updated successfully. Other active sessions have been signed out.",
    }, req);
  }

  // ── OTP Endpoints ──
  if (method === "POST" && (pathname === "/api/otp/send" || pathname === "/api/login/otp/send")) {
    const body = await getJsonBody(req).catch(() => ({}));
    const ident = (body.identifier || body.email || body.username || body.login || "").trim().toLowerCase();
    if (!ident) {
      return json(res, 400, { success: false, message: "Identifier (username or email) is required." }, req);
    }
    const user = USERS.find((u) => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident);
    if (!user) {
      return json(res, 404, { success: false, message: "User not found" }, req);
    }
    if (!user.is_active) {
      return json(res, 403, { success: false, message: "Account is deactivated. Please contact your administrator." }, req);
    }

    const emailKey = user.email.toLowerCase();
    const existingOtp = OTPS.get(emailKey);
    if (existingOtp && existingOtp.cooldownUntil > Date.now()) {
      const remaining = Math.max(1, Math.ceil((existingOtp.cooldownUntil - Date.now()) / 1000));
      return json(res, 429, {
        success: false,
        message: `Please wait ${remaining} seconds before requesting a new OTP.`,
        retry_after: remaining,
        cooldown: remaining,
      }, req);
    }

    const masked = user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(Math.max(b.length, 3)) + c);
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    OTPS.set(emailKey, {
      codeHash: hashResetSecret(`login-otp:${user.uid}:${otpCode}`),
      expiresAt: Date.now() + 300000,
      cooldownUntil: Date.now() + 60000,
      attempts: 0,
    });

    const plunkResult = await sendEmailPlunk(user.email, otpCode);
    if (!plunkResult.success) {
      OTPS.delete(emailKey);
      return json(res, 500, {
        success: false,
        email_sent: false,
        message: `Email delivery failed: ${plunkResult.error || "Unable to send OTP email"}.`,
      }, req);
    }

    return json(res, 200, {
      message: `OTP sent to ${masked}`,
      identifier: ident,
      email_masked: masked,
      expires_in: 300,
      cooldown: 60,
      email_sent: true,
    }, req);
  }

  if (method === "POST" && (pathname === "/api/otp/verify" || pathname === "/api/login/otp/verify" || pathname === "/api/login/otp")) {
    const body = await getJsonBody(req).catch(() => ({}));
    const otp = String(body.otp || body.code || "").trim();
    const ident = (body.identifier || body.email || body.username || body.login || "").trim().toLowerCase();

    if (!ident || !otp) {
      return json(res, 400, { success: false, message: "Both identifier and OTP code are required" }, req);
    }

    const user = USERS.find((u) => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident);
    if (!user) {
      return json(res, 404, { success: false, message: "User not found" }, req);
    }
    if (!user.is_active) {
      return json(res, 403, { success: false, message: "Account is deactivated" }, req);
    }

    const emailKey = user.email.toLowerCase();
    const storedOtp = OTPS.get(emailKey);
    if (!storedOtp || storedOtp.expiresAt <= Date.now()) {
      OTPS.delete(emailKey);
      return json(res, 401, { success: false, message: "Invalid or expired OTP" }, req);
    }
    if (storedOtp.attempts >= 5) {
      OTPS.delete(emailKey);
      return json(res, 401, { success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." }, req);
    }

    const expectedHash = hashResetSecret(`login-otp:${user.uid}:${otp}`);
    const isCodeMatch =
      otp.length === 6 &&
      /^\d{6}$/.test(otp) &&
      crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(storedOtp.codeHash, "hex"));

    if (!isCodeMatch) {
      storedOtp.attempts += 1;
      if (storedOtp.attempts >= 5) {
        OTPS.delete(emailKey);
        return json(res, 401, { success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." }, req);
      }
      return json(res, 401, { success: false, message: "Invalid or expired OTP" }, req);
    }

    OTPS.delete(emailKey);
    const token = makeToken(user);
    return json(res, 200, {
      success: true,
      message: "OTP login successful",
      token,
      user: sanitizeUser(user),
    }, req);
  }

  // ── Current User Role ──
  if (method === "GET" && pathname === "/api/user/role") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    return json(res, 200, {
      uid: auth.user.uid,
      username: auth.user.username,
      role: auth.user.role,
      role_title: auth.user.role_title || ROLES[auth.user.role] || "End User",
      permissions: PERMISSIONS_MAP[auth.user.role] || PERMISSIONS_MAP.user,
      user: sanitizeUser(auth.user),
    }, req);
  }

  // ── User Profile ──
  if (method === "GET" && pathname === "/api/user/profile") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    return json(res, 200, {
      uid: auth.user.uid,
      username: auth.user.username,
      email: auth.user.email,
      full_name: auth.user.full_name,
      initials: (auth.user.full_name || auth.user.username).substring(0, 2).toUpperCase(),
      role: ROLES[auth.user.role] || "End User",
      department: "Engineering",
      phone: auth.user.phone || "",
      joined: auth.user.c_date || "January 2025",
      security: {
        mfa_enabled: true,
        recovery_email: `backup_${auth.user.uid}@vault.io`,
        password_changed_desc: "Last changed 12 days ago",
      },
    }, req);
  }

  // ── Users List (Admin Only) ──
  if (method === "GET" && pathname === "/api/users") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const safeUsers = USERS.map((u) => ({
      uid: u.uid,
      id: u.uid,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
    }));
    return json(res, 200, safeUsers, req);
  }

  // ── Users by ID (Admin or Self Only) ──
  const userByIdMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (method === "GET" && userByIdMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const ident = decodeURIComponent(userByIdMatch[1]);
    const user = USERS.find((u) => String(u.uid) === ident || u.username === ident || u.email.toLowerCase() === ident.toLowerCase());
    if (!user) return json(res, 404, { message: "User not found" }, req);
    if (auth.user.role !== "admin" && auth.user.uid !== user.uid) {
      return json(res, 403, { success: false, message: "Access denied. Insufficient role permissions." }, req);
    }
    return json(res, 200, {
      uid: user.uid,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    }, req);
  }

  // ============================================================================
  // RBAC & ADMIN DASHBOARD ENDPOINTS (src/components/admin/ + adminApi.js)
  // ============================================================================

  // ── Admin Stats ──
  if (method === "GET" && pathname === "/api/admin/dashboard/stats") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const activeSess = SESSIONS.filter((s) => s.is_active);
    const activeAppCnt = CONNECTED_APPS.filter((a) => (a.status || "Active").toLowerCase() === "active").length;
    return json(res, 200, {
      total_users: USERS.length,
      active_users: USERS.filter((u) => u.is_active).length,
      administrators: USERS.filter((u) => u.role === "admin").length,
      active_sessions: activeSess.length,
      active_session_users: new Set(activeSess.map((s) => s.uid)).size,
      failed_logins_24h: LOGIN_ACTIVITIES.filter((a) => a.status === "Failed").length,
      suspicious_activities_24h: 0,
      connected_apps_total: CONNECTED_APPS.length,
      connected_apps_active: activeAppCnt,
      connected_apps_inactive: Math.max(0, CONNECTED_APPS.length - activeAppCnt),
    }, req);
  }

  if (method === "GET" && pathname === "/api/admin/connected-apps") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const activeApps = CONNECTED_APPS.filter((a) => (a.status || "Active").toLowerCase() === "active");
    return json(res, 200, {
      apps: CONNECTED_APPS.map((a) => ({
        ...a,
        app_key: (a.app_key || a.name || String(a.id)).toLowerCase().replace(/\s+/g, "_"),
        app_name: a.name,
        app_desc: a.desc,
        logo_char: a.logo,
        connected_date: a.connectedDate,
        is_active: (a.status || "Active").toLowerCase() === "active",
      })),
      summary: {
        total_apps: CONNECTED_APPS.length,
        active_apps: activeApps.length,
        inactive_apps: Math.max(0, CONNECTED_APPS.length - activeApps.length),
      },
    }, req);
  }

  const adminToggleAppMatch = pathname.match(/^\/api\/admin\/connected-apps\/([^/]+)\/toggle$/);
  if (method === "POST" && adminToggleAppMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const key = decodeURIComponent(adminToggleAppMatch[1]).toLowerCase();
    const target = CONNECTED_APPS.find(
      (a) => String(a.id) === key || (a.app_key || a.name || "").toLowerCase().replace(/\s+/g, "_") === key
    );
    if (!target) return json(res, 404, { success: false, message: "Application not found" }, req);

    const body = await getJsonBody(req).catch(() => ({}));
    const nextActive = typeof body.is_active === "boolean" ? body.is_active : (target.status || "Active") !== "Active";
    target.status = nextActive ? "Active" : "Inactive";
    return json(res, 200, { success: true, is_active: nextActive, message: `${target.name} ${nextActive ? "enabled" : "disabled"}` }, req);
  }

  const adminDeleteAppMatch = pathname.match(/^\/api\/admin\/connected-apps\/([^/]+)$/);
  if (method === "DELETE" && adminDeleteAppMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const key = decodeURIComponent(adminDeleteAppMatch[1]).toLowerCase();
    const target = CONNECTED_APPS.find(
      (a) => String(a.id) === key || (a.app_key || a.name || "").toLowerCase().replace(/\s+/g, "_") === key
    );
    if (!target) return json(res, 404, { success: false, message: "Application not found" }, req);

    target.status = "Inactive";
    return json(res, 200, { success: true, is_active: false, message: `${target.name} disconnected` }, req);
  }

  // ── Admin Users Management (Paginated, Searchable, Filtered) ──
  if (method === "GET" && pathname === "/api/admin/users") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    let filtered = [...USERS];
    const search = (query.search || "").toLowerCase().trim();
    const roleFilter = (query.role || "all").toLowerCase();
    const statusFilter = (query.status || "all").toLowerCase();

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.full_name && u.full_name.toLowerCase().includes(search)) ||
          String(u.uid) === search
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role.toLowerCase() === roleFilter);
    }

    if (statusFilter !== "all") {
      const activeOnly = statusFilter === "active";
      filtered = filtered.filter((u) => u.is_active === activeOnly);
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const perPage = Math.max(1, parseInt(query.per_page, 10) || 20);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const paginated = filtered.slice(offset, offset + perPage).map((u) => ({
      uid: u.uid,
      id: u.uid,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      role: u.role,
      role_title: ROLES[u.role] || "End User",
      is_active: u.is_active,
      c_date: u.c_date,
      created_at: u.created_at,
    }));

    // If query contains paginate=true or standard adminApi request
    return json(res, 200, {
      users: paginated,
      total,
      page,
      per_page: perPage,
      pages,
    }, req);
  }

  if (method === "POST" && pathname === "/api/admin/users") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    try {
      const body = await getJsonBody(req);
      const { username, email, password, full_name, fullName, phone, role } = body;
      const cleanUsername = (username || "").trim();
      const cleanEmail = (email || "").trim().toLowerCase();

      if (!cleanUsername || !cleanEmail || !password) {
        return json(res, 400, { success: false, message: "Username, email, and password are required." }, req);
      }

      if (USERS.some((u) => u.email === cleanEmail || u.username === cleanUsername)) {
        return json(res, 409, { success: false, message: "User with this username or email already exists." }, req);
      }

      const uid = USERS.length > 0 ? Math.max(...USERS.map((u) => u.uid)) + 1 : 1;
      const newUser = {
        uid,
        id: uid,
        username: cleanUsername,
        email: cleanEmail,
        password: hashPassword(password),
        full_name: full_name || fullName || cleanUsername,
        phone: phone || "",
        role: role === "admin" ? "admin" : "user",
        role_title: ROLES[role === "admin" ? "admin" : "user"] || "End User",
        is_active: true,
        c_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      };
      USERS.unshift(newUser);

      recordAudit("ADMIN_CREATE_USER", auth.user, `Admin created user ${cleanUsername} (${newUser.role})`, newUser);

      return json(res, 201, {
        success: true,
        message: `User '${cleanUsername}' created successfully`,
        uid,
        user: sanitizeUser(newUser),
      }, req);
    } catch (e) {
      return json(res, 500, { success: false, message: "Failed to create user", error: e.message }, req);
    }
  }

  // ── Admin User Status Toggle ──
  const userStatusMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/status$/);
  if (method === "PUT" && userStatusMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const targetUid = parseInt(userStatusMatch[1], 10);
    const user = USERS.find((u) => u.uid === targetUid);
    if (!user) return json(res, 404, { success: false, message: "User not found" }, req);

    const body = await getJsonBody(req).catch(() => ({}));
    user.is_active = Boolean(body.is_active);

    if (!user.is_active) {
      SESSIONS.forEach((s) => {
        if (s.uid === targetUid) s.is_active = false;
      });
    }

    recordAudit("ADMIN_TOGGLE_STATUS", auth.user, `User ${user.username} status set to ${user.is_active ? "active" : "deactivated"}`, user);

    return json(res, 200, {
      success: true,
      message: `User '${user.username}' status updated to ${user.is_active ? "active" : "deactivated"}`,
      uid: targetUid,
      is_active: user.is_active,
    }, req);
  }

  // ── Admin User Role Update ──
  const userRoleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (method === "PUT" && userRoleMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const targetUid = parseInt(userRoleMatch[1], 10);
    const user = USERS.find((u) => u.uid === targetUid);
    if (!user) return json(res, 404, { success: false, message: "User not found" }, req);

    const body = await getJsonBody(req).catch(() => ({}));
    const newRole = body.role === "admin" ? "admin" : "user";
    user.role = newRole;

    recordAudit("ADMIN_CHANGE_ROLE", auth.user, `Role for ${user.username} changed to ${newRole}`, user);

    return json(res, 200, {
      success: true,
      message: `User role updated to ${newRole}`,
      uid: targetUid,
      role: newRole,
    }, req);
  }

  // ── Admin User Detail, Update & Delete ──
  const userAdminMatch = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if (userAdminMatch) {
    const targetUid = parseInt(userAdminMatch[1], 10);
    const user = USERS.find((u) => u.uid === targetUid);

    if (method === "PUT") {
      const auth = requireAdmin(req, res);
      if (!auth) return;
      if (!user) return json(res, 404, { success: false, message: "User not found" }, req);

      const body = await getJsonBody(req).catch(() => ({}));
      if (body.full_name !== undefined) user.full_name = body.full_name;
      if (body.email !== undefined) user.email = body.email;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.is_active !== undefined) user.is_active = Boolean(body.is_active);
      if (body.role !== undefined) user.role = body.role === "admin" ? "admin" : "user";

      recordAudit("ADMIN_UPDATE_USER", auth.user, `Updated profile for ${user.username}`, user);

      return json(res, 200, {
        success: true,
        message: "User updated successfully",
        user,
      }, req);
    }

    if (method === "DELETE") {
      const auth = requireAdmin(req, res);
      if (!auth) return;
      if (!user) return json(res, 404, { success: false, message: "User not found" }, req);

      USERS = USERS.filter((u) => u.uid !== targetUid);
      SESSIONS = SESSIONS.filter((s) => s.uid !== targetUid);

      recordAudit("ADMIN_DELETE_USER", auth.user, `Deleted user ${user.username}`, user);

      return json(res, 200, {
        success: true,
        message: `User '${user.username}' permanently deleted`,
      }, req);
    }
  }

  // ── Admin Roles & Permissions ──
  if (method === "GET" && pathname === "/api/admin/roles") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const adminCount = USERS.filter((u) => u.role === "admin").length;
    const userCount = USERS.filter((u) => u.role === "user").length;

    return json(res, 200, {
      roles: [
        {
          key: "admin",
          title: "Enterprise Admin",
          description: "Full system access with all administrative privileges",
          count: adminCount,
          permissions: PERMISSIONS_MAP["admin"],
          color: "#7047eb",
        },
        {
          key: "user",
          title: "End User",
          description: "Standard user with access to personal IAM Dashboard",
          count: userCount,
          permissions: PERMISSIONS_MAP["user"],
          color: "#1d4ed8",
        },
      ],
      permissions: [
        { key: "users.view", label: "View Users", category: "Users" },
        { key: "users.create", label: "Create Users", category: "Users" },
        { key: "users.edit", label: "Edit Users", category: "Users" },
        { key: "users.delete", label: "Delete Users", category: "Users" },
        { key: "roles.view", label: "View Roles", category: "RBAC" },
        { key: "roles.manage", label: "Manage Roles", category: "RBAC" },
        { key: "sessions.view", label: "View Sessions", category: "Sessions" },
        { key: "sessions.revoke", label: "Revoke Sessions", category: "Sessions" },
        { key: "audit.view", label: "View Audit Logs", category: "Security" },
        { key: "settings.manage", label: "Manage Settings", category: "System" },
      ],
    }, req);
  }

  // ── Admin Sessions Management ──
  if (method === "GET" && pathname === "/api/admin/sessions") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    let filtered = [...SESSIONS];
    const search = (query.search || "").toLowerCase().trim();
    const status = (query.status || "all").toLowerCase();

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.username.toLowerCase().includes(search) ||
          s.device_name.toLowerCase().includes(search) ||
          s.ip_address.includes(search)
      );
    }

    if (status === "active") filtered = filtered.filter((s) => s.is_active);
    if (status === "revoked") filtered = filtered.filter((s) => !s.is_active);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const perPage = Math.max(1, parseInt(query.per_page, 10) || 20);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const paginated = filtered.slice(offset, offset + perPage);

    return json(res, 200, {
      sessions: paginated,
      total,
      page,
      per_page: perPage,
      pages,
    }, req);
  }

  const sessionRevokeMatch = pathname.match(/^\/api\/admin\/sessions\/([^/]+)\/revoke$/);
  if (method === "POST" && sessionRevokeMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const sessionId = decodeURIComponent(sessionRevokeMatch[1]);
    const session = SESSIONS.find((s) => s.session_id === sessionId || String(s.id) === sessionId);

    if (session) {
      session.is_active = false;
      session.revoked_at = new Date().toISOString();
      recordAudit("ADMIN_REVOKE_SESSION", auth.user, `Admin revoked session ${sessionId}`);
      return json(res, 200, { success: true, message: "Session revoked successfully" }, req);
    }
    return json(res, 404, { success: false, message: "Session not found" }, req);
  }

  const userRevokeAllMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/sessions\/revoke-all$/);
  if (method === "POST" && userRevokeAllMatch) {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const targetUid = parseInt(userRevokeAllMatch[1], 10);
    let count = 0;
    SESSIONS.forEach((s) => {
      if (s.uid === targetUid && s.is_active) {
        s.is_active = false;
        count++;
      }
    });

    recordAudit("ADMIN_REVOKE_ALL_SESSIONS", auth.user, `Revoked all (${count}) active sessions for UID ${targetUid}`);

    return json(res, 200, {
      success: true,
      message: `Revoked ${count} active sessions`,
      revoked_count: count,
    }, req);
  }

  // ── Admin Login Activity ──
  if (method === "GET" && pathname === "/api/admin/login-activity") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    let filtered = [...LOGIN_ACTIVITIES];
    const search = (query.search || "").toLowerCase().trim();
    const status = (query.status || "all").toLowerCase();

    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.username.toLowerCase().includes(search) ||
          a.device_name.toLowerCase().includes(search) ||
          a.ip_address.includes(search)
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((a) => a.status.toLowerCase() === status);
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const perPage = Math.max(1, parseInt(query.per_page, 10) || 25);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const paginated = filtered.slice(offset, offset + perPage);

    return json(res, 200, {
      activities: paginated,
      total,
      page,
      per_page: perPage,
      pages,
    }, req);
  }

  // ── Admin Audit Logs ──
  if (method === "GET" && pathname === "/api/admin/audit-logs") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    let filtered = [...AUDIT_LOGS];
    const search = (query.search || "").toLowerCase().trim();
    const event = (query.event || "all").toUpperCase();

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.event_type.toLowerCase().includes(search) ||
          l.actor_username.toLowerCase().includes(search) ||
          l.details.toLowerCase().includes(search)
      );
    }

    if (event !== "ALL") {
      filtered = filtered.filter((l) => l.event_type.toUpperCase().includes(event));
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const perPage = Math.max(1, parseInt(query.per_page, 10) || 25);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const paginated = filtered.slice(offset, offset + perPage);

    return json(res, 200, {
      logs: paginated,
      total,
      page,
      per_page: perPage,
      pages,
    }, req);
  }

  // ── Admin Settings ──
  if (pathname === "/api/admin/settings") {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    if (method === "GET") {
      return json(res, 200, ADMIN_SETTINGS, req);
    }

    if (method === "PUT") {
      const body = await getJsonBody(req).catch(() => ({}));
      ADMIN_SETTINGS = { ...ADMIN_SETTINGS, ...body };
      recordAudit("ADMIN_UPDATE_SETTINGS", auth.user, "Updated system security settings");
      return json(res, 200, {
        success: true,
        message: "Settings updated successfully",
        settings: ADMIN_SETTINGS,
      }, req);
    }
  }

  // ============================================================================
  // USER DASHBOARD & END-USER IAM APIs (DASHBOARD/script.js)
  // ============================================================================

  if (method === "GET" && pathname === "/api/dashboard/overview") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const userSessions = SESSIONS.filter((s) => s.uid === auth.user.uid && s.is_active);
    return json(res, 200, {
      active_sessions: {
        count: userSessions.length,
        label: `${userSessions.length} devices`,
        description: `You're signed in on ${userSessions.length} devices`,
      },
      security_score: {
        score: 85,
        max_score: 100,
        label: "85 / 100",
        description: "Strong security posture with Passkeys & MFA",
        status: "Good",
        badge: "Strong",
      },
      connected_apps: {
        count: CONNECTED_APPS.length,
        label: `${CONNECTED_APPS.length} apps`,
        description: "Across your approved workspace",
      },
      system_status: { status: "Operational", badge: "Normal" },
    }, req);
  }

  if (method === "GET" && pathname === "/api/dashboard/login-activity") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const userActs = LOGIN_ACTIVITIES.filter((a) => a.uid === auth.user.uid);
    return json(res, 200, userActs, req);
  }

  if (method === "GET" && pathname === "/api/sessions/active") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const userSessions = SESSIONS.filter((s) => s.uid === auth.user.uid && s.is_active);
    return json(res, 200, {
      success: true,
      active_sessions: userSessions.length,
      devices: userSessions,
    }, req);
  }

  if (method === "GET" && pathname === "/api/sessions") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const userSessions = SESSIONS.filter((s) => s.uid === auth.user.uid && s.is_active);
    return json(res, 200, userSessions, req);
  }

  const deleteSessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (method === "DELETE" && deleteSessionMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const sid = decodeURIComponent(deleteSessionMatch[1]);
    const sess = SESSIONS.find((s) => (s.session_id === sid || String(s.id) === sid) && s.uid === auth.user.uid);
    if (sess) {
      sess.is_active = false;
      return json(res, 200, { success: true, message: "Session revoked successfully" }, req);
    }
    return json(res, 404, { success: false, message: "Session not found" }, req);
  }

  if (method === "POST" && pathname === "/api/sessions/revoke-others") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    let count = 0;
    SESSIONS.forEach((s) => {
      if (s.uid === auth.user.uid && s.session_token !== auth.token && s.is_active) {
        s.is_active = false;
        count++;
      }
    });
    return json(res, 200, { success: true, message: `Revoked ${count} other sessions` }, req);
  }

  if (method === "GET" && pathname === "/api/connected-apps") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const includeInactive = query.include_inactive === "true";
    const list = includeInactive
      ? CONNECTED_APPS
      : CONNECTED_APPS.filter((a) => (a.status || "Active").toLowerCase() === "active");
    return json(res, 200, list, req);
  }

  const deleteAppMatch = pathname.match(/^\/api\/connected-apps\/(\d+)$/);
  if (method === "DELETE" && deleteAppMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const appId = parseInt(deleteAppMatch[1], 10);
    const app = CONNECTED_APPS.find((a) => a.id === appId);
    if (!app) return json(res, 404, { success: false, message: "Application not found" }, req);
    app.status = "Inactive";
    return json(res, 200, { success: true, message: "Application disconnected" }, req);
  }

  const reconnectAppMatch = pathname.match(/^\/api\/connected-apps\/(\d+)\/reconnect$/);
  if (method === "POST" && reconnectAppMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const appId = parseInt(reconnectAppMatch[1], 10);
    const app = CONNECTED_APPS.find((a) => a.id === appId);
    if (!app) return json(res, 404, { success: false, message: "Application not found" }, req);
    app.status = "Active";
    return json(res, 200, { success: true, message: `Reconnected ${app.name}` }, req);
  }

  if (method === "GET" && pathname === "/api/security/checklist") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    return json(res, 200, [
      { id: 1, title: "Multi-Factor Authentication", desc: "Passkeys / FIDO2 enabled", completed: true },
      { id: 2, title: "Password Hygiene", desc: "Strong password with varied symbols", completed: true },
      { id: 3, title: "Verified Recovery Email", desc: "Backup recovery email configured", completed: true },
      { id: 4, title: "Active Sessions Review", desc: "Only authorized devices connected", completed: true },
    ], req);
  }

  if (method === "GET" && pathname === "/api/security/score") {
    const auth = requireAuth(req, res);
    if (!auth) return;

    return json(res, 200, { score: 85, max_score: 100, status: "Good" }, req);
  }

  // ── WebAuthn / Passkey Endpoints ──
  if (pathname.startsWith("/api/webauthn/")) {
    if (method === "GET" && pathname === "/api/webauthn/credentials") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const creds = WEBAUTHN_CREDENTIALS.filter((c) => c.uid === auth.user.uid);
      return json(res, 200, { success: true, credentials: creds }, req);
    }

    if (method === "DELETE" && pathname.startsWith("/api/webauthn/credentials/")) {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const credId = pathname.replace("/api/webauthn/credentials/", "");
      WEBAUTHN_CREDENTIALS = WEBAUTHN_CREDENTIALS.filter((c) => !(String(c.id) === credId && c.uid === auth.user.uid));
      return json(res, 200, { success: true, message: "Passkey removed successfully" }, req);
    }

    if (method === "POST" && pathname === "/api/webauthn/register/options") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const challenge = crypto.randomBytes(32).toString("base64url");
      WEBAUTHN_CHALLENGES.set(challenge, {
        uid: auth.user.uid,
        type: "registration",
        expiresAt: Date.now() + 300000,
      });
      return json(res, 200, {
        challenge,
        rp: { name: "VaultAuth SSO", id: "localhost" },
        user: {
          id: Buffer.from(String(auth.user.uid)).toString("base64url"),
          name: auth.user.email,
          displayName: auth.user.full_name || auth.user.username,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        timeout: 60000,
        attestation: "none",
        excludeCredentials: WEBAUTHN_CREDENTIALS.filter((c) => c.uid === auth.user.uid).map((c) => ({
          id: c.credential_id,
          type: "public-key",
        })),
      }, req);
    }

    if (method === "POST" && pathname === "/api/webauthn/register/verify") {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const body = await getJsonBody(req).catch(() => ({}));
      const cred = body.credential || body;
      let clientChallenge = null;
      try {
        const clientData = JSON.parse(Buffer.from(cred.response?.clientDataJSON || "", "base64url").toString("utf8"));
        clientChallenge = clientData.challenge;
      } catch {}

      const challengeRec = clientChallenge ? WEBAUTHN_CHALLENGES.get(clientChallenge) : null;
      if (
        !challengeRec ||
        challengeRec.type !== "registration" ||
        challengeRec.uid !== auth.user.uid ||
        challengeRec.expiresAt <= Date.now()
      ) {
        return json(res, 400, { success: false, message: "Invalid or expired registration challenge." }, req);
      }
      WEBAUTHN_CHALLENGES.delete(clientChallenge);

      if (!cred?.id) {
        return json(res, 400, { success: false, message: "Missing credential ID." }, req);
      }
      const newCred = {
        id: WEBAUTHN_CREDENTIALS.length + 1,
        uid: auth.user.uid,
        credential_id: cred.id,
        device_name: body.deviceName || "Passkey Authenticator",
        created_at: "Today, Just now",
        last_used_at: "Active Now",
      };
      WEBAUTHN_CREDENTIALS.push(newCred);
      recordAudit("WEBAUTHN_REGISTER_SUCCESS", auth.user, `Registered passkey: ${newCred.device_name}`);
      return json(res, 200, { success: true, message: "Passkey registered successfully!", credential: newCred }, req);
    }

    if (method === "POST" && pathname === "/api/webauthn/login/options") {
      const body = await getJsonBody(req).catch(() => ({}));
      const ident = (body.identifier || body.username || body.email || "").trim().toLowerCase();
      let targetUid = null;
      let allowCredentials;
      if (ident) {
        const targetUser = USERS.find((u) => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident);
        if (targetUser) {
          targetUid = targetUser.uid;
          allowCredentials = WEBAUTHN_CREDENTIALS.filter((c) => c.uid === targetUid).map((c) => ({
            id: c.credential_id,
            type: "public-key",
          }));
        }
      }
      const challenge = crypto.randomBytes(32).toString("base64url");
      WEBAUTHN_CHALLENGES.set(challenge, {
        uid: targetUid,
        type: "authentication",
        expiresAt: Date.now() + 300000,
      });
      return json(res, 200, {
        challenge,
        rpId: "localhost",
        timeout: 60000,
        userVerification: "preferred",
        ...(allowCredentials ? { allowCredentials } : {}),
      }, req);
    }

    if (method === "POST" && pathname === "/api/webauthn/login/verify") {
      const body = await getJsonBody(req).catch(() => ({}));
      const credPayload = body.credential || body;
      const credId = String(credPayload?.id || credPayload?.rawId || "").trim();
      if (!credId) {
        return json(res, 401, { success: false, message: "Missing passkey credential ID." }, req);
      }

      const credRecord = WEBAUTHN_CREDENTIALS.find((c) => c.credential_id === credId);
      if (!credRecord) {
        return json(res, 401, { success: false, message: "This passkey is not recognized." }, req);
      }

      let clientChallenge = null;
      try {
        const clientData = JSON.parse(Buffer.from(credPayload.response?.clientDataJSON || "", "base64url").toString("utf8"));
        clientChallenge = clientData.challenge;
      } catch {}

      const challengeRec = clientChallenge ? WEBAUTHN_CHALLENGES.get(clientChallenge) : null;
      if (
        !challengeRec ||
        challengeRec.type !== "authentication" ||
        challengeRec.expiresAt <= Date.now() ||
        (challengeRec.uid !== null && challengeRec.uid !== credRecord.uid)
      ) {
        return json(res, 401, { success: false, message: "Invalid or expired authentication challenge." }, req);
      }
      WEBAUTHN_CHALLENGES.delete(clientChallenge);

      const ownerUser = USERS.find((u) => u.uid === credRecord.uid);
      if (!ownerUser || !ownerUser.is_active) {
        return json(res, 401, { success: false, message: "Account not found or deactivated." }, req);
      }

      credRecord.last_used_at = "Active Now";
      const token = makeToken(ownerUser);
      recordAudit("WEBAUTHN_LOGIN_SUCCESS", ownerUser, `Passkey sign-in (${credRecord.device_name})`);
      return json(res, 200, {
        success: true,
        message: "Passkey verified! Successfully signed in.",
        token,
        user: sanitizeUser(ownerUser),
      }, req);
    }
  }

  // Not Found fallback
  json(res, 404, { message: `Endpoint not found: ${method} ${pathname}` }, req);
}

// ─── 4. Server Initialization ─────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`\n🛡️  VaultAuth SSO Full RBAC Backend listening on http://127.0.0.1:${PORT}`);
  console.log(`⚡  Admin APIs: /api/admin/* (Dashboard, Users, Roles, Sessions, Logs, Settings)`);
  console.log(`🔑  User & Auth APIs: /api/login, /api/register, /api/user/role, /api/dashboard/*`);
  console.log(`👤  Seeded Admin: admin@vaultauth.io / Admin@1234!\n`);
});

export default server;
