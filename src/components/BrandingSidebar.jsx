import React from "react";

export default function BrandingSidebar({ backendStatus }) {
  const year = new Date().getFullYear();

  return (
    <aside className="brand" aria-label="About VaultAuth SSO">
      <div className="brand__glow" aria-hidden="true"></div>

      {/* Logo */}
      <a className="logo" href="/" aria-label="VaultAuth SSO home">
        <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#60a5fa" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <path d="M16 2 28 6.5v8.2c0 7.4-4.8 12.6-12 15.3C8.8 27.300 4 22.100 4 14.700V6.500L16 2Z" fill="url(#lg)" />
          <path d="m10.500 16 4 4 7.500-8" fill="none" stroke="#fff" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="logo__text">VaultAuth <em>SSO</em></span>
      </a>

      {/* Body */}
      <div className="brand__body">
        <h1 className="brand__title">One Identity.<br /><span>Every Access.</span></h1>
        <p className="brand__lead">
          Securely access your digital workspace with a unified identity management platform.
        </p>

        <ul className="features">
          <li>
            <span className="features__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3 4.500 6v5.500c0 4.600 3.100 7.900 7.500 9.500 4.400-1.600 7.500-4.900 7.500-9.500V6L12 3Z"/></svg>
            </span>
            <span>
              <strong>Enterprise-grade Security</strong>
              <small>Encrypted credentials and verified sessions.</small>
            </span>
          </li>
          <li>
            <span className="features__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.200"/><path d="M5 20c0-3.500 3.100-6 7-6s7 2.500 7 6"/></svg>
            </span>
            <span>
              <strong>Centralized Identity Management</strong>
              <small>Users, roles and access in one place.</small>
            </span>
          </li>
          <li>
            <span className="features__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            </span>
            <span>
              <strong>Secure Single Sign-On</strong>
              <small>One login for every connected application.</small>
            </span>
          </li>
        </ul>
      </div>

      {/* Abstract security graphic */}
      <svg className="brand__art" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="art-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" stopOpacity=".35" />
            <stop offset="1" stopColor="#6366f1" stopOpacity=".12" />
          </linearGradient>
          <linearGradient id="art-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#93c5fd" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#fff" strokeOpacity=".07">
          <circle cx="260" cy="260" r="110" />
          <circle cx="260" cy="260" r="170" />
          <circle cx="260" cy="260" r="230" />
        </g>
        <g stroke="url(#art-stroke)" strokeOpacity=".45" strokeWidth="1.200" fill="none">
          <path d="M260 260 120 140M260 260 410 120M260 260 440 330M260 260 150 420M260 260 260 40" />
        </g>
        <g fill="#818cf8">
          <circle className="node" cx="120" cy="140" r="5" />
          <circle className="node" cx="410" cy="120" r="5" />
          <circle className="node" cx="440" cy="330" r="5" />
          <circle className="node" cx="150" cy="420" r="5" />
          <circle className="node" cx="260" cy="40" r="5" />
        </g>
        <path d="M260 180 332 208v62c0 44-30 76-72 92-42-16-72-48-72-92v-62l72-28Z"
              fill="url(#art-fill)" stroke="url(#art-stroke)" strokeWidth="2" />
        <rect x="232" y="256" width="56" height="44" rx="8" fill="#0b1220" stroke="url(#art-stroke)" strokeWidth="2" />
        <path d="M242 256v-12a18 18 0 0 1 36 0v12" fill="none" stroke="url(#art-stroke)" strokeWidth="2" />
        <circle cx="260" cy="278" r="5" fill="#93c5fd" />
      </svg>

      {/* Backend status badge */}
      {backendStatus && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: ".75rem",
          fontWeight: 600,
          background: backendStatus === "connected" ? "rgba(34,197,94,.15)" : "rgba(251,191,36,.15)",
          border: backendStatus === "connected" ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(251,191,36,.3)",
          color: backendStatus === "connected" ? "#86efac" : "#fcd34d",
          zIndex: 10,
        }}>
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: backendStatus === "connected" ? "#22c55e" : "#f59e0b",
          }} />
          {backendStatus === "connected" ? "API Online" : backendStatus === "offline" ? "API Offline" : "Connecting…"}
        </div>
      )}

      <p className="brand__foot">&copy; {year} VaultAuth SSO. All rights reserved.</p>
    </aside>
  );
}
