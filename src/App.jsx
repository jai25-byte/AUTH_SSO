import React, { useState, useEffect } from "react";
import AuthPage from "./components/auth/AuthPage.jsx";
import UserDashboard from "./components/dashboard/UserDashboard.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  const getInitialPath = () => {
    if (typeof window === "undefined") return "/login";
    const path = (window.location.pathname || "").toLowerCase();
    const params = new URLSearchParams(window.location.search || "");
    const tabParam = (params.get("tab") || "").toLowerCase();

    if (path === "/admin" || path.startsWith("/admin/") || path === "/admin.html") {
      return "/admin";
    }
    if (
      path === "/dashboard" ||
      path.startsWith("/dashboard/") ||
      path === "/user" ||
      path === "/portal"
    ) {
      return "/dashboard";
    }
    if (path === "/register" || path === "/register.html" || tabParam === "register") {
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

  const navigate = (path, options = {}) => {
    if (typeof window !== "undefined") {
      if (options?.replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
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

  const isAdminView = currentPath.startsWith("/admin");
  const isDashboardView = currentPath.startsWith("/dashboard") || currentPath.startsWith("/user");
  const isRegisterView = currentPath === "/register";

  return (
    <div className="vault-app-root" style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
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

      {/* Global Notifications */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </div>
  );
}
