"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight, Lock, Mail, User, ShieldAlert } from "lucide-react";
import { validateRealEmail } from "@/lib/email-validator";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailCheck = validateRealEmail(email.trim());
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please provide a valid permanent email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9 shadow-card">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Create account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Private, user-controlled tracker for your service complaints
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-semibold"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition min-h-[44px]"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Use your permanent email (disposable/burner domains are blocked).
            </p>
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="register-terms"
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="register-terms" className="text-xs text-slate-600 leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-slate-900 underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-slate-900 underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreeTerms}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

