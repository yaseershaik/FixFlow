import Link from "next/link";
import {
  HelpCircle,
  Clock,
  MessageCircle,
  FileCheck,
  Scale,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Help & Consumer Guides | FixFlow",
  description:
    "Step-by-step guides on logging complaints, tracking service deadlines, escalating to grievance officers, and filing consumer cases.",
};

const GUIDES = [
  {
    icon: Clock,
    title: "How Deadline Tracking Works",
    summary:
      "When you file or update a complaint, enter the committed turnaround time (e.g. 'Technician will visit by Friday'). FixFlow computes an attention priority and alerts you the moment the date elapses.",
    tag: "Tracking",
  },
  {
    icon: MessageCircle,
    title: "1-Click WhatsApp & Email Escalations",
    summary:
      "FixFlow automatically drafts a formal, structured message with your Reference ID, days overdue, and request for next steps. Click to open directly in WhatsApp or your email client without manual typing.",
    tag: "Follow-ups",
  },
  {
    icon: FileCheck,
    title: "Court-Ready Evidence Dossier",
    summary:
      "Under Settings, you can export your entire complaint timeline as an audit-proof CSV or JSON file containing chronological logs of calls, agent names, and promised dates.",
    tag: "Documentation",
  },
  {
    icon: Scale,
    title: "When to Escalate to NCH (1915)",
    summary:
      "If 7 to 15 days pass without resolution from a brand, you can call the National Consumer Helpline at 1915 or lodge an online complaint via the NCH app. Companies are mandated to respond to NCH notices.",
    tag: "Legal Rights",
  },
];

const FAQS = [
  {
    q: "Does FixFlow send messages to companies directly?",
    a: "No. FixFlow operates 100% on your device for maximum privacy. It generates customized WhatsApp links and email mailto links that open in your own messaging apps, so you maintain full control of what is sent.",
  },
  {
    q: "How does the message auto-fill feature work?",
    a: "When you receive an SMS or WhatsApp update from an appliance brand, courier, or telecom provider, paste it into the 'Paste Message' box. FixFlow automatically detects the brand, complaint ticket number, and promised date so you can log it instantly.",
  },
  {
    q: "Can automated extraction or letters make mistakes?",
    a: "Yes. While automated auto-fill and notice templates save you significant time, automated systems can make errors or misread dates. Always double-check and review the extracted details and letter text before saving or sending.",
  },
  {
    q: "Can I use FixFlow records in Indian Consumer Court (e-Daakhil)?",
    a: "Yes. The CSV export complies with standard evidentiary requirements under Section 35 of the Consumer Protection Act 2019, demonstrating your continuous attempts to resolve the dispute amicably before filing.",
  },
  {
    q: "Are my uploaded invoices or documents shared anywhere?",
    a: "Never. All uploaded invoices, photos, and job sheets are stored in isolated private folders accessible only by your authenticated session. FixFlow has no advertising partners and does not train public models on your data.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Help & User Guides
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Learn how to track service complaints, hold companies accountable to deadlines, and assert your rights.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Feature Walkthroughs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDES.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {g.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{g.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{g.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2"
            >
              <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consumer Forum Banner */}
      <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
            Official Legal Recourse
          </span>
          <h3 className="text-base font-bold text-amber-950">
            Read the Indian Consumer Protection Act Guide
          </h3>
          <p className="text-xs text-amber-800 max-w-lg">
            Understand the 3-tier commission limits (District Forum up to ₹50 Lakh, State Commission up to ₹2 Crore) and e-Daakhil filing.
          </p>
        </div>
        <Link
          href="/consumer-rights"
          className="rounded-xl bg-amber-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-800 transition shadow-xs shrink-0"
        >
          View Rights Guide →
        </Link>
      </div>
    </div>
  );
}
