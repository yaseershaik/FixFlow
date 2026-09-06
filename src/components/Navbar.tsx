"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Plus,
  Search,
  Settings,
  LogOut,
  CheckCircle2,
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
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              FixFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user ? (
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname === "/dashboard"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Issues
              </Link>
              <Link
                href="/issues/new"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname === "/issues/new"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + New Issue
              </Link>
              <Link
                href="/search"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname === "/search"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Search
              </Link>
              <Link
                href="/settings"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname === "/settings"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Settings
              </Link>

              <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
                <span className="text-xs text-slate-500 max-w-[120px] truncate">
                  {user.name || user.email.split("@")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Bar (Shown on small screens when logged in) */}
      {user && !isAuthPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 sm:hidden">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition ${
              pathname === "/dashboard" ? "text-slate-900 font-bold" : "text-slate-400"
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span className="mt-0.5">Issues</span>
          </Link>
          <Link
            href="/issues/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm active:scale-95 transition"
          >
            <Plus className="h-5 w-5" />
          </Link>
          <Link
            href="/search"
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition ${
              pathname === "/search" ? "text-slate-900 font-bold" : "text-slate-400"
            }`}
          >
            <Search className="h-4 w-4" />
            <span className="mt-0.5">Search</span>
          </Link>
          <Link
            href="/settings"
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition ${
              pathname === "/settings" ? "text-slate-900 font-bold" : "text-slate-400"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="mt-0.5">Settings</span>
          </Link>
        </nav>
      )}
    </>
  );
}
