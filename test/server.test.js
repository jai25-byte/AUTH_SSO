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
});
