import React, { useState, useEffect } from "react";
import LoginCard from "./components/LoginCard.jsx";
import RegisterCard from "./components/RegisterCard.jsx";
import OtpVerificationCard from "./components/OtpVerificationCard.jsx";
import AuthenticatedCard from "./components/AuthenticatedCard.jsx";
import TabSwitch from "./components/TabSwitch.jsx";
import Toast from "./components/Toast.jsx";
import ForgotPasswordModal from "./components/ForgotPasswordModal.jsx";
import { Shield, Lock } from "lucide-react";
import { removeToken, checkBackendHealth } from "./services/api.js";

export default function App() {
  const [authStep, setAuthStep] = useState("credentials"); // 'credentials' | 'otp' | 'authenticated'
  const [activeTab, setActiveTab] = useState("login");
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

  // Called after valid login step (Gmail OTP sent or password authenticated)
  const handleLoginSuccess = (userData) => {
    setPendingUser(userData);
    setAuthStep("otp");
  };

  // Called when real backend OTP verification succeeds
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
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden auth-bg select-none">
      {/* Decorative ambient glowing orbs behind glass */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Header with Security & Backend Status Badges */}
      <header className="relative z-10 flex flex-col items-center mb-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-sm">
            <Shield size={15} className="text-black" />
            <span className="text-xs font-semibold tracking-wider uppercase text-black">
              Vault Auth Gateway
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
              backendStatus === "connected"
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-950"
                : backendStatus === "offline"
                ? "bg-amber-500/20 border-amber-400/50 text-amber-950"
                : "bg-white/20 border-white/40 text-black/70"
            }`}
            title={
              backendStatus === "connected"
                ? "Vault Auth backend connected at 127.0.0.1:5000"
                : "Vault Auth backend not detected at 127.0.0.1:5000"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "connected"
                  ? "bg-emerald-600 animate-pulse"
                  : backendStatus === "offline"
                  ? "bg-amber-600"
                  : "bg-slate-400 animate-ping"
              }`}
            />
            <span>
              {backendStatus === "connected"
                ? "API Online"
                : backendStatus === "offline"
                ? "API Offline (127.0.0.1:5000)"
                : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-md">
        {/* Step Indicator / Tab Switcher */}
        {authStep === "credentials" && (
          <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {authStep === "otp" && (
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs font-semibold text-black/85 shadow-inner">
              <Lock size={13} className="text-black" />
              <span>Step 2 of 2: Multi-Factor Authentication</span>
            </div>
          </div>
        )}

        {authStep === "authenticated" && (
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-xs font-semibold text-emerald-950 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Verified SSO Session Active</span>
            </div>
          </div>
        )}

        {/* Dynamic Card Container */}
        <div className="transition-all duration-300">
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
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 mt-8 text-center text-xs text-white/80 font-medium">
        <p>&copy; {new Date().getFullYear()} SSO Authentication System &bull; All Rights Reserved</p>
      </footer>

      {/* Interactive Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onNotify={notify}
      />

      {/* Toast Feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
}
