import React, { useState } from "react";
import { ShieldCheck, LogOut, ExternalLink, CheckCircle2, Lock, User, Clock, Key } from "lucide-react";

export default function AuthenticatedCard({ user, onSignOut, onNotify }) {
  const sessionToken = user?.token || "SSO-SEC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const [loginTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const username = user?.username || "Authenticated User";
  const email = user?.email;
  const initial = username.charAt(0).toUpperCase();

  const handleLaunchApp = () => {
    onNotify?.("Redirecting to your SSO connected enterprise dashboard...", "info");
  };

  return (
    <div className="w-full max-w-[440px] mx-auto p-[34px_36px] text-black glass-card rounded-[24px] animate-fade-in-scale">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-9 h-9 text-emerald-800" />
          </div>
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        </div>

        <h1 className="text-[26px] sm:text-[28px] font-bold text-black tracking-tight">
          Authenticated!
        </h1>
        <p className="text-xs text-black/75 font-medium mt-1">
          Identity verified with 2-Factor Authentication (OTP)
        </p>
      </div>

      {/* User Info Box */}
      <div className="mb-5 p-3.5 rounded-2xl bg-white/35 border border-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-black text-white font-bold text-lg flex items-center justify-center shadow-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">{username}</h3>
            {email && email !== username && (
              <p className="text-xs text-black/80 truncate font-medium">{email}</p>
            )}
            <p className="text-xs text-black/70 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Active SSO Session
            </p>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-2 mb-6 text-xs text-black/85">
        <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/5">
          <span className="flex items-center gap-1.5 text-black/70">
            <Key size={13} /> Session Token
          </span>
          <span className="font-mono font-semibold text-black">{sessionToken}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/5">
          <span className="flex items-center gap-1.5 text-black/70">
            <Clock size={13} /> Verified At
          </span>
          <span className="font-semibold text-black">{loginTime}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/5">
          <span className="flex items-center gap-1.5 text-black/70">
            <Lock size={13} /> Encryption
          </span>
          <span className="font-semibold text-emerald-800">256-bit SSL / SAML 2.0</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleLaunchApp}
          className="w-full h-[46px] btn-primary rounded-[40px] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <span>Continue to Dashboard</span>
          <ExternalLink size={16} />
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full h-[44px] rounded-[40px] bg-white/30 hover:bg-white/50 border border-white/60 text-black text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

