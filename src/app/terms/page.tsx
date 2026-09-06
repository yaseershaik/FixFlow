import Link from "next/link";
import { ArrowLeft, Scale, AlertCircle, FileCheck, PhoneCall } from "lucide-react";

export const metadata = {
  title: "Terms of Service & Consumer Guidance — FixFlow",
  description: "FixFlow Terms of Service and official consumer helpline resources.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
          <Scale className="h-3.5 w-3.5 text-indigo-600" />
          <span>Fair & Transparent Usage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Terms of Service & Consumer Guidance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last updated: September 2026 • Simple rules for using FixFlow.
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-600" />
            <span>1. What FixFlow Is (And Isn't)</span>
          </h2>
          <p>
            FixFlow is an independent personal productivity tool created to help citizens organize, track, and document consumer grievances. FixFlow:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Helps you record promised resolution dates, order numbers, and follow-up notes.</li>
            <li>Helps you prepare formal escalation letters and WhatsApp messages based on your logged history.</li>
            <li>Is <strong>not</strong> an official court, government agency, or judicial authority. We cannot legally compel companies to pay or respond, but we help you hold them accountable with clean written records.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-600" />
            <span>2. Official Consumer Helplines (India)</span>
          </h2>
          <p>
            If a company fails to resolve your issue despite repeated follow-ups, you have legal rights under the Consumer Protection Act, 2019. You can lodge an official complaint through:
          </p>
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-4 space-y-2 text-xs text-emerald-950">
            <div className="font-bold flex items-center justify-between">
              <span>National Consumer Helpline (NCH):</span>
              <span className="text-emerald-800 font-mono text-sm">Call 1915</span>
            </div>
            <p>
              Toll-free government helpline. You can also file online at{" "}
              <a
                href="https://consumerhelpline.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-emerald-800"
              >
                consumerhelpline.gov.in
              </a>
            </p>
            <div className="pt-2 border-t border-emerald-200/60 font-bold flex items-center justify-between">
              <span>Online Consumer Court (e-Daakhil):</span>
              <a
                href="https://edaakhil.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-emerald-800"
              >
                edaakhil.nic.in
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>3. Fair Use & Accuracy</span>
          </h2>
          <p>
            You agree to use FixFlow only for genuine personal or household service issues. You are responsible for ensuring that the reference numbers, payment details, and claim statements you record or escalate are truthful and accurate.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
        <span>FixFlow Consumer Rights & Terms</span>
        <Link href="/privacy" className="text-indigo-600 hover:underline font-medium">
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
