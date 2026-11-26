import { describe, it, expect } from "bun:test";
import { getApiBaseUrl, TOKEN_KEY, USER_KEY, validateResetPasswordPolicy, changePassword, login } from "../src/services/api.js";
import { groupByUidAndTime, tallyField, toggleKeyInSet } from "../src/components/admin/activityGroupUtils.js";

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

  it("never replays a POST when a response was received but cannot be parsed", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("{not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    try {
      let threw = false;
      try {
        await login({ login: "alice", password: "secret" });
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
      expect(calls).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
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

  it("groups security activity entries sharing uid and time cleanly", () => {
    const rows = [
      { id: 1, uid: 24, created_at: "Nov 25, 2026 11:29 PM", status: "Success" },
      { id: 2, uid: 24, created_at: "Nov 25, 2026 11:29 PM", status: "Failed" },
      { id: 3, uid: 5, created_at: "Nov 25, 2026 11:29 PM", status: "Success" },
      { id: 4, uid: 24, created_at: "Nov 25, 2026 11:28 PM", status: "Success" },
    ];
    const grouped = groupByUidAndTime(rows, {
      getUid: (r) => r.uid,
      getTimeKey: (r) => r.created_at,
      toChildEvent: (ev) => ev,
      buildGroup: (lead, events, groupKey, timeKey) => ({
        ...lead,
        group_key: groupKey,
        time_bucket: timeKey,
        event_count: events.length,
        status_counts: tallyField(events, (e) => e.status),
        events,
      }),
    });
    expect(grouped.length).toBe(3);
    expect(grouped[0].uid).toBe(24);
    expect(grouped[0].event_count).toBe(2);
    expect(grouped[0].status_counts).toEqual({ Success: 1, Failed: 1 });
    expect(grouped[1].uid).toBe(5);
    expect(grouped[1].event_count).toBe(1);
    const next = toggleKeyInSet(new Set(["24::t1"]), "24::t1");
    expect(next.size).toBe(0);
  });
});
