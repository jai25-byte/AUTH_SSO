import React, { useState, useEffect } from "react";
import LoginCard from "./components/LoginCard.jsx";
import RegisterCard from "./components/RegisterCard.jsx";
import OtpVerificationCard from "./components/OtpVerificationCard.jsx";
import AuthenticatedCard from "./components/AuthenticatedCard.jsx";
import Toast from "./components/Toast.jsx";
import ForgotPasswordModal from "./components/ForgotPasswordModal.jsx";
import BrandingSidebar from "./components/BrandingSidebar.jsx";
import { removeToken, checkBackendHealth } from "./services/api.js";

export default function App() {
  const getInitialTab = () => {
    if (typeof window === "undefined") return "login";
    const path = (window.location.pathname || "").toLowerCase();
    const q = new URLSearchParams(window.location.search || "");
    return path.includes("register") || q.get("tab") === "register" ? "register" : "login";
  };

  const [authStep, setAuthStep] = useState("credentials"); // 'credentials' | 'otp' | 'authenticated'
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");

  const notify = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "info" });
  };

  // Check backend connectivity on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = () => {
      checkBackendHealth().then((res) => {
        if (isMounted) {
          setBackendStatus(res.ok ? "connected" : "offline");
        }
      });
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Called after valid login step
  const handleLoginSuccess = (userData) => {
    setPendingUser(userData);
    if (userData?.passkeyVerified) {
      setAuthStep("authenticated");
    } else {
      setAuthStep("otp");
    }
  };

  // Called when OTP verification succeeds
  const handleOtpVerifySuccess = (userData) => {
    setPendingUser((prev) => ({ ...prev, ...userData }));
    setAuthStep("authenticated");
  };

  // Back to login credentials
  const handleBackToLogin = () => {
    setAuthStep("credentials");
    setActiveTab("login");
  };

  // Sign out from authenticated session
  const handleSignOut = () => {
    removeToken();
    setAuthStep("credentials");
    setActiveTab("login");
    setPendingUser(null);
    notify("You have signed out successfully.", "info");
  };

  return (
    <main className="shell">
      {/* ============ LEFT: BRANDING ============ */}
      <BrandingSidebar backendStatus={backendStatus} />

      {/* ============ RIGHT: FORM PANEL ============ */}
      <section className="panel" aria-labelledby="form-title">
        <div className="card">
          {authStep === "credentials" && (
            <>
              {activeTab === "login" ? (
                <LoginCard
                  key="login"
                  onSwitchToRegister={() => setActiveTab("register")}
                  onForgotPassword={() => setIsForgotModalOpen(true)}
                  onLoginSuccess={handleLoginSuccess}
                  onNotify={notify}
                />
              ) : (
                <RegisterCard
                  key="register"
                  onSwitchToLogin={() => setActiveTab("login")}
                  onNotify={notify}
                />
              )}
            </>
          )}

          {authStep === "otp" && (
            <OtpVerificationCard
              key="otp"
              user={pendingUser}
              onVerifySuccess={handleOtpVerifySuccess}
              onBackToLogin={handleBackToLogin}
              onNotify={notify}
            />
          )}

          {authStep === "authenticated" && (
            <AuthenticatedCard
              key="authenticated"
              user={pendingUser}
              onSignOut={handleSignOut}
              onNotify={notify}
            />
          )}
        </div>
      </section>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onNotify={notify}
      />

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </main>
  );
}
