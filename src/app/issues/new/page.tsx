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
  AlertTriangle,
  Phone,
  Mail,
  IndianRupee,
} from "lucide-react";
import { IssueCategory, IssueStatus, ExtractionResult } from "@/lib/types";
import { analyzeUrgencyAndSentiment } from "@/lib/ml/sentiment-urgency";

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: "warranty", label: "Appliance & Repair" },
  { value: "refund", label: "Refunds & Payments" },
  { value: "delivery", label: "Delivery & Courier" },
  { value: "telecom", label: "Broadband & Mobile" },
  { value: "banking", label: "Banking & Cards" },
  { value: "education", label: "College & Education" },
  { value: "government", label: "Government / Civic" },
  { value: "other", label: "Other Services" },
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
    name: "Refund Delay",
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

  // Form Fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<IssueCategory>("warranty");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState<IssueStatus>("open");
  const [nextAction, setNextAction] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Plain-language urgency assessment
  const urgencyAnalysis = pastedText.trim().length >= 15 ? analyzeUrgencyAndSentiment(pastedText) : null;

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

      // Try extracting phone, email or rupee amount from pasted message
      const phoneMatch = pastedText.match(/\b(?:\+?91)?[6-9]\d{9}\b|\b1800\s*\d{3}\s*\d{3,4}\b/);
      if (phoneMatch) setSupportPhone(phoneMatch[0].replace(/\s+/g, ""));

      const emailMatch = pastedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !["gmail.com", "yahoo.com"].includes(emailMatch[0].split("@")[1])) {
        setSupportEmail(emailMatch[0]);
      }

      const amountMatch = pastedText.match(/(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
      if (amountMatch) setAmount(amountMatch[1].replace(/,/g, ""));

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

    if (!title.trim() || title.trim().length < 5) {
      setError("Please enter a descriptive title of at least 5 characters.");
      return;
    }
    if (!company.trim()) {
      setError("Please enter the company or brand name.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Please describe the problem with at least 10 characters.");
      return;
    }

    setSaving(true);

    // Combine structured extra fields into notes for storage
    const extraLines: string[] = [];
    if (supportPhone.trim()) extraLines.push(`Support Phone: ${supportPhone.trim()}`);
    if (supportEmail.trim()) extraLines.push(`Support Email: ${supportEmail.trim()}`);
    if (amount.trim()) extraLines.push(`Disputed Amount: ₹${amount.trim()}`);
    if (notes.trim()) extraLines.push(notes.trim());
    const combinedNotes = extraLines.join("\n");

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
          notes: combinedNotes || null,
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
      setError("Network error saving issue. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Issues</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Track a Service Complaint
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record ticket numbers, promised dates, and notes so you never lose follow-up control.
          </p>
        </div>

        {/* Input Method Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 self-start text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "paste"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paste Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "manual"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Fill Manually
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste section */}
      {activeTab === "paste" && (
        <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="paste-message-input" className="block text-xs sm:text-sm font-bold text-slate-900">
              Paste your WhatsApp, SMS, or Email message
            </label>
            <span className="text-[11px] text-slate-400">Auto-fills ticket & dates</span>
          </div>

          <textarea
            id="paste-message-input"
            rows={3}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste message here (e.g. Service request 548921. Samsung technician said he will visit on Tuesday. Refrigerator is still not cooling...)"
            className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
          />

          {/* Sample Chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Try an example:</span>
            {SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPastedText(s.text)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition"
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* User-friendly Priority Assessment (Plain English) */}
          {urgencyAnalysis && (
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Detected Priority:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                    urgencyAnalysis.urgencyScore >= 70
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : urgencyAnalysis.urgencyScore >= 40
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {urgencyAnalysis.urgencyScore >= 70
                    ? "High Priority (Immediate follow-up recommended)"
                    : urgencyAnalysis.urgencyScore >= 40
                    ? "Medium Priority"
                    : "Normal Priority"}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Instant offline analysis
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Click below to automatically fill the form:
            </span>

            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting || !pastedText.trim()}
              className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reading Details...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Auto-Fill Details</span>
                </>
              )}
            </button>
          </div>

          {extractedSuccess && (
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Details auto-filled! Please review the fields below.</span>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Safety Precaution: Please review all details</span>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Automated tools may occasionally make errors or misinterpret dates, ticket numbers, or amounts. Please double-check all fields below for accuracy before saving.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-4 sm:space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Company */}
          <div>
            <label htmlFor="issue-company" className="block text-xs font-bold text-slate-700 mb-1.5">
              Company or Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="issue-company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Samsung, Airtel, Flipkart, Swiggy"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="issue-category" className="block text-xs font-bold text-slate-700 mb-1.5">
              Service Category
            </label>
            <select
              id="issue-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="sm:col-span-2">
            <label htmlFor="issue-title" className="block text-xs font-bold text-slate-700 mb-1.5">
              What is the problem? (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              id="issue-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Refrigerator not cooling after technician visit"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Ticket / Reference # */}
          <div>
            <label htmlFor="issue-referenceNo" className="block text-xs font-bold text-slate-700 mb-1.5">
              Ticket, Order, or Complaint ID
            </label>
            <input
              id="issue-referenceNo"
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. #548921 or OD30192801"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Promised Date */}
          <div>
            <label htmlFor="issue-expectedDate" className="block text-xs font-bold text-slate-700 mb-1.5">
              Promised Resolution Date
            </label>
            <input
              id="issue-expectedDate"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Support Phone Number */}
          <div>
            <label htmlFor="issue-phone" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>Customer Care / Executive Phone</span>
            </label>
            <input
              id="issue-phone"
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="e.g. 1800-40-7267864 or 9876543210"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Support Email */}
          <div>
            <label htmlFor="issue-email" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>Support or Grievance Email</span>
            </label>
            <input
              id="issue-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="e.g. care@samsung.com or support@flipkart.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Disputed Amount */}
          <div>
            <label htmlFor="issue-amount" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
              <span>Refund or Disputed Amount (₹)</span>
            </label>
            <input
              id="issue-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2499"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Current Status */}
          <div>
            <label htmlFor="issue-status" className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Status
            </label>
            <select
              id="issue-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            >
              <option value="open">Open (Just reported)</option>
              <option value="waiting">Waiting for Company Response</option>
              <option value="action_needed">Action Needed (My Turn to Send Details)</option>
              <option value="resolved">Resolved (Satisfied)</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* What needs to happen next */}
          <div className="sm:col-span-2">
            <label htmlFor="issue-nextAction" className="block text-xs font-bold text-slate-700 mb-1.5">
              What needs to happen next?
            </label>
            <input
              id="issue-nextAction"
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Follow up if technician does not visit by 3 PM tomorrow"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
          </div>

          {/* Full Description */}
          <div className="sm:col-span-2">
            <label htmlFor="issue-description" className="block text-xs font-bold text-slate-700 mb-1.5">
              Details of the Problem <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="issue-description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain clearly what went wrong, who you spoke with, and what was promised..."
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Private Notes */}
          <div className="sm:col-span-2">
            <label htmlFor="issue-notes" className="block text-xs font-bold text-slate-700 mb-1.5">
              Private Notes (Optional)
            </label>
            <textarea
              id="issue-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional personal notes, serial numbers, product model..."
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        {/* Safety Note & Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 text-center sm:text-left">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Safety check: Please verify ticket numbers and dates before saving.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition min-h-[44px] inline-flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center"
            >
              {saving ? "Saving..." : "Save Complaint"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
