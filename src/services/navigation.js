import { useState, useEffect, useCallback, useRef } from "react";

export function getValidTabFromUrl(validSet, fallback = "overview") {
  if (typeof window === "undefined") return fallback;
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("tab") || params.get("section") || params.get("page") || "").toLowerCase();
  return validSet.has(raw) ? raw : fallback;
}

export function pushTabHistory(tab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.pushState({ tab }, "", `${url.pathname}${url.search}`);
}

export function ensureInitialTabHistory(tab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.get("tab")) {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState({ tab }, "", `${url.pathname}${url.search}`);
}

/**
 * Syncs dashboard section state with browser History API (?tab=...)
 * so browser Back/Forward arrows navigate through recently visited sections.
 */
export function useHistoryTab(validSet, defaultTab = "overview") {
  const [activeTab, setActiveTab] = useState(() => getValidTabFromUrl(validSet, defaultTab));
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const selectTab = useCallback(
    (nextTab) => {
      if (!validSet.has(nextTab) || nextTab === activeTabRef.current) return;
      activeTabRef.current = nextTab;
      pushTabHistory(nextTab);
      setActiveTab(nextTab);
      if (typeof window !== "undefined") {
        window.scrollTo?.(0, 0);
      }
    },
    [validSet]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureInitialTabHistory(getValidTabFromUrl(validSet, defaultTab));

    const handlePopState = (e) => {
      const fromState = e.state?.tab;
      const next =
        fromState && validSet.has(fromState)
          ? fromState
          : getValidTabFromUrl(validSet, defaultTab);
      activeTabRef.current = next;
      setActiveTab(next);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [validSet, defaultTab]);

  return [activeTab, selectTab];
}
