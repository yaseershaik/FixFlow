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
  Bell,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, overdueCount, logout } = useAuth();

  const PUBLIC_PATHS = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/help",
    "/consumer-rights",
  ];
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition group-hover:bg-slate-800">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
                FixFlow
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-400 font-medium tracking-wide">
                Complaint Tracker
              </span>
            </div>
          </Link>

          {/* If on Public/Landing Pages */}
          {isPublicPage ? (
            <div className="flex items-center gap-2">
              {user && user.email !== "demo@fixflow.app" ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 min-h-[40px]"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 min-h-[40px] flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                  {user?.email === "demo@fixflow.app" && (
                    <button
                      onClick={handleLogout}
                      title="Exit Demo Sandbox"
                      className="rounded-xl text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 border border-amber-200 transition min-h-[40px]"
                    >
                      Exit Demo
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Inside Authenticated App Workspace */
            user && (
              <nav className="flex items-center gap-1 sm:gap-1.5">
                {/* Desktop Tabs */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    href="/dashboard"
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname === "/dashboard"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Issues
                  </Link>
                  <Link
                    href="/issues/new"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname === "/issues/new"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Issue</span>
                  </Link>
                  <Link
                    href="/search"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname === "/search"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search</span>
                  </Link>
                  <Link
                    href="/settings"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      pathname === "/settings"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Overdue Alert Bell Button */}
                <Link
                  href="/dashboard"
                  title={overdueCount > 0 ? `${overdueCount} overdue issue(s)` : "No overdue issues"}
                  className={`relative rounded-xl p-2 transition ${
                    overdueCount > 0
                      ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                      {overdueCount}
                    </span>
                  )}
                </Link>

                {/* User Chip & Logout */}
                <div className="ml-1 sm:ml-2 flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3.5">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-2 sm:px-2.5 py-1.5 border border-slate-200/50">
                    <div className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-xs font-medium text-slate-700 max-w-[120px] truncate">
                      {user.name || user.email.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out of your FixFlow account"
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </nav>
            )
          )}
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Bar (ONLY in Authenticated App Pages, NEVER on Landing/Public pages) */}
      {user && !isPublicPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:hidden shadow-elevated">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl py-1 px-2 text-[11px] font-medium transition ${
              pathname === "/dashboard"
                ? "text-slate-900 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Inbox className="h-5 w-5" />
            <span className="mt-0.5">Issues</span>
          </Link>

          <Link
            href="/issues/new"
            aria-label="Create New Issue"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/20 active:scale-90 transition-transform"
          >
            <Plus className="h-5 w-5" />
          </Link>

          <Link
            href="/search"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl py-1 px-2 text-[11px] font-medium transition ${
              pathname === "/search"
                ? "text-slate-900 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="mt-0.5">Search</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl py-1 px-2 text-[11px] font-medium transition ${
              pathname === "/settings"
                ? "text-slate-900 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="mt-0.5">Settings</span>
          </Link>
        </nav>
      )}
    </>
  );
}
