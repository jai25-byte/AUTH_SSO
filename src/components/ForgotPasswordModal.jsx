import React from "react";
import PasswordResetFlow from "./auth/PasswordResetFlow.jsx";

export default function ForgotPasswordModal({ isOpen, onClose, onNotify, initialEmail = "", onResetSuccess }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="login-clean-card" style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close password reset modal"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "1.3rem",
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <PasswordResetFlow
          initialEmail={initialEmail}
          onBackToLogin={onClose}
          onResetSuccess={(resetEmail) => {
            onResetSuccess?.(resetEmail);
            onClose();
          }}
          onNotify={onNotify}
        />
      </div>
    </div>
  );
}
