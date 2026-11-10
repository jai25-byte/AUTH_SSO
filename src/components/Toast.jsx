import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  };

  const borderColors = {
    success: "border-emerald-300 bg-white/90 shadow-emerald-500/10",
    error: "border-rose-300 bg-white/90 shadow-rose-500/10",
    info: "border-blue-300 bg-white/90 shadow-blue-500/10",
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-scale">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-xl max-w-md ${borderColors[type] || borderColors.info}`}
      >
        {icons[type] || icons.info}
        <span className="text-sm font-medium text-slate-800 leading-snug">{message}</span>
        <button
          onClick={onClose}
          type="button"
          className="ml-2 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
