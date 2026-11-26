# SSO Frontend Authentication Portal (React + Bun + Tailwind CSS v4)

A modern, high-performance Single Sign-On (SSO) authentication frontend built with **React**, **Bun**, and **Tailwind CSS v4** (using pure JavaScript, no TypeScript, no Vite).

## 🛠️ Tech Stack

- **Runtime & Bundler**: [Bun](https://bun.sh) (v1.4+)
- **Frontend Framework**: [React 19](https://react.dev) (JavaScript `.jsx`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + Vanilla CSS Glassmorphism
- **Icons**: [Lucide React](https://lucide.dev) + FontAwesome 6 CDN support
- **Font**: Google Font [Poppins](https://fonts.google.com/specimen/Poppins)

---

## 💻 Getting Started

### Prerequisites

Ensure [Bun](https://bun.sh) is installed on your system:
```bash
bun --version
```

### 1. Start the Development Server

You can quickly launch the application using the start script:

```bash
./start.sh
```

*(On macOS, you can also double-click `start.command` directly in Finder)*

Alternatively, run via Bun:
```bash
bun run dev
# or
bun start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Create a Production Build

To bundle and minify the JavaScript and CSS for production deployment:
```bash
bun run build
```
Optimized assets will be generated in the `dist/` directory.

---

## 🔗 Backend API Integration (Python / Flask)

The Node backend has been removed. The React frontend now talks **only** to the Python/Flask
backend in `../vault-auth-backend`.

- **Backend URL**: `http://127.0.0.1:5000` (override with `BACKEND_URL`)
- `bun run dev` proxies `/api/*` to the Flask backend. If it is not already running, the dev
  server starts it automatically. Override with `PYTHON_BACKEND_DIR` and
  `PYTHON_BACKEND_PYTHON` (e.g. `../vault-auth-backend/.venv/bin/python`) if needed.
- The Flask backend's `CORS_ORIGINS` must include the frontend origin (by default
  `http://localhost:3000`).
- **Endpoints Used**:
  - `POST /api/register` &ndash; Account creation with `username`, `email`, and `password`.
  - `POST /api/login` &ndash; Credential authentication returning session token.
  - `GET /api/users/{id}` &ndash; User profile lookup by username or email.
- **Two-Factor Authentication**: OTP verification runs as a demo multi-factor verification step immediately following backend password verification.

---

## 🔐 WebAuthn / FIDO2 Passkeys

Passkey registration and sign-in use real cryptographic verification (`@simplewebauthn/server`):
challenge, origin, RP ID, authenticator flags, signature and signature counter are all verified
before a credential is stored or a session token is issued. The previous challenge/ID-only mock
(and its unauthenticated account-takeover path) has been removed.

Configure the Relying Party before deploying (defaults target local development):

| Variable | Meaning | Example |
|---|---|---|
| `WEBAUTHN_RP_ID` | Registrable domain only, no scheme or port | `vaultauth.example.com` |
| `WEBAUTHN_RP_NAME` | Display name shown by authenticators | `VaultAuth SSO` |
| `WEBAUTHN_ORIGINS` | Comma-separated allowed origins (scheme + port) | `https://vaultauth.example.com,https://www.vaultauth.example.com` |

Passkeys require a secure context: use `localhost` during development and **HTTPS** in production.
Changing the RP ID after credentials are registered makes existing passkeys unusable.
