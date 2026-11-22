import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const borderColor = type === "success" ? "var(--success)" : type === "error" ? "var(--danger)" : "var(--blue-500)";

  return (
    <div className="toasts-container">
      <div className="toast" style={{ borderLeftColor: borderColor }}>
        <span className="toast__msg">{message}</span>
        <button type="button" className="toast__close" onClick={onClose} aria-label="Dismiss">×</button>
      </div>
    </div>
  );
}
