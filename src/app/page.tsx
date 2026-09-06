"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
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
        // Fallback: register demo user if not existing
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
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Personal Service-Issue & Complaint Follow-up Tracker</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-3xl mx-auto leading-tight">
          Never let a promised fix or refund be{" "}
          <span className="text-indigo-600 underline decoration-indigo-300 decoration-wavy">
            forgotten
          </span>
          .
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          FixFlow converts messy real-world emails, WhatsApp messages, and SMS tickets into
          structured, actionable issues. It surfaces overdue promises before you lose your money or
          warranty.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDemoLogin}
            disabled={loggingInDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            {loggingInDemo ? "Launching Demo..." : "Try Live Demo (1-Click)"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Create Free Account
          </Link>
        </div>

        {/* Value proposition badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Private & Owner Scoped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span>Under 1-Minute Capture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Attention-First Overdue Alerts</span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration: Messy Text -> Structured Issue */}
      <section className="w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              See How Paste-to-Structure Works
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              From unorganized support chat to explicit SLA tracking in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Messy Input */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Messy WhatsApp / SMS Input
                </span>
                <span className="text-[11px] rounded bg-slate-200 px-2 py-0.5 text-slate-700">
                  Raw Text
                </span>
              </div>
              <div className="flex-1 rounded-lg bg-white p-4 font-mono text-xs text-slate-800 border border-slate-200/80 leading-relaxed shadow-inner">
                &ldquo;Service request 548921. Samsung technician said he will visit on Tuesday.
                Refrigerator is still not cooling and food is spoiling. Customer care asked me to
                wait until 12 Sept.&rdquo;
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Buried reference codes, vague dates, and zero automated follow-ups.
              </p>
            </div>

            {/* Right: Extracted Structured Card */}
            <div className="flex flex-col rounded-xl border-2 border-indigo-500/20 bg-indigo-50/20 p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  FixFlow Structured Issue
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  Waiting (Promise Logged)
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-medium text-slate-400">Issue Title</div>
                  <div className="font-semibold text-slate-800">
                    Samsung: Refrigerator not cooling (#548921)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                    <div className="text-[10px] text-slate-400">Reference #</div>
                    <div className="font-mono font-semibold text-slate-800">548921</div>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                    <div className="text-[10px] text-slate-400">Promised Action</div>
                    <div className="font-medium text-slate-800">Technician visit</div>
                  </div>
                </div>

                <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-200 text-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Follow-up SLA: Sep 12</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-rose-200 px-1.5 py-0.5 rounded">
                    Auto-Alert
                  </span>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <div className="text-[10px] text-slate-400">Next Action</div>
                  <div className="text-slate-700 font-medium">
                    Follow up if technician does not visit by scheduled date
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Principles Section */}
      <section className="w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">User-Controlled Data</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We never access your inbox or private messengers automatically. You explicitly paste
              what you want organized.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Attention-First</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Overdue promises and active items are highlighted first. No endless scrolling to find
              what needs immediate escalation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Explainable AI Drafts</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Extraction produces editable drafts. We never invent ticket numbers or lock you out of
              correcting AI suggestions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
