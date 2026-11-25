import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import http from "node:http";

// Test against the server handlers or standalone instance
const TEST_PORT = 5099;
let serverInstance;

beforeAll(async () => {
  process.env.PORT = String(TEST_PORT);
  const mod = await import("../backend/server.js");
  serverInstance = mod.default;
  // Give it a brief moment to bind if needed
  await new Promise((r) => setTimeout(r, 100));
});

afterAll(() => {
  if (serverInstance && serverInstance.close) {
    serverInstance.close();
  }
});

const BASE = `http://127.0.0.1:${TEST_PORT}`;

describe("Node.js Backend Server API Suite", () => {
  let adminToken = "";
  let createdUid = null;

  it("GET /api/health returns 200 and status ok", async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("POST /api/login authenticates admin and returns token", async () => {
    const res = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: "admin@vaultauth.io",
        password: "Admin@1234!",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe("admin");
    adminToken = data.token;
  });

  it("GET /api/user/role returns admin role for admin token", async () => {
    const res = await fetch(`${BASE}/api/user/role`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("admin");
    expect(data.role_title).toBe("Enterprise Admin");
  });

  it("GET /api/admin/dashboard/stats returns complete statistics", async () => {
    const res = await fetch(`${BASE}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_users).toBeGreaterThanOrEqual(1);
    expect(data.administrators).toBeGreaterThanOrEqual(1);
    expect(data.active_sessions).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/admin/users returns paginated user list", async () => {
    const res = await fetch(`${BASE}/api/admin/users?page=1&per_page=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/admin/users creates a new user", async () => {
    const timestamp = Date.now();
    const res = await fetch(`${BASE}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: `qa_user_${timestamp}`,
        email: `qa_${timestamp}@vault.io`,
        password: "Password@1234!",
        full_name: "QA User",
        role: "user",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.uid).toBeDefined();
    createdUid = data.uid;
  });

  it("PUT /api/admin/users/:uid/status updates user active state", async () => {
    const res = await fetch(`${BASE}/api/admin/users/${createdUid}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ is_active: false }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.is_active).toBe(false);
  });

  it("GET /api/admin/roles returns role definitions and permissions", async () => {
    const res = await fetch(`${BASE}/api/admin/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.roles.length).toBeGreaterThanOrEqual(2);
    expect(data.permissions.length).toBeGreaterThanOrEqual(5);
  });

  it("GET /api/admin/sessions returns active sessions", async () => {
    const res = await fetch(`${BASE}/api/admin/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.sessions)).toBe(true);
  });

  it("GET /api/admin/login-activity returns login activities", async () => {
    const res = await fetch(`${BASE}/api/admin/login-activity`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.activities)).toBe(true);
  });

  it("GET /api/admin/audit-logs returns audit logs", async () => {
    const res = await fetch(`${BASE}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.logs)).toBe(true);
  });

  it("GET /api/admin/settings and PUT /api/admin/settings work", async () => {
    const getRes = await fetch(`${BASE}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status).toBe(200);
    const settings = await getRes.json();
    expect(settings.app_name).toBeDefined();

    const putRes = await fetch(`${BASE}/api/admin/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ session_timeout: "7200" }),
    });
    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(updated.success).toBe(true);
    expect(updated.settings.session_timeout).toBe("7200");
  });

  it("Unauthenticated request to admin route returns 401", async () => {
    const res = await fetch(`${BASE}/api/admin/dashboard/stats`);
    expect(res.status).toBe(401);
  });

  it("POST /api/login accepts login, username, and email keys", async () => {
    // 1. Using { username, password }
    const res1 = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "bob", password: "Password@1234!" }),
    });
    expect(res1.status).toBe(200);
    const d1 = await res1.json();
    expect(d1.user.password).toBeUndefined(); // no password leaked

    // 2. Using { email, password }
    const res2 = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@vault.io", password: "Password@1234!" }),
    });
    expect(res2.status).toBe(200);

    // 3. Using { login, username, password } as sent by api.js
    const res3 = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "bob", username: "bob", password: "Password@1234!" }),
    });
    expect(res3.status).toBe(200);
  });

  it("GET /api/session returns session data when authenticated", async () => {
    const res = await fetch(`${BASE}/api/session`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.user.role).toBe("admin");
  });

  it("POST /api/register assigns valid role and does not leak password hash", async () => {
    const res = await fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `reg_test_${Date.now()}`,
        email: `admin_attempt_${Date.now()}@example.com`,
        password: "SecurePassword123!",
        role: "admin",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.role).toBe("user");
    expect(data.user.role_title).toBe("End User");
    expect(data.user.password).toBeUndefined();
  });

  it("POST /api/register with require_otp triggers post-signup OTP challenge", async () => {
    const res = await fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `reg_otp_${Date.now()}`,
        email: `reg_otp_${Date.now()}@example.com`,
        password: "SecurePassword123!",
        require_otp: true,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.otp_required).toBe(true);
    expect(data.requires_otp).toBe(true);
    expect(data.email_masked).toBeDefined();
    expect(data.otp).toBeUndefined();
  });

  it("Enforces auth on /api/users and blocks hardcoded OTP and WebAuthn bypasses", async () => {
    // /api/users requires admin auth
    const anonUsers = await fetch(`${BASE}/api/users`);
    expect(anonUsers.status).toBe(401);

    const bobLogin = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "bob", password: "Password@1234!" }),
    });
    const bobToken = (await bobLogin.json()).token;

    const bobUsers = await fetch(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    expect(bobUsers.status).toBe(403);

    const adminUsers = await fetch(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminUsers.status).toBe(200);

    // Hardcoded 123456 OTP bypass rejected
    const otpBypass = await fetch(`${BASE}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "bob", otp: "123456" }),
    });
    expect(otpBypass.status).toBe(401);

    // Unrecognized WebAuthn login rejected
    const fakePasskey = await fetch(`${BASE}/api/webauthn/login/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "fake-credential-id" }),
    });
    expect(fakePasskey.status).toBe(401);

    // Authenticated password change works
    const chgOk = await fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({
        current_password: "Password@1234!",
        new_password: "BobUpdated@2026!",
        confirm_password: "BobUpdated@2026!",
      }),
    });
    expect(chgOk.status).toBe(200);
  });

  it("Forgot & Reset Password routes enforce enumeration protection, cooldown, and token rules", async () => {
    const req1 = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@vault.io" }),
    });
    const req2 = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@vault.io" }),
    });
    expect(req1.status).toBe(200);
    expect(req2.status).toBe(200);
    const d1 = await req1.json();
    const d2 = await req2.json();
    expect(d1.message).toBe(d2.message);
    expect(d1.otp).toBeUndefined();

    // Resend within 60s returns 429 cooldown
    const resend = await fetch(`${BASE}/api/auth/resend-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@vault.io" }),
    });
    expect(resend.status).toBe(429);

    // Invalid reset token rejected
    const resetBad = await fetch(`${BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_token: "invalid-token", new_password: "NewStrong@2026!" }),
    });
    expect(resetBad.status).toBe(400);
  });
});
