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
  HelpCircle,
  FileText,
  Calendar,
  Building2,
  Hash,
  Activity,
  ArrowRight,
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
    name: "Samsung Refrigerator (PRD Example)",
    text: "Service request 548921. Technician said he will visit on Tuesday. Refrigerator is still not cooling. Customer care asked me to wait until 12 Sept.",
  },
  {
    name: "Airtel Broadband Outage",
    text: "Complaint #TT-94820 lodged with Airtel Xstream. Fiber line down since 8 AM. Executive promises restoration by tomorrow 6 PM. Ticket ID is 94820.",
  },
  {
    name: "Flipkart Refund WhatsApp Chat",
    text: "Flipkart Order OD30192801 returned on 2nd Sept. Support representative Priya promised refund of Rs 2,499 within 3 days to original payment method. Still awaiting credit.",
  },
];

export default function NewIssuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"paste" | "manual">("paste");

  // Unstructured Text extraction state
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

      // Pre-fill editable form fields from extraction
      setTitle(result.title || "");
      setCompany(result.company || "");
      setCategory(result.category || "other");
      setReferenceNo(result.reference_number || "");
      setDescription(result.issue_summary || pastedText);
      setExpectedDate(result.promised_date || "");
      setStatus(result.status || "open");
      setNextAction(result.next_action || "");
      setNotes(`Original communication:\n"${pastedText.trim()}"`);
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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Capture Service Issue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn messy real-world chats into structured SLA records
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "paste"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Paste to Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "manual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manual Form
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Paste to Structure */}
      {activeTab === "paste" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Paste Raw Message / WhatsApp / Email
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">Explainable Draft</span>
            </div>

            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste communication here, e.g.: 'Service request 548921. Technician said he will visit on Tuesday...'"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Sample Chips */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium">Try sample:</span>
              {SAMPLE_TEXTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPastedText(s.text)}
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
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
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting Fields...
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

          {/* Extracted Review Section */}
          {extractedData && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Fields Extracted Successfully — Review & Edit Below
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Confidence: {Math.round((extractedData.confidence_by_field.reference_number || 0.8) * 100)}%
                </span>
              </div>
              {extractedData.missing_fields.length > 0 && (
                <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Missing in text: {extractedData.missing_fields.join(", ")} (please fill manually if known)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Structured Form (Always editable, pre-filled if extracted) */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Issue Details
          </h2>
          <span className="text-[11px] text-slate-400">All fields editable before save</span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Samsung: Double Door Refrigerator not cooling"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Company & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Company / Provider <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Samsung, Flipkart, Airtel"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <label className="block text-xs font-semibold text-slate-700">
              Reference / Ticket / Order #
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. 548921 or SR-90182"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Initial Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="open">Open</option>
              <option value="waiting">Waiting (Waiting on company)</option>
              <option value="action_needed">Action Needed (You need to act)</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Expected / Follow-up Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Expected Date / Promised Follow-up SLA
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            If this date passes without resolution, the dashboard will automatically flag it as Overdue.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue or problem..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Next Action */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Next Action (What happens next?)
          </label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Follow up if technician does not call by 2 PM"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Private Notes & Context
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Customer care numbers, executive names, raw messages, or serial numbers..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Issue
          </button>
        </div>
      </form>
    </div>
  );
}
