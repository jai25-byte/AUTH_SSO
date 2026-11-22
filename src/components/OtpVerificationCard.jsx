import React, { useState, useRef, useEffect } from "react";
import { verifyOtp, sendOtp } from "../services/api.js";

export default function OtpVerificationCard({ user, onVerifySuccess, onBackToLogin, onNotify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(() => user?.cooldown || 60);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const displayEmail = user?.email_masked || user?.email || user?.username || "your registered email";

  const handleChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue && value !== "") return;
    const char = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setIsError(false);
    setErrorMessage("");
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
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
    for (let i = 0; i < pasteData.length; i++) newOtp[i] = pasteData[i];
    setOtp(newOtp);
    setIsError(false);
    setErrorMessage("");
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
    if (pasteData.length === 6) verifyCode(pasteData);
  };

  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otp.join("");
    if (code.length < 6) {
      setIsError(true);
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }
    setIsVerifying(true);
    setIsError(false);
    setErrorMessage("");
    try {
      const identifier = user?.email || user?.username || user?.identifier;
      const res = await verifyOtp(identifier, code);
      onNotify?.(res.message || "OTP verified successfully!", "success");
      setTimeout(() => {
        onVerifySuccess?.({ ...user, ...(res.user || {}), token: res.token });
      }, 400);
    } catch (err) {
      setIsError(true);
      const msg = err.message || "Invalid or expired verification code.";
      setErrorMessage(msg);
      onNotify?.(msg, "error");
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

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
      onNotify?.(res.message || "A new code has been sent!", "info");
    } catch (err) {
      onNotify?.(err.message || "Failed to resend code.", "error");
      if (err.data?.retry_after) setTimer(err.data.retry_after);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <header className="card__head">
        <h2>Enter verification code</h2>
        <p>We've sent a 6-digit code to <strong>{displayEmail}</strong></p>
      </header>

      <div>
        <div className={`otp-inputs ${isError ? "animate-shake" : ""}`} onPaste={handlePaste}>
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
              className={`otp-box ${isError ? "has-error" : ""}`}
              style={digit ? { borderColor: "var(--blue-500)", background: "#f0f7ff" } : {}}
            />
          ))}
        </div>

        {isError && (
          <p style={{ fontSize: ".82rem", color: "var(--danger)", marginTop: "-12px", marginBottom: "16px", textAlign: "center" }}>
            {errorMessage || "Invalid code. Check your email or resend."}
          </p>
        )}

        <button
          type="button"
          className={`btn ${isVerifying ? "is-loading" : ""}`}
          disabled={isVerifying || otp.join("").length < 6}
          onClick={() => verifyCode()}
        >
          <span className="btn__label">{isVerifying ? "Verifying…" : "Verify code"}</span>
          <span className="btn__spinner" aria-hidden="true"></span>
        </button>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: ".88rem", color: "var(--ink-500)" }}>
          {timer > 0 ? (
            <span>Resend code in <strong style={{ fontFamily: "monospace", color: "var(--ink-900)" }}>0:{timer < 10 ? `0${timer}` : timer}</strong></span>
          ) : (
            <button type="button" className="link" onClick={handleResend} disabled={isResending} style={{ fontSize: ".88rem" }}>
              {isResending ? "Sending…" : "Didn't receive code? Resend"}
            </button>
          )}
        </div>

        <p className="switch" style={{ borderTop: "1px solid var(--ink-200)", paddingTop: "18px", marginTop: "20px" }}>
          <button type="button" className="link" onClick={onBackToLogin}>
            ← Back to sign in
          </button>
        </p>
      </div>
    </>
  );
}
