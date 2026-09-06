"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers,
  PlusCircle,
  Search,
  Settings,
  ShieldAlert,
  LogOut,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={user ? "/dashboard" : "/"} className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                Fix<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Flow</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                Service SLA Tracker
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user ? (
            <nav className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  pathname === "/dashboard"
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Layers className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/issues/new"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  pathname === "/issues/new"
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="h-4 w-4 text-indigo-600" />
                Capture Issue
              </Link>
              <Link
                href="/search"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  pathname === "/search"
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Search className="h-4 w-4" />
                Search
              </Link>
              <Link
                href="/settings"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  pathname === "/settings"
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              <div className="ml-3 flex items-center gap-3 border-l border-slate-200/80 pl-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-bold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 max-w-[130px] truncate">
                    {user.name || user.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Floating Bottom Bar (iOS Native App Aesthetic) */}
      {user && !isAuthPage && (
        <div className="fixed bottom-3 left-4 right-4 z-50 md:hidden">
          <nav className="mx-auto flex h-14 max-w-md items-center justify-around rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-1 shadow-floating backdrop-blur-lg">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center px-3 py-1 text-[11px] font-semibold transition ${
                pathname === "/dashboard" ? "text-indigo-600 scale-105" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span className="mt-0.5">Issues</span>
            </Link>
            <Link
              href="/issues/new"
              className="flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-2.5 text-white shadow-md shadow-indigo-500/30 hover:scale-105 transition active:scale-95"
            >
              <PlusCircle className="h-5 w-5" />
            </Link>
            <Link
              href="/search"
              className={`flex flex-col items-center justify-center px-3 py-1 text-[11px] font-semibold transition ${
                pathname === "/search" ? "text-indigo-600 scale-105" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              <span className="mt-0.5">Search</span>
            </Link>
            <Link
              href="/settings"
              className={`flex flex-col items-center justify-center px-3 py-1 text-[11px] font-semibold transition ${
                pathname === "/settings" ? "text-indigo-600 scale-105" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="mt-0.5">Settings</span>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
