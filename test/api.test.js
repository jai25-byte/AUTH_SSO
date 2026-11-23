import { describe, it, expect } from "bun:test";
import { getApiBaseUrl, TOKEN_KEY, USER_KEY } from "../src/services/api.js";

describe("Frontend API Service Unit Tests", () => {
  it("exports valid token storage keys", () => {
    expect(TOKEN_KEY).toBe("vault_auth_token");
    expect(USER_KEY).toBe("vault_auth_user");
  });

  it("returns a valid default API base URL", () => {
    const baseUrl = getApiBaseUrl();
    expect(typeof baseUrl).toBe("string");
  });
});
