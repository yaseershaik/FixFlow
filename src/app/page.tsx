"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Smartphone,
  Calendar,
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@fixflow.app", password: "demo123" }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "demo@fixflow.app",
            password: "demo123",
            name: "Alex",
          }),
        });
        router.push("/dashboard");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Never forget a refund, repair, or service ticket.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          Keep reference numbers, promised callback dates, and customer care notes organized in one clean place.
        </p>

        {/* Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={handleDemoLogin}
            disabled={loadingDemo}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            {loadingDemo ? "Opening Demo..." : "Try Demo"}
          </button>
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Realistic Phone Card Preview */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
              Samsung Care
            </span>
            <span className="font-mono text-xs text-slate-500">
              #SR-948201
            </span>
          </div>
          <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold">
            Overdue by 2 days
          </span>
        </div>

        <div className="mt-3">
          <h3 className="font-bold text-base text-slate-900">
            Double Door Refrigerator not cooling
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Technician was supposed to visit on Tuesday. No call received.
          </p>
        </div>

        <div className="mt-3 rounded-lg bg-amber-50/80 border border-amber-200/70 p-3 text-xs text-amber-900">
          <span className="font-bold">Next step: </span>
          Call Samsung support at 1800-40-7267864 to re-schedule technician.
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Promised: Sep 12</span>
          <span>Updated yesterday</span>
        </div>
      </div>

      {/* Clean 3 Points */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-3">
            <Smartphone className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Reference numbers ready</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Find your docket or ticket code in two seconds when an agent asks for it.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-3">
            <Calendar className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Track promised dates</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            See exactly which company promised what, and easily spot overdue repairs or refunds.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-3">
            <Shield className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Private & Simple</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            No access to your inbox or private messengers. Paste only what you choose to track.
          </p>
        </div>
      </div>
    </div>
  );
}
