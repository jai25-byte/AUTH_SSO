import React, { useState, useEffect } from "react";
import AuthPage from "./components/auth/AuthPage.jsx";
import UserDashboard from "./components/dashboard/UserDashboard.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import Toast from "./components/Toast.jsx";
import { Shield, LayoutDashboard, Lock } from "lucide-react";

export default function App() {
  const getInitialPath = () => {
    if (typeof window === "undefined") return "/";
    const path = (window.location.pathname || "").toLowerCase();
    const search = (window.location.search || "").toLowerCase();
    const hash = (window.location.hash || "").toLowerCase();

    if (path.includes("admin") || search.includes("admin") || hash.includes("admin")) {
      return "/admin";
    }
    if (path.includes("dashboard") || search.includes("dashboard") || hash.includes("dashboard")) {
      return "/dashboard";
    }
    if (path.includes("register") || search.includes("tab=register")) {
      return "/register";
    }
    return "/login";
  };

  const [currentPath, setCurrentPath] = useState(getInitialPath);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const notify = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "info" });
  };

  const navigate = (path) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      setCurrentPath(path.toLowerCase());
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getInitialPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Determine active view
  const isAdminView = currentPath.startsWith("/admin");
  const isDashboardView = currentPath.startsWith("/dashboard") || currentPath.startsWith("/user");
  const isRegisterView = currentPath === "/register";

  return (
    <div className="vault-app-root" style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Dynamic View Component */}
      {isAdminView ? (
        <AdminDashboard onNavigate={navigate} />
      ) : isDashboardView ? (
        <UserDashboard onNavigate={navigate} onNotify={notify} />
      ) : (
        <AuthPage
          initialTab={isRegisterView ? "register" : "login"}
          onNavigate={navigate}
          onNotify={notify}
        />
      )}

      {/* Floating Dev / Quick Switcher Pill */}
      <aside
        aria-label="Navigation Switcher"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "6px 10px",
          borderRadius: "9999px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        }}
      >
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 4px" }}>
          Portal:
        </span>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: !isAdminView && !isDashboardView ? "#7047eb" : "transparent",
            color: !isAdminView && !isDashboardView ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "9999px",
            padding: "4px 10px",
            fontSize: "0.76rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s",
          }}
        >
          <Lock size={12} /> Auth
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            background: isDashboardView ? "#7047eb" : "transparent",
            color: isDashboardView ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "9999px",
            padding: "4px 10px",
            fontSize: "0.76rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s",
          }}
        >
          <LayoutDashboard size={12} /> Dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          style={{
            background: isAdminView ? "#7047eb" : "transparent",
            color: isAdminView ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "9999px",
            padding: "4px 10px",
            fontSize: "0.76rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s",
          }}
        >
          <Shield size={12} /> Admin
        </button>
      </aside>

      {/* Global Notifications */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </div>
  );
}
