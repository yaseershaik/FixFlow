"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { IssueCategory, IssueStatus, ExtractionResult } from "@/lib/types";

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: "warranty", label: "Appliance & Warranty" },
  { value: "refund", label: "Refunds & Payments" },
  { value: "delivery", label: "Courier & Delivery" },
  { value: "telecom", label: "Broadband & Phone" },
  { value: "banking", label: "Banking & Cards" },
  { value: "education", label: "College & Education" },
  { value: "government", label: "Government / Civic" },
  { value: "other", label: "Other" },
];

const SAMPLES = [
  {
    name: "Fridge Repair",
    text: "Service request 548921. Samsung technician said he will visit on Tuesday. Refrigerator is still not cooling. Customer care asked me to wait until 12 Sept.",
  },
  {
    name: "Broadband Down",
    text: "Airtel broadband red light blinking since yesterday. Ticket ID #TT-948210. Support promised technician visit by tomorrow 6 PM.",
  },
  {
    name: "Refund Chat",
    text: "Flipkart Order OD30192801 returned on Monday. Support promised refund of Rs 2,499 within 3 days. Still awaiting credit in bank account.",
  },
];

export default function NewIssuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"paste" | "manual">("paste");

  // Paste text
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedSuccess, setExtractedSuccess] = useState(false);

  // Form
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
      setError("Please paste a support message with at least 10 characters.");
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
        setError(data.error?.message || "Could not read fields from text.");
        setExtracting(false);
        return;
      }

      const result: ExtractionResult = data.result;
      setTitle(result.title || "");
      setCompany(result.company || "");
      setCategory(result.category || "other");
      setReferenceNo(result.reference_number || "");
      setDescription(result.issue_summary || pastedText);
      setExpectedDate(result.promised_date || "");
      setStatus(result.status || "open");
      setNextAction(result.next_action || "");
      setNotes(`Pasted text:\n"${pastedText.trim()}"`);
      setExtractedSuccess(true);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || title.length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (!company.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError("Description must be at least 10 characters.");
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
        setError(data.error?.message || "Failed to save issue.");
        setSaving(false);
        return;
      }

      router.push(`/issues/${data.issue.id}`);
    } catch {
      setError("Network error while saving.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      {/* Top Bar */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Issues
      </Link>

      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          New Issue
        </h1>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`rounded-md px-3 py-1 transition ${
              activeTab === "paste"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Paste Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-md px-3 py-1 transition ${
              activeTab === "manual"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Manual Form
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste section */}
      {activeTab === "paste" && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Paste WhatsApp, Email, or SMS message
          </label>
          <textarea
            rows={3}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="e.g. Service request 548921. Technician said he will visit on Tuesday..."
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />

          {/* Sample Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Sample:</span>
            {SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPastedText(s.text)}
                className="rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 transition"
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting || !pastedText.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Filling form...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                  Auto-Fill Form
                </>
              )}
            </button>
          </div>

          {extractedSuccess && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Form filled from your message. Review and save below.</span>
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Company or Brand <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Samsung, Airtel, Flipkart"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            What is the issue? (Title) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refrigerator not cooling"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Reference / Ticket #
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. 548921"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Promised Date
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="waiting">Waiting on Company</option>
              <option value="action_needed">Action Needed</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened or what did customer service say?"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Next Action
          </label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Call back if technician doesn't arrive by 2 PM"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Customer care numbers, executive names, model numbers..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Issue"}
          </button>
        </div>
      </form>
    </div>
  );
}
