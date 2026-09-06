"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const isSafeRedirect =
    Boolean(rawRedirect) &&
    rawRedirect!.startsWith("/") &&
    !rawRedirect!.startsWith("//") &&
    !rawRedirect!.startsWith("/\\") &&
    !rawRedirect!.includes(":");
  const redirectTarget = isSafeRedirect ? rawRedirect! : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push(redirectTarget);
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
            Welcome back
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Sign in to track, escalate, and resolve your service complaints
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
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-email"
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="remember-me" className="text-xs font-medium text-slate-600">
              Keep me signed in for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Sign In</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-slate-900 hover:underline">
            Create free account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}

