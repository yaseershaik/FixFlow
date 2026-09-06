"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  ShieldAlert,
  Smartphone,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  Send,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ShoppingBag,
  Wrench,
  Wifi,
  CreditCard,
  Truck,
  Scale,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useState, Suspense } from "react";

const DEMO_CASES = [
  {
    id: "appliance",
    tabLabel: "Appliance Repair",
    company: "Samsung Support",
    referenceNo: "SR-948201",
    title: "Double Door Refrigerator not cooling",
    description:
      "Technician visited on Tuesday and promised compressor replacement. No update received since then.",
    expectedDate: "Sep 12",
    isOverdue: true,
    overdueDays: 2,
    nextAction: "Call service center at 1800-40-7267864 with ticket #SR-948201 to reschedule technician.",
    amount: null,
  },
  {
    id: "refund",
    tabLabel: "Refund Delay",
    company: "Flipkart Support",
    referenceNo: "OD40918230",
    title: "Return pickup completed, refund of ₹2,499 delayed",
    description:
      "Shoes returned on Monday. Customer care promised refund within 3 business days. Bank account still not credited.",
    expectedDate: "Sep 14",
    isOverdue: true,
    overdueDays: 3,
    nextAction: "Send WhatsApp message with order #OD40918230 requesting NEFT / UTR reference number.",
    amount: "₹2,499",
  },
  {
    id: "telecom",
    tabLabel: "Broadband Outage",
    company: "Airtel Fiber",
    referenceNo: "TT-948210",
    title: "Broadband red light blinking, no internet signal",
    description:
      "Road construction damaged fiber line. Complaint registered with customer care. Restoration promised by 6 PM.",
    expectedDate: "Today by 6 PM",
    isOverdue: false,
    overdueDays: 0,
    nextAction: "Wait for engineer visit. If not restored by 6 PM, escalate to Nodal Grievance Desk.",
    amount: null,
  },
];

const FAQS = [
  {
    q: "Is FixFlow completely free to use?",
    a: "Yes. FixFlow is 100% free to use with no paid subscriptions, no paywalls, and no hidden fees.",
  },
  {
    q: "Should I review automated letters and details before sending?",
    a: "Yes, always! Automated tools and templates can occasionally make errors or miss specific nuances. Please review all company names, ticket numbers, dates, and amounts carefully before emailing service providers or lodging complaints.",
  },
  {
    q: "Does FixFlow connect to or read my personal WhatsApp or emails?",
    a: "No. FixFlow operates on a privacy-first model. We never connect to your inbox or private chats. You paste only the specific messages or enter the reference numbers you choose to track.",
  },
  {
    q: "How do the deadline alert reminders work?",
    a: "When you log a complaint, FixFlow remembers the promised resolution date. If that date passes without resolution, your device triggers an alert notification and highlights the issue in red on your dashboard.",
  },
  {
    q: "Can I use FixFlow records to file in Consumer Court or the National Consumer Helpline?",
    a: "Yes! FixFlow generates pre-formatted escalation letters and lets you export a complete chronological contact log with reference numbers and proof receipts in CSV or JSON for official filing.",
  },
];

const CATEGORIES_SOLVED = [
  {
    icon: Wrench,
    title: "Appliances & Repairs",
    examples: "AC cooling, fridge compressors, TV displays, washing machine repairs",
  },
  {
    icon: ShoppingBag,
    title: "Online Orders & Returns",
    examples: "Delayed refunds, wrong items delivered, return pickup cancellations",
  },
  {
    icon: Wifi,
    title: "Broadband & Mobile",
    examples: "Fiber cuts, frequent disconnection, unexpected recharge deductions",
  },
  {
    icon: CreditCard,
    title: "Banking & Payments",
    examples: "Failed POS debits, double billing, unauthorized card charges",
  },
  {
    icon: Truck,
    title: "Courier & Delivery",
    examples: "Packages stuck at sorting hub, false 'customer unavailable' status",
  },
  {
    icon: Scale,
    title: "Consumer Rights (NCH)",
    examples: "Formal escalation to Grievance Officers and National Consumer Helpline 1915",
  },
];

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("unauthorized") === "1";

  const [loadingDemo, setLoadingDemo] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(0);
  const [copiedRef, setCopiedRef] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activeCase = DEMO_CASES[selectedDemo];

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleCopyDemoRef = () => {
    navigator.clipboard.writeText(activeCase.referenceNo);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Unauthorized Security Notice Banner */}
        {isUnauthorized && (
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-3xl bg-amber-50 border border-amber-300 p-5 text-xs sm:text-sm text-amber-900 shadow-md flex items-start gap-3.5 text-left animate-in fade-in slide-in-from-top-4"
          >
            <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-bold text-amber-950 text-sm">Access Restricted</div>
              <p className="text-amber-800 leading-relaxed text-xs">
                You were redirected to the home page because accessing FixFlow application pages requires an active, verified consumer account. Please create an account or sign in to proceed.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/70 px-4 py-1.5 text-xs font-semibold text-indigo-800 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Independent Consumer Complaint Organizer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
          Never let a company’s promised deadline slip away.
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Keep reference numbers, promised resolution dates, and customer care notes neatly organized. Get notified when deadlines pass and escalate in one click.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-md shadow-slate-900/10 min-h-[48px]"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition min-h-[48px] shadow-xs"
          >
            Sign In to Tracker
          </Link>
        </div>

        {/* 1-Click Demo Option */}
        <div className="pt-1">
          <button
            onClick={handleDemoLogin}
            disabled={loadingDemo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>{loadingDemo ? "Launching Demo Account..." : "Or test with pre-loaded demo account (1-Click)"}</span>
          </button>
        </div>

        {/* Quick Trust Badges */}
        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>100% Free to Use</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span>Privacy Protected (No Chat Access)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-amber-600" />
            <span>Device Deadline Reminders</span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Complaint Playground */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Live Preview
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            How FixFlow transforms messy customer care promises
          </h2>
        </div>

        {/* Interactive Tab Selector */}
        <div className="flex rounded-2xl bg-slate-100 p-1.5 max-w-md mx-auto mb-6 text-[11px] sm:text-xs font-semibold">
          {DEMO_CASES.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setSelectedDemo(idx)}
              className={`flex-1 rounded-xl py-2 px-1.5 transition text-center min-h-[38px] flex items-center justify-center ${
                selectedDemo === idx
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {c.tabLabel}
            </button>
          ))}
        </div>

        {/* Dynamic Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-floating transition-all">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                {activeCase.company}
              </span>

              <button
                onClick={handleCopyDemoRef}
                title="Click to copy ticket ID"
                aria-label={`Copy ticket reference number ${activeCase.referenceNo}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition"
              >
                <span>#{activeCase.referenceNo}</span>
                {copiedRef ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            </div>

            {activeCase.isOverdue ? (
              <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Overdue by {activeCase.overdueDays} days</span>
              </span>
            ) : (
              <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                <span>Due Today</span>
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="mt-4">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {activeCase.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {activeCase.description}
            </p>
          </div>

          {/* Next Action Callout */}
          <div className="mt-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs sm:text-sm text-amber-950">
            <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-0.5">
              What to do next:
            </div>
            <span>{activeCase.nextAction}</span>
          </div>

          {/* Quick Real Action Bar Preview */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 font-semibold">
                <Send className="h-3 w-3" />
                <span>WhatsApp Follow-up</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 font-semibold">
                <Mail className="h-3 w-3" />
                <span>Escalation Letter</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Promised: <strong>{activeCase.expectedDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Safety First Callout */}
        <div className="mt-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Safety First: Automated drafts and suggestions are provided as helpful aids. Please review all details before sending.</span>
        </div>
      </section>

      {/* 3. How It Works (3 Simple Steps) */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Simple Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How FixFlow protects you in 3 simple steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            No complex setup. Start tracking any service complaint in under 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Paste or Enter Details
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Paste messy WhatsApp chats, SMS confirmation codes, or customer service emails. FixFlow automatically detects the reference ID and promised date.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Track Promised Deadlines
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Never forget who promised what. FixFlow monitors your calendar and alerts you the moment customer support fails to deliver on time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1-Click Escalation
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Send ready-to-use WhatsApp messages, email formal escalation letters to Grievance Redressal Officers, or file directly with National Consumer Helpline 1915.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Common Service Headaches Solved */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Universal Utility
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Works across all everyday consumer services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CATEGORIES_SOLVED.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {cat.examples}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. 3-Tier Consumer Escalation Guidance */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-900 bg-slate-900 text-white p-6 sm:p-10 shadow-floating">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Consumer Protection Act (2019)
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                How to get complaints resolved faster
              </h3>
            </div>
            <div className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs text-slate-300">
              National Helpline: <strong className="text-white font-mono">1915</strong>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div>
              <div className="text-indigo-400 font-bold mb-1 text-xs">LEVEL 1: Executive</div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Log reference number and get a committed resolution date in writing or SMS.
              </p>
            </div>
            <div>
              <div className="text-indigo-400 font-bold mb-1 text-xs">LEVEL 2: Grievance Officer</div>
              <p className="text-slate-300 leading-relaxed text-xs">
                If overdue, send FixFlow’s 1-click Escalation Letter detailing prior failed commitments.
              </p>
            </div>
            <div>
              <div className="text-indigo-400 font-bold mb-1 text-xs">LEVEL 3: Consumer Court</div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Export your chronological FixFlow dossier and lodge official claim on e-Daakhil / NCH.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Take control of your service complaints today.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Free forever. No credit card required. Keep companies accountable with clean records.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-md shadow-slate-900/10 min-h-[48px]"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition min-h-[48px]"
            >
              Sign In to Tracker
            </Link>
          </div>

          <div className="pt-1">
            <button
              onClick={handleDemoLogin}
              disabled={loadingDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>{loadingDemo ? "Launching Demo Account..." : "Or test with pre-loaded demo account (1-Click)"}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400">Loading FixFlow...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
