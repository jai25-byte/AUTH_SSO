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

## 🔗 Backend API Integration (Vault Auth)

The frontend is integrated with the Vault Auth Backend as specified in [openapi.json](./openapi.json) / [openapi.yaml](./openapi.yaml):

- **Backend URL**: `http://127.0.0.1:5000`
- **Proxy**: In dev mode (`bun dev.js`), requests to `/api/*` are automatically forwarded to `http://127.0.0.1:5000` to avoid CORS issues.
- **Endpoints Used**:
  - `POST /api/register` &ndash; Account creation with `username`, `email`, and `password`.
  - `POST /api/login` &ndash; Credential authentication returning session token.
  - `GET /api/users/{id}` &ndash; User profile lookup by username or email.
- **Two-Factor Authentication**: OTP verification runs as a demo multi-factor verification step immediately following backend password verification.
