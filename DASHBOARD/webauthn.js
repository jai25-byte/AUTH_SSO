/**
 * VaultAuth SSO - Vanilla JS WebAuthn / FIDO2 Passkey Client
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.VaultAuthPasskeys = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function bufferToBase64url(buffer) {
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

  function base64urlToBuffer(base64url) {
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

  function isSupported() {
    return (
      typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined &&
      typeof window.navigator?.credentials?.create === "function" &&
      typeof window.navigator?.credentials?.get === "function"
    );
  }

  function prepareRegistrationOptions(options) {
    const prepared = Object.assign({}, options);
    if (typeof prepared.challenge === "string") {
      prepared.challenge = base64urlToBuffer(prepared.challenge);
    }
    if (prepared.user && typeof prepared.user.id === "string") {
      try {
        prepared.user.id = base64urlToBuffer(prepared.user.id);
      } catch (e) {
        prepared.user.id = new TextEncoder().encode(prepared.user.id);
      }
    }
    if (Array.isArray(prepared.excludeCredentials)) {
      prepared.excludeCredentials = prepared.excludeCredentials.map(function (c) {
        return Object.assign({}, c, {
          id: typeof c.id === "string" ? base64urlToBuffer(c.id) : c.id,
        });
      });
    }
    return prepared;
  }

  function serializeRegistrationCredential(credential) {
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
      response: response,
      clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
    };
  }

  function parseError(err) {
    if (!err) return "Passkey operation failed.";
    if (err.name === "NotAllowedError") return "Passkey request was cancelled or timed out.";
    if (err.name === "InvalidStateError") return "This passkey has already been registered on your account.";
    if (err.name === "NotSupportedError") return "Passkeys are not supported on this browser or platform.";
    if (err.name === "SecurityError") return "Security error: Ensure application is accessed via localhost or HTTPS.";
    return err.message || "An error occurred during passkey operation.";
  }

  return {
    isSupported: isSupported,
    bufferToBase64url: bufferToBase64url,
    base64urlToBuffer: base64urlToBuffer,
    prepareRegistrationOptions: prepareRegistrationOptions,
    serializeRegistrationCredential: serializeRegistrationCredential,
    parseError: parseError,
  };
});
