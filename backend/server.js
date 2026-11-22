import http from "node:http";
import { parse } from "node:url";
import { StringDecoder } from "node:string_decoder";

const USERS = [];

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

function makeToken() {
  return Buffer.from(`${Date.now()}`).toString("base64");
}

function json(res, status, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(data);
}

async function requestHandler(req, res) {
  const { pathname } = parse(req.url, true);
  const method = req.method?.toUpperCase() ?? "";

  // CORS pre‑flight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Credentials": "true",
    });
    return res.end();
  }

  // POST /api/register
  if (method === "POST" && pathname === "/api/register") {
    try {
      const body = await getJsonBody(req);
      const { username, email, password } = body;
      if (!username || !email || !password) {
        return json(res, 400, { message: "Missing fields" });
      }
      if (USERS.find((u) => u.email === email)) {
        return json(res, 409, { message: "User already exists" });
      }
      const newUser = { id: USERS.length + 1, username, email, password };
      USERS.push(newUser);
      return json(res, 201, { success: true, user: newUser });
    } catch (e) {
      return json(res, 500, { message: "Invalid JSON", error: e.message });
    }
  }

  // POST /api/login
  if (method === "POST" && pathname === "/api/login") {
    try {
      const body = await getJsonBody(req);
      const { email, password } = body;
      const user = USERS.find((u) => u.email === email && u.password === password);
      if (!user) return json(res, 401, { message: "Invalid credentials" });
      const token = makeToken();
      return json(res, 200, { message: "Login successful", token, user });
    } catch (e) {
      return json(res, 500, { message: "Invalid JSON", error: e.message });
    }
  }

  // GET /api/users
  if (method === "GET" && pathname === "/api/users") {
    return json(res, 200, USERS);
  }

  // GET /api/users/:id or username/email
  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (method === "GET" && userMatch) {
    const ident = userMatch[1];
    const user =
      USERS.find((u) => u.id === Number(ident)) ||
      USERS.find((u) => u.username === ident || u.email === ident);
    if (!user) return json(res, 404, { message: "User not found" });
    return json(res, 200, user);
  }

  // Not found
  json(res, 404, { message: "Endpoint not found" });
}

const PORT = 5000;
http.createServer(requestHandler).listen(PORT, () => {
  console.log(`🛡️  Vault Auth backend listening on http://127.0.0.1:${PORT}`);
});
