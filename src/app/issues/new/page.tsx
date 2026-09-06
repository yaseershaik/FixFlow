"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Hash,
  ArrowRight,
  FileText,
  Zap,
} from "lucide-react";
import { IssueCategory, IssueStatus, ExtractionResult } from "@/lib/types";

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: "warranty", label: "Appliance & Warranty" },
  { value: "refund", label: "Refunds & Payments" },
  { value: "delivery", label: "Courier & Delivery" },
  { value: "telecom", label: "Broadband & Telecom" },
  { value: "banking", label: "Banking & Cards" },
  { value: "education", label: "College & Education" },
  { value: "government", label: "Government / Municipal" },
  { value: "other", label: "Other Service Issue" },
];

const SAMPLE_TEXTS = [
  {
    name: "Samsung Fridge Repair",
    text: "Service request 548921. Samsung technician said he will visit on Tuesday. Refrigerator is still not cooling. Customer care asked me to wait until 12 Sept.",
  },
  {
    name: "Airtel Fiber Outage",
    text: "Airtel broadband red LOS light blinking since yesterday. Ticket ID #TT-948210. Support promised field engineer restoration by tomorrow evening.",
  },
  {
    name: "Flipkart Refund WhatsApp",
    text: "Flipkart Order OD30192801 returned on Monday. Priya from customer support promised refund of Rs 2,499 within 3 days. Still awaiting credit to bank.",
  },
];

export default function NewIssuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"paste" | "manual">("paste");

  // Extraction state
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<IssueCategory>("warranty");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState<IssueStatus>("open");
  const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 10) {
      setError("Please paste at least 10 characters of message text.");
      return;
    }

    setError("");
    setExtracting(true);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Extraction failed");
        setExtracting(false);
        return;
      }

      const result: ExtractionResult = data.result;
      setExtractedData(result);

      // Populate form
      setTitle(result.title || "");
      setCompany(result.company || "");
      setCategory(result.category || "other");
      setReferenceNo(result.reference_number || "");
      setDescription(result.issue_summary || pastedText);
      setExpectedDate(result.promised_date || "");
      setStatus(result.status || "open");
      setNextAction(result.next_action || "");
      setNotes(`Pasted Communication:\n"${pastedText.trim()}"`);
    } catch {
      setError("Network error during extraction.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || title.length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }
    if (!company.trim()) {
      setError("Company or service provider is required");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim(),
          category,
          referenceNo: referenceNo.trim() || null,
          description: description.trim(),
          expectedDate: expectedDate || null,
          status,
          nextAction: nextAction.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to create issue");
        setSaving(false);
        return;
      }

      router.push(`/issues/${data.issue.id}`);
    } catch {
      setError("Network error while saving issue");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Log New Service Issue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Convert a real-world chat message into an organized follow-up record
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-200/70 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "paste"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Paste to Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "manual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2.5 shadow-subtle">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Paste to Structure */}
      {activeTab === "paste" && (
        <div className="space-y-6 mb-6">
          <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Paste Raw Message / WhatsApp / Email
              </label>
              <span className="text-[10px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5">
                Assistive AI
              </span>
            </div>

            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste raw conversation here, e.g.: 'Service request 548921. Samsung technician said he will visit on Tuesday...'"
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />

            {/* Quick sample chips */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Quick sample:</span>
              {SAMPLE_TEXTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPastedText(s.text)}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-subtle transition"
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !pastedText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting structured fields...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Structured Fields
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted feedback pill */}
          {extractedData && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Fields Extracted! Review and edit below before saving.
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Confidence: {Math.round((extractedData.confidence_by_field.reference_number || 0.85) * 100)}%
                </span>
              </div>
              {extractedData.missing_fields.length > 0 && (
                <div className="mt-1.5 text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Not found in text: {extractedData.missing_fields.join(", ")} (please fill manually if known)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Form (Always editable) */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Structured Issue Information
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Always fully editable</span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Samsung: Double Door Refrigerator not cooling"
            className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Company & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Company / Provider <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Samsung, Flipkart, Airtel"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reference Number & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Reference / Ticket / Order #
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. 548921 or SR-90182"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Initial Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              <option value="open">Open</option>
              <option value="waiting">Waiting (On company response)</option>
              <option value="action_needed">Action Needed (Action by you)</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Expected / Follow-up Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Promised Date / Follow-up SLA
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            If this target date passes without resolution, the dashboard will flag it as Overdue.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue or problem..."
            className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Next Action */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Next Action (What needs to happen next?)
          </label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Follow up with nodal officer if technician does not arrive by 2 PM"
            className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Private Notes & Reference Details
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Executive names, contact numbers, serial numbers, or raw messages..."
            className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-card hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Issue
          </button>
        </div>
      </form>
    </div>
  );
}
