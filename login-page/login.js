/* VaultAuth SSO — Login page behaviour
 *
 * SECURITY MODEL
 * - This script never decides a user's role or dashboard. The Flask backend
 *   authenticates the user, reads the role from its own database/session, and
 *   returns the destination in `redirect`. The browser only follows it.
 * - Nothing sensitive is stored in localStorage/sessionStorage. The password is
 *   only sent over the login request and is never logged or persisted here.
 * - The session lives in the server's HttpOnly cookie. The backend must still
 *   protect every dashboard route; the client-side check below is a
 *   convenience, not a security control.
 *
 * ADJUST THESE TO MATCH YOUR FLASK ROUTES (see CONFIG).
 */
(() => {
  "use strict";

  /* ============================ CONFIG ============================ */
  const CONFIG = {
    // Your existing Flask login endpoint (POST, JSON in, JSON out).
    loginUrl: "/api/login",

    // Optional: returns { authenticated: true, redirect: "/dashboard" } for a
    // valid session. Set to null if you don't have one.
    sessionUrl: "/api/session",

    // Used only if the server says OTP is still required and gives no URL.
    otpFallbackUrl: "/verify-otp",

    // Used only if the server omits `redirect` on success.
    defaultRedirect: "/dashboard",

    // Show "Continue with Google" only if Google OAuth exists on the backend.
    googleSsoEnabled: false,
    googleUrl: "/auth/google",

    // Field names expected by your backend.
    fields: { email: "email", password: "password", remember: "remember" },

    // Milliseconds to show the success toast before redirecting.
    redirectDelay: 700,
  };
  /* ================================================================ */

  const $ = (sel) => document.querySelector(sel);

  const form = $("#login-form");
  const emailInput = $("#email");
  const passwordInput = $("#password");
  const rememberInput = $("#remember");
  const submitBtn = $("#submit-btn");
  const toggleBtn = $("#toggle-password");
  const toasts = $("#toasts");

  let submitting = false;

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Google button (optional) ---------- */
  if (CONFIG.googleSsoEnabled) {
    $("#google-btn").setAttribute("href", CONFIG.googleUrl);
    $("#social").hidden = false;
  }

  /* ---------- Helpers ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Only allow same-origin relative paths to avoid open-redirect abuse.
  function safePath(value) {
    if (typeof value !== "string") return null;
    if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
    return value;
  }

  function csrfHeaders() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const token = meta && meta.content;
    return token ? { "X-CSRFToken": token } : {};
  }

  function toast(message, type = "info", ms = 5000) {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");

    const msg = document.createElement("span");
    msg.className = "toast__msg";
    msg.textContent = message; // textContent: never inject server text as HTML

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast__close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";

    const remove = () => {
      el.classList.add("is-leaving");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    };
    close.addEventListener("click", remove);

    el.append(msg, close);
    toasts.appendChild(el);
    if (ms) setTimeout(remove, ms);
  }

  function setFieldError(input, message) {
    const field = input.closest(".field");
    const err = field.querySelector(".error");
    if (message) {
      field.classList.add("has-error");
      err.textContent = message;
      input.setAttribute("aria-invalid", "true");
    } else {
      field.classList.remove("has-error");
      err.textContent = "";
      input.removeAttribute("aria-invalid");
    }
  }

  function validateEmail() {
    const v = emailInput.value.trim();
    if (!v) return setFieldError(emailInput, "Please enter your email address."), false;
    if (!EMAIL_RE.test(v)) return setFieldError(emailInput, "Enter a valid email address, like you@company.com."), false;
    setFieldError(emailInput, "");
    return true;
  }

  function validatePassword() {
    if (!passwordInput.value) return setFieldError(passwordInput, "Please enter your password."), false;
    setFieldError(passwordInput, "");
    return true;
  }

  function setLoading(on) {
    submitting = on;
    submitBtn.classList.toggle("is-loading", on);
    submitBtn.setAttribute("aria-busy", String(on));
    submitBtn.querySelector(".btn__label").textContent = on ? "Signing in…" : "Sign in";
    emailInput.readOnly = on;
    passwordInput.readOnly = on;
  }

  function go(url) {
    window.location.assign(url);
  }

  /* ---------- Password visibility ---------- */
  toggleBtn.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    toggleBtn.setAttribute("aria-pressed", String(show));
    toggleBtn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    passwordInput.focus();
  });

  /* ---------- Live validation ---------- */
  emailInput.addEventListener("blur", () => { if (emailInput.value) validateEmail(); });
  emailInput.addEventListener("input", () => {
    if (emailInput.closest(".field").classList.contains("has-error")) validateEmail();
  });
  passwordInput.addEventListener("input", () => {
    if (passwordInput.closest(".field").classList.contains("has-error")) validatePassword();
  });

  /* ---------- Submit ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return; // block duplicate submissions

    const okEmail = validateEmail();
    const okPass = validatePassword();
    if (!okEmail || !okPass) {
      (!okEmail ? emailInput : passwordInput).focus();
      return;
    }

    setLoading(true);

    const body = {
      [CONFIG.fields.email]: emailInput.value.trim().toLowerCase(),
      [CONFIG.fields.password]: passwordInput.value,
      [CONFIG.fields.remember]: rememberInput.checked,
    };
    const next = safePath(new URLSearchParams(location.search).get("next"));
    if (next) body.next = next; // the server must re-validate this too

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(CONFIG.loginUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...csrfHeaders() },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      // Existing OTP flow: server says a verification step is still needed.
      if (data.otp_required || data.requires_otp) {
        toast(data.message || "Verification required. Check your email for the code.", "info");
        const otpUrl = safePath(data.otp_url) || CONFIG.otpFallbackUrl;
        setTimeout(() => go(otpUrl), CONFIG.redirectDelay);
        return; // keep the button locked while redirecting
      }

      if (res.ok && (data.success === undefined || data.success)) {
        toast(data.message || "Signed in successfully. Redirecting…", "success");
        passwordInput.value = "";
        const dest = safePath(data.redirect) || CONFIG.defaultRedirect;
        setTimeout(() => go(dest), CONFIG.redirectDelay);
        return; // keep the button locked while redirecting
      }

      // Failure paths
      if (res.status === 429) {
        toast(data.message || "Too many attempts. Please wait a moment and try again.", "error");
      } else if (res.status >= 500) {
        toast("The server had a problem. Please try again shortly.", "error");
      } else {
        // Keep it generic so the page doesn't reveal which accounts exist.
        toast(data.message || "Incorrect email or password.", "error");
        passwordInput.value = "";
        passwordInput.focus();
      }
      setLoading(false);
    } catch (err) {
      toast(
        err.name === "AbortError"
          ? "The request timed out. Please try again."
          : "Can't reach the server. Check your connection and try again.",
        "error"
      );
      setLoading(false);
    } finally {
      clearTimeout(timer);
    }
  });

  /* ---------- Compatibility with register / OTP / logout flows ---------- */
  // Your register and OTP pages can redirect here with a flag, e.g.
  //   /login?registered=1   /login?verified=1   /login?reset=1   /login?logout=1
  const params = new URLSearchParams(location.search);
  const notices = {
    registered: ["Account created. Please sign in.", "success"],
    verified: ["Email verified. You can now sign in.", "success"],
    reset: ["Password updated. Please sign in.", "success"],
    logout: ["You have been signed out.", "info"],
    expired: ["Your session expired. Please sign in again.", "info"],
  };
  for (const key of Object.keys(notices)) {
    if (params.has(key)) toast(...notices[key]);
  }

  /* ---------- Already signed in? Ask the server, never local storage ---------- */
  if (CONFIG.sessionUrl) {
    fetch(CONFIG.sessionUrl, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          go(safePath(data.redirect) || CONFIG.defaultRedirect);
        }
      })
      .catch(() => { /* not signed in, or endpoint absent: stay on the page */ });
  }
})();
