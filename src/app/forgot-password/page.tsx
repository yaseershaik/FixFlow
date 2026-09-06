"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2, Lock, Mail, ArrowRight } from "lucide-react";
import { validateRealEmail } from "@/lib/email-validator";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    const emailCheck = validateRealEmail(email.trim());
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid permanent email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message || "Failed to request recovery code.");
        setLoading(false);
        return;
      }

      if (data?.data?.resetCode && data.data.resetCode !== "000000") {
        setIssuedCode(data.data.resetCode);
        setCode(data.data.resetCode);
      }
      setStatusMessage(data?.data?.message || "Recovery code issued. Please check your email.");
      setStep("reset");
    } catch {
      setError("Network connection issue. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-type your new password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Network connection issue. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xs space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {step === "success" ? "Password Reset Complete" : "Reset Your Password"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {step === "request" && "Enter your account email to receive a 6-digit recovery code."}
              {step === "reset" && "Enter the verification code and set your new account password."}
              {step === "success" && "Your password has been updated securely. You can now log in."}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Must be your permanent registered address (temporary/disposable domains not supported).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs"
              >
                {loading ? "Issuing Code..." : "Send Verification Code"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {issuedCode && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-1 text-center">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    Verification Code Issued
                  </span>
                  <div className="text-2xl font-black font-mono tracking-widest text-emerald-950">
                    {issuedCode}
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Valid for 15 minutes. (Auto-filled below for your convenience)
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="reset-code" className="block text-xs font-semibold text-slate-700">
                  6-Digit Verification Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  disabled={loading}
                  className="w-full font-mono text-center tracking-widest text-base font-bold rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-700">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="reset-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="reset-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6 || newPassword.length < 8}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs"
              >
                {loading ? "Updating Password..." : "Update Password & Sign In"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-600">
                Your password was reset successfully. You can now use your new password to access your FixFlow complaints dashboard.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-xs"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
