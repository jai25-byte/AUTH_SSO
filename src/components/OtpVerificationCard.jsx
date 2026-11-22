import React, { useState, useRef, useEffect } from "react";
import { ShieldCheck, ArrowLeft, RefreshCw, Smartphone, AlertCircle, Mail, Clock } from "lucide-react";
import { verifyOtp, sendOtp } from "../services/api.js";

export default function OtpVerificationCard({
  user,
  onVerifySuccess,
  onBackToLogin,
  onNotify,
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // Requirement 9: 60-second cooldown on resend OTP
  const [timer, setTimer] = useState(() => user?.cooldown || 60);
  const inputRefs = useRef([]);

  // Auto focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Display destination Gmail address
  const displayEmail = user?.email_masked || user?.email || user?.username || "your registered Gmail";

  const handleChange = (index, value) => {
    // Only accept numeric input
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue && value !== "") return;

    const char = cleanValue.slice(-1); // Take latest typed digit
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setIsError(false);
    setErrorMessage("");

    // Auto advance focus to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous box and clear
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    setIsError(false);
    setErrorMessage("");

    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasteData.length === 6) {
      verifyCode(pasteData);
    }
  };

  // Requirement 10: Real backend OTP verification
  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otp.join("");
    if (code.length < 6) {
      setIsError(true);
      setErrorMessage("Please enter the complete 6-digit verification code.");
      onNotify?.("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setIsVerifying(true);
    setIsError(false);
    setErrorMessage("");

    try {
      const identifier = user?.email || user?.username || user?.identifier;
      const res = await verifyOtp(identifier, code);

      onNotify?.(res.message || "OTP verified successfully! Authenticating session...", "success");

      setTimeout(() => {
        onVerifySuccess?.({
          ...user,
          ...(res.user || {}),
          token: res.token,
        });
      }, 400);
    } catch (err) {
      setIsError(true);
      const msg =
        err.message ||
        (err.status === 401
          ? "Invalid or expired verification code. Please check your Gmail."
          : err.status === 403
          ? "Account is deactivated. Please contact your administrator."
          : "OTP verification failed. Please try again.");
      setErrorMessage(msg);
      onNotify?.(msg, "error");
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Requirement 9: Resend OTP with 60-second cooldown
  const handleResend = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setIsError(false);
    setErrorMessage("");

    try {
      const identifier = user?.email || user?.username || user?.identifier;
      const res = await sendOtp(identifier);

      setTimer(res.cooldown || 60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      onNotify?.(
        res.message || "A new 6-digit verification code has been sent to your Gmail!",
        "info"
      );
    } catch (err) {
      const msg = err.message || "Failed to resend verification code.";
      onNotify?.(msg, "error");
      if (err.data?.retry_after) {
        setTimer(err.data.retry_after);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto p-[32px_36px] text-black glass-card rounded-[24px] animate-fade-in-scale">
      {/* Top Header Badge */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-black/10 border border-white/60 flex items-center justify-center mb-3 shadow-inner">
          <Smartphone className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-[28px] sm:text-[30px] font-semibold text-black tracking-tight leading-tight">
          Gmail Verification
        </h1>
        <p className="text-xs text-black/75 font-medium mt-1.5 max-w-xs leading-relaxed">
          We've sent a 6-digit one-time passcode to
          <br />
          <span className="font-semibold text-black">{displayEmail}</span>
        </p>
      </div>

      {/* Security Info Pill */}
      <div className="mb-5 p-2.5 rounded-xl bg-white/30 border border-white/50 backdrop-blur-md flex items-center justify-between text-xs text-black/85">
        <div className="flex items-center gap-1.5">
          <Mail size={14} className="text-black/70 flex-shrink-0" />
          <span>Real Gmail OTP Delivery</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-black/70 font-medium">
          <Clock size={12} />
          <span>Expires in 5m</span>
        </div>
      </div>

      {/* 6-Digit Segmented Inputs */}
      <div className={`mb-5 ${isError ? "animate-shake" : ""}`}>
        <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl outline-none transition-all duration-200 glass-input ${
                isError
                  ? "border-rose-500 bg-rose-50/30 text-rose-900 shadow-rose-500/20 shadow-md"
                  : digit
                  ? "border-white bg-white/40 shadow-sm"
                  : ""
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {isError && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-rose-800 mt-2.5 text-center">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{errorMessage || "Invalid code. Please check your Gmail or resend."}</span>
          </div>
        )}
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => verifyCode()}
        disabled={isVerifying || otp.join("").length < 6}
        className="w-full h-[46px] btn-primary rounded-[40px] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
      >
        {isVerifying ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>Verifying Code...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Verify OTP</span>
          </>
        )}
      </button>

      {/* Resend Code Section with 60-Second Cooldown */}
      <div className="text-center mt-5 text-xs text-black/80 font-medium">
        {timer > 0 ? (
          <p className="flex items-center justify-center gap-1.5">
            <span>Resend code in</span>
            <span className="font-mono font-bold text-black">
              0:{timer < 10 ? `0${timer}` : timer}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 font-semibold text-black hover:underline cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <>
                <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                <span>Sending new code...</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} className="text-black" />
                <span>Didn't receive code? Resend OTP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Return to Login */}
      <div className="mt-5 pt-4 border-t border-white/20 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/80 hover:text-black hover:underline cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Login</span>
        </button>
      </div>
    </div>
  );
}

