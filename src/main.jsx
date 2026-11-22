import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";

const isPathAdmin = () => {
  if (typeof window === "undefined") return false;
  const path = (window.location.pathname || "").toLowerCase();
  const search = (window.location.search || "").toLowerCase();
  const hash = (window.location.hash || "").toLowerCase();
  return (
    path.includes("admin") ||
    search.includes("view=admin") ||
    search.includes("tab=admin") ||
    hash.includes("admin")
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      {isPathAdmin() ? <AdminDashboard /> : <App />}
    </React.StrictMode>
  );
}
