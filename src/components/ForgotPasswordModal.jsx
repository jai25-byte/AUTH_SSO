import React, { useState } from "react";
import { Mail, KeyRound, X, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordModal({ isOpen, onClose, onNotify }) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      onNotify?.(`Reset link sent to ${email}`, "success");
    }, 800);
  };

  const handleReset = () => {
    setEmail("");
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-scale">
      <div className="relative w-full max-w-md p-7 rounded-3xl glass-card text-slate-900 border border-white/60 shadow-2xl">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-1.5 text-slate-600 hover:text-black rounded-full hover:bg-white/30 transition-colors"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/10 text-black mb-3 border border-white/50">
            <KeyRound size={26} />
          </div>
          <h2 className="text-2xl font-bold text-[#001a35]">Forgot Password?</h2>
          <p className="text-xs text-slate-700 mt-1 max-w-xs mx-auto">
            No worries! Enter your registered email address and we'll send you secure recovery instructions.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="flex justify-center text-emerald-600">
              <CheckCircle2 size={44} />
            </div>
            <p className="text-sm font-medium text-slate-800">
              Check your inbox! We've sent a recovery link to:
              <br />
              <strong className="text-black font-semibold">{email}</strong>
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 btn-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative w-full h-12">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-full glass-input rounded-full px-5 pr-12 text-sm font-medium outline-none"
              />
              <Mail
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 btn-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full text-center text-xs font-semibold text-slate-800 hover:underline pt-1 cursor-pointer"
            >
              Cancel and back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
