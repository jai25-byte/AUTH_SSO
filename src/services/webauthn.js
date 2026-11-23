/**
 * WebAuthn / FIDO2 Passkey Client Utilities
 * Provides base64url converters, credential serializers, and high-level registration & login helpers.
 */

import { getApiBaseUrl, getToken, setToken, setStoredUser } from "./api.js";

// ─── Base64URL Encoders & Decoders ──────────────────────────────────────────

export function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64urlToBuffer(base64url) {
  if (!base64url) return new ArrayBuffer(0);
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Capability Checks ──────────────────────────────────────────────────────

export function isWebAuthnSupported() {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.navigator?.credentials?.create === "function" &&
    typeof window.navigator?.credentials?.get === "function"
  );
}

export async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }
  return true;
}

// ─── Options Preprocessing ──────────────────────────────────────────────────

export function prepareRegistrationOptions(options) {
  const prepared = { ...options };

  if (typeof prepared.challenge === "string") {
    prepared.challenge = base64urlToBuffer(prepared.challenge);
  }

  if (prepared.user && typeof prepared.user.id === "string") {
    // If user.id is base64url or string
    try {
      prepared.user.id = base64urlToBuffer(prepared.user.id);
    } catch {
      prepared.user.id = new TextEncoder().encode(prepared.user.id);
    }
  }

  if (Array.isArray(prepared.excludeCredentials)) {
    prepared.excludeCredentials = prepared.excludeCredentials.map((cred) => ({
      ...cred,
      id: typeof cred.id === "string" ? base64urlToBuffer(cred.id) : cred.id,
    }));
  }

  return prepared;
}

export function prepareAuthenticationOptions(options) {
  const prepared = { ...options };

  if (typeof prepared.challenge === "string") {
    prepared.challenge = base64urlToBuffer(prepared.challenge);
  }

  if (Array.isArray(prepared.allowCredentials)) {
    prepared.allowCredentials = prepared.allowCredentials.map((cred) => ({
      ...cred,
      id: typeof cred.id === "string" ? base64urlToBuffer(cred.id) : cred.id,
    }));
  }

  return prepared;
}

// ─── Credential Serialization ───────────────────────────────────────────────

export function serializeRegistrationCredential(credential) {
  const response = {
    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
    attestationObject: bufferToBase64url(credential.response.attestationObject),
  };

  if (typeof credential.response.getTransports === "function") {
    response.transports = credential.response.getTransports();
  }

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response,
    clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
  };
}

export function serializeAuthenticationCredential(credential) {
  const response = {
    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
    authenticatorData: bufferToBase64url(credential.response.authenticatorData),
    signature: bufferToBase64url(credential.response.signature),
  };

  if (credential.response.userHandle) {
    response.userHandle = bufferToBase64url(credential.response.userHandle);
  }

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response,
    clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
  };
}

// ─── Error Handling ─────────────────────────────────────────────────────────

export function parseWebAuthnError(err) {
  if (!err) return "Passkey operation failed.";
  if (err.name === "NotAllowedError") {
    return "Passkey prompt was dismissed or timed out.";
  }
  if (err.name === "InvalidStateError") {
    return "This authenticator has already been registered to your account.";
  }
  if (err.name === "NotSupportedError") {
    return "Passkeys are not supported on this browser or platform.";
  }
  if (err.name === "SecurityError") {
    return "Security error: Ensure the dashboard is served over HTTPS or localhost.";
  }
  if (err.name === "AbortError") {
    return "Passkey interaction was cancelled.";
  }
  return err.message || "An unexpected error occurred during passkey authentication.";
}

// ─── High-Level Passkey Operations ──────────────────────────────────────────

async function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Register a new passkey for the current authenticated user
 */
export async function registerPasskey(deviceName) {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this browser or operating system.");
  }

  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();

  // 1. Fetch registration challenge options
  const optRes = await fetch(`${base}/api/webauthn/register/options`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!optRes.ok) {
    const errData = await optRes.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to retrieve passkey registration options.");
  }

  const serverOptions = await optRes.json();
  const publicKeyOptions = prepareRegistrationOptions(serverOptions);

  // 2. Prompt user authenticator via browser native API
  let credential;
  try {
    credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });
  } catch (err) {
    throw new Error(parseWebAuthnError(err));
  }

  if (!credential) {
    throw new Error("No passkey was created by the authenticator.");
  }

  // 3. Serialize and send to backend for cryptographic verification
  const serialized = serializeRegistrationCredential(credential);
  const verifyRes = await fetch(`${base}/api/webauthn/register/verify`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      credential: serialized,
      deviceName: deviceName || "Passkey Authenticator",
    }),
  });

  const verifyData = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok || !verifyData.success) {
    throw new Error(verifyData.message || "Server verification of passkey failed.");
  }

  return verifyData;
}

/**
 * Sign in using an existing registered passkey
 */
export async function loginWithPasskey(identifier) {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this browser or device.");
  }

  const base = getApiBaseUrl();

  // 1. Fetch authentication options
  const optRes = await fetch(`${base}/api/webauthn/login/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ identifier: identifier ? identifier.trim() : undefined }),
  });

  if (!optRes.ok) {
    const errData = await optRes.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to initiate passkey sign-in.");
  }

  const serverOptions = await optRes.json();
  const publicKeyOptions = prepareAuthenticationOptions(serverOptions);

  // 2. Prompt user authenticator via browser native API
  let assertion;
  try {
    assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });
  } catch (err) {
    throw new Error(parseWebAuthnError(err));
  }

  if (!assertion) {
    throw new Error("Passkey sign-in was not completed.");
  }

  // 3. Serialize assertion and verify on backend
  const serialized = serializeAuthenticationCredential(assertion);
  const verifyRes = await fetch(`${base}/api/webauthn/login/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ credential: serialized }),
  });

  const verifyData = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok || !verifyData.success) {
    throw new Error(verifyData.message || "Passkey authentication verification failed.");
  }

  // 4. Save session token and user info
  if (verifyData.token) {
    setToken(verifyData.token);
  }
  if (verifyData.user) {
    setStoredUser(verifyData.user);
  }

  return verifyData;
}

/**
 * Retrieve registered passkeys for the current user
 */
export async function getPasskeyCredentials() {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/webauthn/credentials`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to load registered passkeys.");
  }
  const data = await res.json();
  return data.credentials || [];
}

/**
 * Remove a registered passkey by ID
 */
export async function deletePasskeyCredential(id) {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/webauthn/credentials/${id}`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to remove passkey.");
  }
  return data;
}
