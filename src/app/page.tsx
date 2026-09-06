"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [loggingInDemo, setLoggingInDemo] = useState(false);

  const handleDemoLogin = async () => {
    setLoggingInDemo(true);
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
            name: "Alex Demo",
          }),
        });
        router.push("/dashboard");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoggingInDemo(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-50 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-400/20 via-violet-400/20 to-pink-400/10 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 text-center">
        {/* Top Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-subtle mb-6 hover:border-indigo-300 transition">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span>Private & Intelligent Issue Tracker</span>
          <span className="h-1 w-1 rounded-full bg-indigo-300" />
          <span className="text-slate-500 font-normal">No Inbox Access Needed</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.12] max-w-3xl mx-auto">
          Never lose track of a promised{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
            fix, refund, or warranty
          </span>
          .
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          FixFlow converts messy WhatsApp messages, emails, and SMS tickets into structured,
          actionable issues. It surfaces overdue promises before your claim or warranty expires.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={handleDemoLogin}
            disabled={loggingInDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-elevated hover:bg-slate-800 transition active:scale-[0.98]"
          >
            {loggingInDemo ? (
              <span>Starting Session...</span>
            ) : (
              <>
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </>
            )}
          </button>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-card hover:bg-white hover:border-slate-300 transition"
          >
            Create Free Account
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Owner-Scoped & Private</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Under 1-Minute Capture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Attention-First Overdue Alerts</span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Card: Messy Chat -> Structured Card */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-10 shadow-floating backdrop-blur-sm">
          <div className="text-center max-w-md mx-auto mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              From Scattered Chat to Strict SLA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Extract ticket numbers, promised dates, and next actions with one click
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Raw Messy Message */}
            <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Unstructured Customer Chat
                </span>
                <span className="text-[10px] rounded-md bg-slate-200/80 px-2 py-0.5 font-semibold text-slate-700">
                  Raw Input
                </span>
              </div>
              <div className="flex-1 rounded-xl bg-white p-4 font-mono text-xs text-slate-700 border border-slate-200/70 leading-relaxed shadow-subtle flex items-center">
                &ldquo;Service request 548921. Samsung technician said he will visit on Tuesday.
                Refrigerator is still not cooling. Customer care asked me to wait until 12
                Sept.&rdquo;
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Reference numbers and deadlines buried in message history</span>
              </div>
            </div>

            {/* Right: Structured FixFlow Record */}
            <div className="flex flex-col rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-white p-5 shadow-card relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  FixFlow Structured Issue
                </span>
                <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  Waiting (Promise Logged)
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-subtle">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Complaint Title
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    Samsung: Refrigerator not cooling (#548921)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-subtle">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Docket #</div>
                    <div className="font-mono font-bold text-indigo-700 mt-0.5">548921</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-subtle">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Promised Action</div>
                    <div className="font-semibold text-slate-800 mt-0.5">Technician visit</div>
                  </div>
                </div>

                <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-3 text-rose-900 flex items-center justify-between shadow-subtle">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4 text-rose-600" />
                    <span>Resolution Target: Sep 12</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md">
                    Auto-Alert
                  </span>
                </div>

                <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-amber-900 shadow-subtle">
                  <div className="text-[10px] font-bold uppercase text-amber-700">Next Action</div>
                  <div className="text-xs font-semibold mt-0.5">
                    Follow up if technician does not visit by scheduled date
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-elevated transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">User-Controlled Data</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Zero automatic inbox reading or email scraping. You explicitly paste or enter only
              what you want organized.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-elevated transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Attention-First</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Overdue issues and SLA breaches are prioritized at the top with clear days-elapsed
              alerts.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-elevated transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Assistive AI Drafts</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              AI extraction produces fully editable drafts with confidence scores. It never invents
              numbers or locks you out.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
