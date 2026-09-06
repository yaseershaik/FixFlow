import Link from "next/link";
import { Scale, Phone, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Consumer Rights & Escalation Manual | FixFlow",
  description:
    "Comprehensive guide on the Consumer Protection Act 2019, National Consumer Helpline (1915), and e-Daakhil filing for Indian consumers.",
};

export default function ConsumerRightsPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Top Navigation Links */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <span className="text-slate-300 text-xs">•</span>
        <Link
          href="/dashboard"
          className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Complaint Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
          <Scale className="h-3.5 w-3.5" />
          <span>Consumer Protection Act, 2019</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Your Legal Rights as an Indian Consumer
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          Under Indian law, consumers are protected against deficiency of service, misleading claims, delayed refunds, and unfair trade practices. Here is your step-by-step statutory escalation roadmap.
        </p>
      </div>

      {/* 4-Step Statutory Roadmap */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">The 4-Stage Escalation Hierarchy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stage 1 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              Stage 1 (Days 1–7)
            </span>
            <h3 className="text-base font-bold text-slate-900">Standard Customer Care</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Register an official complaint via call, chat, or ticket. Record your Reference Number and the exact resolution deadline given by the representative in FixFlow.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Stage 2 (Days 8–15)
            </span>
            <h3 className="text-base font-bold text-slate-900">Company Nodal / Grievance Officer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every major Indian enterprise (telecom, e-commerce, banking) is legally mandated to appoint a Grievance Officer. Send a formal email referencing your ticket and overdue days.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Stage 3 (Days 16–30)
            </span>
            <h3 className="text-base font-bold text-slate-900">National Consumer Helpline (NCH)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Call toll-free <strong>1915</strong> or log a docket on the Ministry of Consumer Affairs portal. Over 800+ convergence partner companies resolve complaints through NCH mediation.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full">
              Stage 4 (Day 30+)
            </span>
            <h3 className="text-base font-bold text-slate-900">e-Daakhil Consumer Commission</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              File a formal claim before the District Consumer Commission via <strong>edaakhil.nic.in</strong>. No advocate is required. You can claim damages for mental harassment and product cost.
            </p>
          </div>
        </div>
      </div>

      {/* Jurisdiction Limits Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Pecuniary Jurisdictions (CPA 2019)</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">Commission Level</th>
                <th className="p-3.5">Dispute Value Limit</th>
                <th className="p-3.5">Filing Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-3.5 font-semibold text-slate-900">District Forum (DCDRC)</td>
                <td className="p-3.5 font-mono">Up to ₹50,00,000 (50 Lakh)</td>
                <td className="p-3.5">e-Daakhil / Physical</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-900">State Commission (SCDRC)</td>
                <td className="p-3.5 font-mono">₹50 Lakh to ₹2 Crore</td>
                <td className="p-3.5">e-Daakhil / Physical</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-900">National Commission (NCDRC)</td>
                <td className="p-3.5 font-mono">Exceeding ₹2 Crore</td>
                <td className="p-3.5">New Delhi / Online</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist before filing */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>Evidence Checklist Before Filing on e-Daakhil</span>
        </h2>
        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
          {[
            "Copy of original purchase invoice or payment receipt.",
            "Customer care ticket numbers, chat transcripts, or email threads.",
            "Photos / videos of the defective product or failed service screen.",
            "Chronological event timeline exported directly from FixFlow.",
            "Demand notice or formal written notice sent to company grievance email.",
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Official Government Links */}
      <div className="flex flex-wrap gap-4 pt-2">
        <a
          href="https://consumerhelpline.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <span>National Consumer Helpline (NCH)</span>
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://edaakhil.nic.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <span>e-Daakhil Online Portal</span>
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://ncdrc.nic.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <span>NCDRC Official Portal</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
