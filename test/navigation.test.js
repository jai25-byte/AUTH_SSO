import { describe, test, expect, afterEach } from "bun:test";
import {
  getValidTabFromUrl,
  pushTabHistory,
  ensureInitialTabHistory,
} from "../src/services/navigation.js";

const originalWindow = globalThis.window;

function installMockBrowser(initialUrl = "http://localhost:3000/dashboard") {
  const stack = [{ url: initialUrl, state: null }];
  let index = 0;

  const mockWindow = {
    location: new URL(initialUrl),
    history: {
      get length() {
        return stack.length;
      },
      get state() {
        return stack[index].state;
      },
      replaceState(state, _title, nextUrl) {
        const resolved = new URL(nextUrl, mockWindow.location.origin);
        stack[index] = { url: resolved.toString(), state: state ?? null };
        mockWindow.location = resolved;
      },
      pushState(state, _title, nextUrl) {
        const resolved = new URL(nextUrl, mockWindow.location.origin);
        stack.splice(index + 1);
        stack.push({ url: resolved.toString(), state: state ?? null });
        index = stack.length - 1;
        mockWindow.location = resolved;
      },
      back() {
        if (index > 0) {
          index -= 1;
          mockWindow.location = new URL(stack[index].url);
        }
        return stack[index];
      },
    },
    _stack: stack,
    _getIndex: () => index,
  };

  globalThis.window = mockWindow;
  return mockWindow;
}

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }
});

describe("Browser Section History Navigation", () => {
  const USER_TABS = new Set(["overview", "apps", "activity", "devices", "security", "profile", "help"]);
  const ADMIN_TABS = new Set(["overview", "users", "roles", "sessions", "activity", "audit", "settings"]);

  test("getValidTabFromUrl resolves valid tab query params and falls back cleanly", () => {
    installMockBrowser("http://localhost:3000/dashboard?tab=activity");
    expect(getValidTabFromUrl(USER_TABS, "overview")).toBe("activity");

    installMockBrowser("http://localhost:3000/dashboard?tab=unknown");
    expect(getValidTabFromUrl(USER_TABS, "overview")).toBe("overview");

    installMockBrowser("http://localhost:3000/admin?tab=audit");
    expect(getValidTabFromUrl(ADMIN_TABS, "overview")).toBe("audit");

    delete globalThis.window;
    expect(getValidTabFromUrl(USER_TABS, "overview")).toBe("overview");
  });

  test("pushTabHistory records each section hop and browser Back returns to the recent section instead of /login", () => {
    const win = installMockBrowser("http://localhost:3000/login");

    // Post-login redirect replaces /login with /dashboard, then dashboard seeds initial tab
    win.history.replaceState({}, "", "/dashboard");
    ensureInitialTabHistory("overview");
    expect(win.location.pathname + win.location.search).toBe("/dashboard?tab=overview");
    expect(win._stack.length).toBe(1);

    // Navigate overview -> apps -> activity
    pushTabHistory("apps");
    pushTabHistory("activity");
    expect(win._stack.length).toBe(3);
    expect(win.location.pathname + win.location.search).toBe("/dashboard?tab=activity");

    // Pressing Back once from activity returns to apps (not /login)
    win.history.back();
    expect(win.location.pathname).toBe("/dashboard");
    expect(getValidTabFromUrl(USER_TABS, "overview")).toBe("apps");

    // Pressing Back again returns to overview (still not /login)
    win.history.back();
    expect(win.location.pathname).toBe("/dashboard");
    expect(getValidTabFromUrl(USER_TABS, "overview")).toBe("overview");
  });

  test("ensureInitialTabHistory preserves pathname across admin pages and pushTabHistory preserves extra query params", () => {
    const win = installMockBrowser("http://localhost:3000/admin?foo=bar");
    ensureInitialTabHistory("overview");
    expect(win.location.pathname).toBe("/admin");
    expect(win.location.searchParams.get("tab")).toBe("overview");
    expect(win.location.searchParams.get("foo")).toBe("bar");

    pushTabHistory("activity");
    expect(win.location.searchParams.get("tab")).toBe("activity");
    expect(win.location.searchParams.get("foo")).toBe("bar");
    expect(getValidTabFromUrl(ADMIN_TABS, "overview")).toBe("activity");
  });
});
