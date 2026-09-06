import Link from "next/link";
import { ShieldCheck, Sparkles, Lock, ArrowRight, HeartHandshake, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "About FixFlow | Privacy-First Consumer Grievance Platform",
  description:
    "Learn about FixFlow's mission to empower Indian consumers with deadline-tracked dispute management, zero data selling, and statutory guidance.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Consumer Empowerment First</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Leveling the playing field for everyday consumers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          FixFlow was engineered to solve a widespread problem: companies make promises on the phone or in chat, but delay resolution indefinitely while customers lose track of dates, tickets, and proofs.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">100% Free Forever</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            FixFlow is completely free for all consumers. You will never encounter subscriptions, paywalls, or hidden charges, and your private data is never sold.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Private & Confidential</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Every user dispute dossier, upload, and timeline note is cryptographically isolated. Your consumer issues are never monetized or indexed publicly.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Statutory Alignment</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Export formats and escalation roadmaps match the requirements of India's Consumer Protection Act 2019, the National Consumer Helpline, and e-Daakhil.
          </p>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Why We Built FixFlow</h2>
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            When a refrigerator fails, internet drops during work-from-home, or an e-commerce platform refuses a refund for an unreceived package, customer support lines frequently offer vague promises: <em>"Technician will visit in 24 to 48 hours"</em>.
          </p>
          <p>
            When the deadline passes, customers often have to repeat the entire story to a new agent from scratch. FixFlow changes this dynamic:
          </p>
          <ul className="space-y-2 pt-2">
            {[
              "Automatically extracts complaint IDs, promise dates, and company names from raw WhatsApp or SMS messages.",
              "Tracks promised resolution dates with automatic overdue alerts and deadline timers.",
              "Generates 1-click WhatsApp follow-ups and grievance officer emails pre-populated with case history.",
              "Exports court-ready chronological CSV and JSON dossiers for e-Daakhil filing.",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to take control of your customer service complaints?</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Start tracking your service disputes with zero setup. Free forever for consumers.
        </p>
        <div className="pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-100 transition shadow-sm"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
