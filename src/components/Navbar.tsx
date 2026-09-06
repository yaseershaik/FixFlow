"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  PlusCircle,
  Search,
  Settings,
  ShieldAlert,
  LogOut,
  Layers,
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

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/";

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Fix<span className="text-indigo-600">Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {user ? (
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/dashboard"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Layers className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/issues/new"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/issues/new"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="h-4 w-4 text-indigo-600" />
                New Issue
              </Link>
              <Link
                href="/search"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/search"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Search className="h-4 w-4" />
                Search
              </Link>
              <Link
                href="/settings"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/settings"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              <div className="ml-3 flex items-center gap-3 border-l border-slate-200 pl-3">
                <span className="text-xs font-medium text-slate-500 max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation (320px+ viewport) */}
      {user && !isAuthPage && (
        <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white px-2 py-1 md:hidden">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium ${
              pathname === "/dashboard" ? "text-indigo-600 font-semibold" : "text-slate-500"
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Issues</span>
          </Link>
          <Link
            href="/issues/new"
            className="flex flex-col items-center justify-center rounded-full -mt-5 bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-300"
          >
            <PlusCircle className="h-6 w-6" />
          </Link>
          <Link
            href="/search"
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium ${
              pathname === "/search" ? "text-indigo-600 font-semibold" : "text-slate-500"
            }`}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </Link>
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center p-2 text-xs font-medium ${
              pathname === "/settings" ? "text-indigo-600 font-semibold" : "text-slate-500"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      )}
    </>
  );
}
