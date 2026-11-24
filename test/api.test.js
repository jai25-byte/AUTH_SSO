import { describe, it, expect } from "bun:test";
import { getApiBaseUrl, TOKEN_KEY, USER_KEY, validateResetPasswordPolicy, changePassword } from "../src/services/api.js";

describe("Frontend API Service Unit Tests", () => {
  it("exports valid token storage keys and password helpers", () => {
    expect(TOKEN_KEY).toBe("vault_auth_token");
    expect(USER_KEY).toBe("vault_auth_user");
    expect(typeof changePassword).toBe("function");
  });

  it("returns a valid default API base URL", () => {
    const baseUrl = getApiBaseUrl();
    expect(typeof baseUrl).toBe("string");
  });

  it("validates strict password reset complexity policy", () => {
    expect(validateResetPasswordPolicy("short1!").isValid).toBe(false);
    expect(validateResetPasswordPolicy("alllower1!").isValid).toBe(false);
    expect(validateResetPasswordPolicy("ALLUPPER1!").isValid).toBe(false);
    expect(validateResetPasswordPolicy("NoNumber!").isValid).toBe(false);
    expect(validateResetPasswordPolicy("NoSpecial123").isValid).toBe(false);
    const strong = validateResetPasswordPolicy("VaultAuth@2026!");
    expect(strong.isValid).toBe(true);
    expect(strong.errors.length).toBe(0);
  });
});
