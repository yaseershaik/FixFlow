import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Trash2, Download, EyeOff } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — FixFlow",
  description: "FixFlow plain-English privacy policy and consumer data protection commitment.",
};

export default function PrivacyPage() {
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
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Your Data Belongs 100% to You</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last updated: September 2026 • Plain language commitment, no fine print.
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            <span>1. What We Collect & Why</span>
          </h2>
          <p>
            FixFlow is designed to help everyday people keep track of customer service complaints, promised repair dates, and refund reference numbers. We only store:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Your Account:</strong> Your email address and a securely hashed password so you can sign in.</li>
            <li><strong>Complaint Records:</strong> Company name, ticket / order number, description, promised dates, and phone/email contact info you provide.</li>
            <li><strong>Attachments:</strong> Any photos, bills, or warranty cards you explicitly upload to support your complaint.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-emerald-600" />
            <span>2. Zero Advertising, Zero Data Selling</span>
          </h2>
          <p>
            We believe consumer complaints are sensitive personal matters. Therefore:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>We <strong>never</strong> sell, rent, or trade your data to third parties, data brokers, or advertisers.</li>
            <li>We do <strong>not</strong> run behavioral tracking ads or marketing trackers.</li>
            <li>Your complaints are strictly private and isolated to your account.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-sky-600" />
            <span>3. Complete Data Portability</span>
          </h2>
          <p>
            You are never locked in. You can download all your issues, timelines, and complaint notes at any time in standard <strong>CSV</strong> (Excel compatible) or <strong>JSON</strong> format directly from your <Link href="/settings" className="text-indigo-600 font-semibold underline">Settings</Link> page.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-600" />
            <span>4. 1-Click Permanent Deletion</span>
          </h2>
          <p>
            If you ever wish to leave, you can permanently delete your account and all associated issues, timeline notes, and files with one click in your account settings. Once deleted, your records are completely wiped from our database.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
        <span>FixFlow Consumer Rights & Privacy</span>
        <Link href="/terms" className="text-indigo-600 hover:underline font-medium">
          Terms of Service →
        </Link>
      </div>
    </div>
  );
}
