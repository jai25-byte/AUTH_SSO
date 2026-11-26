import { describe, it, expect } from "bun:test";
import {
  bufferToBase64url,
  base64urlToBuffer,
  parseWebAuthnError,
  prepareRegistrationOptions,
  prepareAuthenticationOptions,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from "../src/services/webauthn.js";

describe("WebAuthn Utility Tests", () => {
  it("encodes and decodes base64url correctly", () => {
    const input = new Uint8Array([72, 101, 108, 108, 111, 33]); // "Hello!"
    const encoded = bufferToBase64url(input.buffer);
    expect(encoded).toBe("SGVsbG8h");

    const decoded = base64urlToBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(input);
  });

  it("handles empty buffers gracefully", () => {
    const emptyBuf = new ArrayBuffer(0);
    expect(bufferToBase64url(emptyBuf)).toBe("");
    expect(base64urlToBuffer("").byteLength).toBe(0);
  });

  it("prepares registration options with base64url challenge", () => {
    const rawOptions = {
      challenge: "dGVzdC1jaGFsbGVuZ2U",
      user: { id: "dXNlci1pZA", name: "test" },
      excludeCredentials: [{ id: "Y3JlZC1pZA", type: "public-key" }],
    };

    const prepared = prepareRegistrationOptions(rawOptions);
    expect(prepared.challenge instanceof ArrayBuffer).toBe(true);
    expect(prepared.user.id instanceof ArrayBuffer).toBe(true);
    expect(prepared.excludeCredentials[0].id instanceof ArrayBuffer).toBe(true);
    // Option preparation must not mutate the server response object.
    expect(typeof rawOptions.user.id).toBe("string");
    expect(typeof rawOptions.excludeCredentials[0].id).toBe("string");
  });

  it("prepares authentication options with base64url challenge", () => {
    const rawOptions = {
      challenge: "YXV0aC1jaGFsbGVuZ2U",
      allowCredentials: [{ id: "Y3JlZC1pZA", type: "public-key" }],
    };

    const prepared = prepareAuthenticationOptions(rawOptions);
    expect(prepared.challenge instanceof ArrayBuffer).toBe(true);
    expect(prepared.allowCredentials[0].id instanceof ArrayBuffer).toBe(true);
  });

  it("does not claim platform authenticator support when it is unknown", async () => {
    if (!isWebAuthnSupported()) {
      expect(await isPlatformAuthenticatorAvailable()).toBe(false);
    }
  });

  it("parses WebAuthn errors into friendly messages", () => {
    expect(parseWebAuthnError({ name: "NotAllowedError" })).toContain("dismissed or timed out");
    expect(parseWebAuthnError({ name: "InvalidStateError" })).toContain("already been registered");
    expect(parseWebAuthnError({ name: "NotSupportedError" })).toContain("not supported");
    expect(parseWebAuthnError({ name: "AbortError" })).toContain("cancelled");
    expect(parseWebAuthnError({ message: "Custom hardware fault" })).toBe("Custom hardware fault");
  });
});
