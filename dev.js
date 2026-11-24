import { watch } from "fs";
import { join } from "path";

const PORT = process.env.PORT || 3000;
const subscribers = new Set();

// Function to rebuild JS
async function buildJs() {
  const start = performance.now();
  const result = await Bun.build({
    entrypoints: ["src/main.jsx"],
    outdir: "public",
    naming: "bundle.[ext]",
    target: "browser",
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },
    sourcemap: "inline",
  });
  if (result.success) {
    const time = Math.round(performance.now() - start);
    console.log(`⚡ [Bun.build] JS bundled in ${time}ms`);
    return true;
  } else {
    console.error("❌ [Bun.build] JS bundle failed:", result.logs);
    return false;
  }
}

// Function to rebuild CSS
async function buildCss() {
  const start = performance.now();
  const proc = Bun.spawn([
    "bunx",
    "@tailwindcss/cli",
    "-i",
    "src/index.css",
    "-o",
    "public/styles.css",
  ]);
  await proc.exited;
  const time = Math.round(performance.now() - start);
  console.log(`🎨 [Tailwind] CSS compiled in ${time}ms`);
}

// Text encoder for SSE events
const encoder = new TextEncoder();

// Notify SSE clients to reload
function notifyReload() {
  for (const controller of subscribers) {
    try {
      controller.enqueue(encoder.encode("data: reload\n\n"));
    } catch {
      subscribers.delete(controller);
    }
  }
}

// Initial build
console.log("🛠️  Running initial build...");
await buildJs();
await buildCss();

// Ensure backend server is running on port 5000
async function ensureBackend() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/users", { method: "GET" });
    if (res.status) {
      console.log("🛡️  Backend server active on port 5000");
      return;
    }
  } catch {}

  console.log("🚀 Spawning VaultAuth backend server on port 5000...");
  const proc = Bun.spawn(["bun", "backend/server.js"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  process.on("exit", () => proc.kill());
}
await ensureBackend();

// Watch src/ directory
let debounceTimer = null;
watch("src", { recursive: true }, async (eventType, filename) => {
  if (!filename) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    console.log(`🔄 File modified: src/${filename}`);
    if (filename.endsWith(".jsx") || filename.endsWith(".js")) {
      const ok = await buildJs();
      if (ok) notifyReload();
    } else if (filename.endsWith(".css")) {
      await buildCss();
      notifyReload();
    }
  }, 80);
});

// MIME map
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

// Start Bun Server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Live reload SSE endpoint
    if (url.pathname === "/__dev_events") {
      let clientController;
      const stream = new ReadableStream({
        start(controller) {
          clientController = controller;
          subscribers.add(controller);
          controller.enqueue(encoder.encode("data: connected\n\n"));
        },
        cancel() {
          if (clientController) subscribers.delete(clientController);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Proxy API requests to backend server (Vault Auth API at http://127.0.0.1:5000)
    if (url.pathname.startsWith("/api/")) {
      const backendBase = process.env.BACKEND_URL || "http://127.0.0.1:5000";
      const reqOrigin = req.headers.get("origin");

      if (req.method === "OPTIONS") {
        const optHeaders = {
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        };
        if (reqOrigin) {
          optHeaders["Access-Control-Allow-Origin"] = reqOrigin;
          optHeaders["Access-Control-Allow-Credentials"] = "true";
          optHeaders["Vary"] = "Origin";
        } else {
          optHeaders["Access-Control-Allow-Origin"] = "*";
        }
        return new Response(null, {
          status: 204,
          headers: optHeaders,
        });
      }

      // Try primary target, then fallback between 127.0.0.1 and localhost
      const hostCandidates = [
        backendBase,
        backendBase.includes("127.0.0.1") ? "http://localhost:5000" : "http://127.0.0.1:5000",
      ];

      const requestBody =
        req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;

      let lastError = null;
      for (const base of hostCandidates) {
        try {
          const targetUrl = new URL(url.pathname + url.search, base);
          const proxyHeaders = new Headers(req.headers);
          proxyHeaders.delete("host");

          const proxyReq = new Request(targetUrl, {
            method: req.method,
            headers: proxyHeaders,
            body: requestBody,
            redirect: "manual",
          });

          const backendRes = await fetch(proxyReq);
          const resHeaders = new Headers(backendRes.headers);
          if (reqOrigin) {
            resHeaders.set("Access-Control-Allow-Origin", reqOrigin);
            resHeaders.set("Access-Control-Allow-Credentials", "true");
            resHeaders.set("Vary", "Origin");
          } else {
            resHeaders.set("Access-Control-Allow-Origin", "*");
            resHeaders.delete("Access-Control-Allow-Credentials");
          }

          return new Response(backendRes.body, {
            status: backendRes.status,
            statusText: backendRes.statusText,
            headers: resHeaders,
          });
        } catch (err) {
          lastError = err;
        }
      }

      return new Response(
        JSON.stringify({
          message: `Backend service unreachable at ${backendBase}. Please ensure your backend server is running.`,
          error: lastError?.message,
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // React SPA routing: /login, /register, /dashboard, /admin all resolve to public/index.html
    let pathname = url.pathname;
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/" ||
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname === "/user" ||
      pathname === "/portal"
    ) {
      pathname = "/index.html";
    }

    // Standalone / Vanilla Admin Dashboard (Legacy preview)
    if (
      pathname === "/admin-standalone" ||
      pathname === "/admin-standalone/" ||
      pathname === "/standalone-admin" ||
      pathname === "/admin-vanilla"
    ) {
      const vanillaAdmin = Bun.file(join(process.cwd(), "ADMIN", "index.html"));
      if (await vanillaAdmin.exists()) {
        return new Response(vanillaAdmin, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    if (pathname === "/dashboard-vanilla" || pathname === "/vanilla-dashboard") {
      return Response.redirect(new URL(`/DASHBOARD/index.html${url.search}`, url.origin), 302);
    }

    // Serve DASHBOARD static assets if path starts with /DASHBOARD or /dashboard
    if (pathname.startsWith("/DASHBOARD") || pathname.startsWith("/dashboard")) {
      const dashboardRel = pathname.replace(/^\/DASHBOARD\/?/, "").replace(/^\/dashboard\/?/, "") || "index.html";
      const dashFilePath = join(process.cwd(), "DASHBOARD", dashboardRel);
      const dashFile = Bun.file(dashFilePath);
      if (await dashFile.exists()) {
        const ext = dashboardRel.substring(dashboardRel.lastIndexOf("."));
        const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";
        return new Response(dashFile, {
          headers: { "Content-Type": contentType },
        });
      }
    }

    // Serve root ADMIN static assets (/ADMIN/styles.css, /ADMIN/script.js)
    if (pathname.startsWith("/ADMIN/") || pathname.startsWith("/admin/")) {
      const adminRel = pathname.replace(/^\/(ADMIN|admin)\/?/, "") || "index.html";
      const pubAdminPath = join(process.cwd(), "public", "ADMIN", adminRel);
      const pubAdminFile = Bun.file(pubAdminPath);
      if (await pubAdminFile.exists()) {
        const ext = adminRel.substring(adminRel.lastIndexOf("."));
        const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";
        return new Response(pubAdminFile, {
          headers: { "Content-Type": contentType },
        });
      }
      const rootAdminPath = join(process.cwd(), "ADMIN", adminRel);
      const rootAdminFile = Bun.file(rootAdminPath);
      if (await rootAdminFile.exists()) {
        const ext = adminRel.substring(adminRel.lastIndexOf("."));
        const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";
        return new Response(rootAdminFile, {
          headers: { "Content-Type": contentType },
        });
      }
    }

    const publicFilePath = join(process.cwd(), "public", pathname);
    const file = Bun.file(publicFilePath);

    if (await file.exists()) {
      const ext = pathname.substring(pathname.lastIndexOf("."));
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    }

    // Fallback to index.html for SPA
    const indexFile = Bun.file(join(process.cwd(), "public", "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`\n🚀 Server ready! Access the application at:`);
console.log(`👉 http://localhost:${server.port}\n`);
