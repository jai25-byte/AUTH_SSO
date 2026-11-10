import React from "react";
import { LogIn, UserPlus } from "lucide-react";

export default function TabSwitch({ activeTab, onTabChange }) {
  return (
    <div className="relative flex p-1.5 mb-6 bg-white/20 backdrop-blur-md border border-white/40 rounded-full shadow-inner max-w-xs mx-auto">
      {/* Sliding pill indicator */}
      <div
        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-black/90 rounded-full shadow-md transition-all duration-300 ease-out ${
          activeTab === "login" ? "left-1.5" : "left-[calc(50%+3px)]"
        }`}
      />

      {/* Login Tab Button */}
      <button
        type="button"
        onClick={() => onTabChange("login")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
          activeTab === "login" ? "text-white" : "text-black/80 hover:text-black"
        }`}
      >
        <LogIn size={16} />
        <span>Login</span>
      </button>

      {/* Register Tab Button */}
      <button
        type="button"
        onClick={() => onTabChange("register")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
          activeTab === "register" ? "text-white" : "text-black/80 hover:text-black"
        }`}
      >
        <UserPlus size={16} />
        <span>Register</span>
      </button>
    </div>
  );
}
