"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  Paperclip,
  Trash2,
  Edit3,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  X,
  Send,
  Share2,
  PhoneCall,
  IndianRupee,
  ShieldAlert,
} from "lucide-react";
import { IssueCategory, IssueStatus } from "@/lib/types";
import { ALLOWED_TRANSITIONS } from "@/lib/lifecycle";
import { analyzeUrgencyAndSentiment } from "@/lib/ml/sentiment-urgency";
import {
  generateWhatsAppFollowupUrl,
  generateMailtoEscalationUrl,
  shareComplaintDossier,
} from "@/lib/notifications";

interface TimelineEvent {
  id: string;
  eventType: string;
  body: string;
  eventAt: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdAt: string;
}

interface IssueData {
  id: string;
  title: string;
  company: string;
  category: IssueCategory;
  referenceNo: string | null;
  description: string;
  status: IssueStatus;
  expectedDate: string | null;
  nextAction: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysRemaining: number | null;
  attentionPriority: number;
  attentionLabel: string;
  events: TimelineEvent[];
  attachments: Attachment[];
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [issue, setIssue] = useState<IssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "error") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventType, setEventType] = useState("call");
  const [eventBody, setEventBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [newPromiseDate, setNewPromiseDate] = useState("");
  const [loggingEvent, setLoggingEvent] = useState(false);

  // Edit issue form
  const [isEditing, setIsEditing] = useState(false);
  const [editNextAction, setEditNextAction] = useState("");
  const [editExpectedDate, setEditExpectedDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Upload file
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Escalation draft state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // Parse contact info and disputed amount from notes if present
  const phoneMatch = issue?.notes?.match(/Support Phone:\s*([^\n]+)/);
  const supportPhone = phoneMatch ? phoneMatch[1].trim() : null;

  const emailMatch = issue?.notes?.match(/Support Email:\s*([^\n]+)/);
  const supportEmail = emailMatch ? emailMatch[1].trim() : null;

  const amountMatch = issue?.notes?.match(/(?:Disputed Amount|Claim Amount|Amount):\s*([^\n]+)/);
  const disputedAmount = amountMatch ? amountMatch[1].trim() : null;

  const escalationSubject = issue
    ? `[URGENT ESCALATION] Unresolved Complaint #${issue.referenceNo || "N/A"} - ${issue.company}`
    : "";

  const escalationBody = issue
    ? `To: Customer Grievance Officer / Support Team (${issue.company})

Subject: ${escalationSubject}

Dear Grievance Redressal Team,

I am writing to formally escalate an unresolved service issue regarding "${issue.title}".

1. Case Details:
- Company / Service Provider: ${issue.company}
- Reference / Ticket / Order #: ${issue.referenceNo || "Not provided"}
- Date Logged: ${new Date(issue.createdAt).toLocaleDateString()}
- Promised Resolution Date: ${issue.expectedDate || "Not committed"} ${issue.isOverdue ? `(OVERDUE by ${Math.abs(issue.daysRemaining || 0)} days)` : ""}
- Current Status: ${issue.status.replace("_", " ").toUpperCase()}
${disputedAmount ? `- Claim / Disputed Amount: ${disputedAmount}` : ""}

2. Issue Description:
${issue.description}

3. History of Follow-ups & Contact:
${issue.events && issue.events.length > 0 
  ? issue.events.map((e, idx) => `  ${idx + 1}. [${new Date(e.eventAt).toLocaleDateString()} - ${e.eventType.toUpperCase()}]: ${e.body}`).join("\n") 
  : "  (No prior updates logged)"}

4. Expected Remedy:
${issue.nextAction || "Immediate resolution or refund/replacement as per service commitment."}

Please confirm receipt of this escalation and assign a dedicated executive with contact information.

Sincerely,
Concerned Consumer`
    : "";

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(escalationBody);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
    logQuickCommunication(
      "escalation",
      `Prepared and copied formal Grievance Escalation Letter addressed to ${issue?.company}`
    );
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(escalationSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  // Plain language urgency and risk factors
  const mlUrgency = issue
    ? analyzeUrgencyAndSentiment(
        `${issue.title} ${issue.description} ${issue.nextAction || ""} ${(issue.events || []).map((e) => e.body).join(" ")}`
      )
    : null;

  useEffect(() => {
    if (id) fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const res = await fetch(`/api/issues/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("Issue not found.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data?.issue) {
        setIssue({
          ...data.issue,
          events: data.issue.events || [],
          attachments: data.issue.attachments || [],
        });
        setEditNextAction(data.issue.nextAction || "");
        setEditExpectedDate(data.issue.expectedDate || "");
        setEditNotes(data.issue.notes || "");
      }
    } catch {
      setError("Failed to load issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (!issue?.referenceNo) return;
    navigator.clipboard.writeText(issue.referenceNo);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || newStatus === issue.status) return;
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.issue) {
          setIssue((prev) => ({
            ...prev!,
            ...data.issue,
            events: data.issue.events || prev?.events || [],
            attachments: data.issue.attachments || prev?.attachments || [],
          }));
        }
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error?.message || "Failed to update status.");
      }
    } catch {
      showToast("Failed to update status.");
    }
  };

  const handleSaveEdit = async () => {
    if (!issue) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextAction: editNextAction.trim() || null,
          expectedDate: editExpectedDate || null,
          notes: editNotes.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.issue) {
          setIssue((prev) => ({
            ...prev!,
            ...data.issue,
            events: data.issue.events || prev?.events || [],
            attachments: data.issue.attachments || prev?.attachments || [],
          }));
        }
        setIsEditing(false);
        showToast("Changes saved successfully.", "success");
      } else {
        showToast("Failed to save changes.");
      }
    } catch {
      showToast("Error saving issue.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = () => {
    if (!issue) return;
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!issue) return;
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        showToast("Failed to delete issue.");
      }
    } catch {
      showToast("Network error deleting issue.");
    }
  };

  const logQuickCommunication = async (
    type: "call" | "message" | "whatsapp" | "email" | "escalation",
    note: string
  ) => {
    if (!issue) return;
    try {
      const res = await fetch(`/api/issues/${issue.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: type,
          body: note,
        }),
      });
      if (res.ok) {
        fetchIssue();
        showToast("Logged to Call & Message History", "success");
      }
    } catch {
      // Non-blocking
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !eventBody.trim()) return;

    setLoggingEvent(true);
    try {
      const payload: any = {
        eventType,
        body: eventBody.trim(),
      };
      if (eventDate) {
        payload.eventAt = new Date(eventDate).toISOString();
      }
      if (newPromiseDate) {
        payload.newExpectedDate = newPromiseDate;
      }

      const res = await fetch(`/api/issues/${issue.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEventBody("");
        setEventDate("");
        setNewPromiseDate("");
        setShowEventForm(false);
        fetchIssue();
        showToast("Interaction logged to history.", "success");
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error?.message || "Failed to log activity.");
      }
    } catch {
      showToast("Network error adding update.");
    } finally {
      setLoggingEvent(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !issue) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds 5MB limit.");
      return;
    }

    setUploadingFile(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/issues/${issue.id}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchIssue();
      } else {
        const data = await res.json();
        setUploadError(data.error?.message || "File upload failed.");
      }
    } catch {
      setUploadError("Network error uploading file.");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleShare = async () => {
    if (!issue) return;
    const shareText = `Complaint: ${issue.title}\nCompany: ${issue.company}\nReference ID: #${issue.referenceNo || "N/A"}\nStatus: ${issue.status.toUpperCase()}\nPromised: ${issue.expectedDate || "None"}\nNext Step: ${issue.nextAction || "None"}`;
    const shared = await shareComplaintDossier({
      title: `${issue.company}: ${issue.title}`,
      text: shareText,
    });
    if (shared) {
      setSharedSuccess(true);
      setTimeout(() => setSharedSuccess(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-400">
        Loading complaint details...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Complaint Not Found or Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              This complaint docket does not exist, has been removed, or is registered to another private account.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm active:scale-95"
            >
              <span>Return to Dashboard</span>
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <span>Search Complaints</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[issue.status] || [];

  // 1-Click WhatsApp URL
  const whatsAppUrl = generateWhatsAppFollowupUrl({
    company: issue.company,
    phone: supportPhone,
    referenceNo: issue.referenceNo,
    title: issue.title,
    expectedDate: issue.expectedDate,
    daysRemaining: issue.daysRemaining,
  });

  // 1-Click Email Escalation URL
  const mailtoUrl = generateMailtoEscalationUrl({
    company: issue.company,
    email: supportEmail,
    referenceNo: issue.referenceNo,
    subject: escalationSubject,
    body: escalationBody,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Issues</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEscalateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-xs transition"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Escalation Letter</span>
            <span className="sm:hidden">Escalate</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            <span>{isEditing ? "Cancel" : "Edit"}</span>
          </button>
          <button
            onClick={handleDelete}
            title="Delete Issue"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-xs transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overdue alert banner if applicable */}
      {issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed" && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Deadline Passed ({Math.abs(issue.daysRemaining || 0)} days overdue). </span>
            <span>
              {issue.company} promised resolution by {issue.expectedDate}. Use the instant follow-up buttons below to contact support.
            </span>
          </div>
        </div>
      )}

      {/* Responsive Grid: Split 2-Column on Tablet & Desktop, Single-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Core Issue Information */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Issue Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
            {/* Header: Company, Reference #, Status Select */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                  {issue.company}
                </span>
                {issue.referenceNo && (
                  <button
                    onClick={handleCopyRef}
                    title="Click to copy reference number"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition"
                  >
                    <span>#{issue.referenceNo}</span>
                    {copiedRef ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Status Transition Control */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-3 py-1.5 text-xs font-bold text-slate-800 capitalize focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition"
                >
                  <option value={issue.status}>{issue.status.replace("_", " ")}</option>
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      Mark as {st.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mt-4 leading-tight">
              {issue.title}
            </h1>

            {/* Real Communication Quick Action Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
              {/* WhatsApp Button */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  logQuickCommunication(
                    "whatsapp",
                    `Sent WhatsApp follow-up message to customer care${supportPhone ? ` (${supportPhone})` : ""}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Message on WhatsApp</span>
              </a>

              {/* Phone Dialer Button */}
              {supportPhone && (
                <a
                  href={`tel:${supportPhone}`}
                  onClick={() =>
                    logQuickCommunication(
                      "call",
                      `Initiated phone call to customer care at ${supportPhone}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition active:scale-95"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Call {supportPhone}</span>
                </a>
              )}

              {/* Email Button */}
              <a
                href={mailtoUrl}
                onClick={() =>
                  logQuickCommunication(
                    "email",
                    `Sent follow-up email to ${supportEmail || issue.company}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition active:scale-95"
              >
                <Mail className="h-3.5 w-3.5 text-indigo-600" />
                <span>Send Email</span>
              </a>

              {/* Native Mobile Share */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span>{sharedSuccess ? "Copied!" : "Share Dossier"}</span>
              </button>
            </div>

            {/* Quick Safety Note */}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              <span>Safety reminder: Always review pre-composed messages before sending.</span>
            </div>

            {/* Description */}
            <div className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
              {issue.description}
            </div>

            {/* Plain English Priority Card */}
            {mlUrgency && (
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Follow-up Priority:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                      issue.isOverdue || mlUrgency.urgencyScore >= 70
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : mlUrgency.urgencyScore >= 40
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {issue.isOverdue
                      ? "High Priority (Overdue)"
                      : mlUrgency.urgencyScore >= 70
                      ? "High Priority"
                      : mlUrgency.urgencyScore >= 40
                      ? "Medium Priority"
                      : "Normal Priority"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {issue.isOverdue
                    ? "Action needed: follow up immediately"
                    : issue.status === "waiting"
                    ? "Waiting on company's commitment"
                    : "Active case"}
                </div>
              </div>
            )}

            {/* Next Action Callout */}
            {(issue.nextAction || isEditing) && (
              <div className="mt-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs sm:text-sm text-amber-950">
                <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-1">
                  What to do next
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editNextAction}
                    onChange={(e) => setEditNextAction(e.target.value)}
                    placeholder="What action needs to happen next?"
                    className="w-full rounded-xl border border-amber-300 p-2 text-xs text-slate-900 bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                ) : (
                  <p className="font-semibold">{issue.nextAction}</p>
                )}
              </div>
            )}

            {/* Metadata Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Promised Date:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editExpectedDate}
                    onChange={(e) => setEditExpectedDate(e.target.value)}
                    className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-800 mt-1 w-full"
                  />
                ) : (
                  <span
                    className={`font-semibold mt-0.5 block ${
                      issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
                        ? "text-rose-600 font-bold"
                        : "text-slate-800"
                    }`}
                  >
                    {issue.expectedDate || "None set"}
                    {issue.isOverdue && " (Overdue)"}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Category:</span>
                <span className="font-semibold text-slate-800 capitalize mt-0.5 block">
                  {issue.category}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Date Logged:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {new Date(issue.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {disputedAmount && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Claim Amount:</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {disputedAmount}
                  </span>
                </div>
              )}

              {supportPhone && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Support Phone:</span>
                  <a
                    href={`tel:${supportPhone}`}
                    className="font-semibold text-indigo-600 hover:underline mt-0.5 block"
                  >
                    {supportPhone}
                  </a>
                </div>
              )}

              {supportEmail && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Support Email:</span>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-semibold text-indigo-600 hover:underline mt-0.5 block truncate"
                  >
                    {supportEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Private Notes */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                Private Notes
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Customer service numbers, representative names, serial numbers..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {issue.notes || "No additional notes."}
                </p>
              )}
            </div>

            {/* Editing Save / Cancel Buttons */}
            {isEditing && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline Activity & Attachments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Activity Section */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Call & Message History
                </h2>
                <span className="text-[11px] text-slate-400">
                  {(issue.events || []).length} interaction{(issue.events || []).length === 1 ? "" : "s"} logged in chronological paper trail
                </span>
              </div>

              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition active:scale-95"
              >
                + Log Update
              </button>
            </div>

            {/* Expandable Add Event Form */}
            {showEventForm && (
              <form
                onSubmit={handleAddEvent}
                className="mb-5 rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-slate-50 p-4 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Record Interaction or Promise</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="text-slate-400 hover:text-slate-600 font-normal text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Interaction Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="call">📞 Phone Call with Customer Care</option>
                      <option value="whatsapp">💬 WhatsApp Message Sent/Received</option>
                      <option value="message">📱 SMS Update Received</option>
                      <option value="email">✉️ Email Sent or Received</option>
                      <option value="promise_updated">📅 Resolution Date Promise</option>
                      <option value="technician_visit">🔧 Technician / Field Visit</option>
                      <option value="escalation">📢 Escalated to Grievance Officer</option>
                      <option value="note">📝 Personal Note / Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Interaction Details & Promises
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={eventBody}
                    onChange={(e) => setEventBody(e.target.value)}
                    placeholder="Who did you speak with? What was promised? (e.g. Spoke with executive Priya, promised technician visit by tomorrow 3 PM)"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    New Promised Resolution Date (If given during this interaction)
                  </label>
                  <input
                    type="date"
                    value={newPromiseDate}
                    onChange={(e) => setNewPromiseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    If customer care committed to a new deadline, setting this updates the complaint tracker automatically.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingEvent}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition active:scale-95"
                  >
                    {loggingEvent ? "Saving..." : "Save to History Log"}
                  </button>
                </div>
              </form>
            )}

            {/* Chronological Event Feed with Permanent Timeline */}
            {(issue.events || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <MessageSquare className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
                <p>No contact history recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Log Update" or use the WhatsApp/Call buttons above to record your first touchpoint.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-4">
                {(issue.events || []).map((evt) => {
                  const badgeClass =
                    evt.eventType === "call"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : evt.eventType === "whatsapp" || evt.eventType === "message"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : evt.eventType === "email"
                      ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                      : evt.eventType === "promise_updated"
                      ? "bg-amber-50 text-amber-900 border-amber-200"
                      : evt.eventType === "status_change"
                      ? "bg-purple-50 text-purple-800 border-purple-200"
                      : evt.eventType === "escalation"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  const dotClass =
                    evt.eventType === "call"
                      ? "bg-blue-500"
                      : evt.eventType === "whatsapp" || evt.eventType === "message"
                      ? "bg-emerald-500"
                      : evt.eventType === "email"
                      ? "bg-indigo-500"
                      : evt.eventType === "promise_updated"
                      ? "bg-amber-500"
                      : evt.eventType === "status_change"
                      ? "bg-purple-500"
                      : evt.eventType === "escalation"
                      ? "bg-rose-500"
                      : "bg-slate-400";

                  return (
                    <div key={evt.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-3 h-2.5 w-2.5 rounded-full border-2 border-white shadow-xs ${dotClass}`}
                      />

                      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs shadow-xs hover:border-slate-300 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-1.5">
                          <span
                            className={`font-bold capitalize px-2 py-0.5 rounded-md border text-[10px] ${badgeClass}`}
                          >
                            {evt.eventType.replace("_", " ")}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {new Date(evt.eventAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                          {evt.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Files & Receipts Section */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Photos, Invoices & Receipts
                </h2>
                <span className="text-[11px] text-slate-400">
                  {(issue.attachments || []).length} attachment{(issue.attachments || []).length === 1 ? "" : "s"}
                </span>
              </div>

              <label className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition active:scale-95">
                <span>{uploadingFile ? "Uploading..." : "+ Attach Proof"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  accept="image/*,.pdf,.txt"
                />
              </label>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {uploadError}
              </p>
            )}

            {(issue.attachments || []).length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Paperclip className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
                <p>No proof attached.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attach bills, warranty cards, or chat screenshots.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(issue.attachments || []).map((att) => {
                  const downloadUrl = att.storagePath.startsWith("/api/")
                    ? att.storagePath
                    : `/api${att.storagePath}`;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs hover:bg-slate-100/70 transition"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-800 block truncate">{att.filename}</span>
                        <span className="text-[10px] text-slate-400">{Math.round(att.size / 1024)} KB</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open file ${att.filename} in new tab`}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white transition shadow-2xs"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `/api/issues/${issue.id}/attachments?attachmentId=${att.id}`,
                                { method: "DELETE" }
                              );
                              if (res.ok) {
                                showToast("Attachment removed.", "success");
                                fetchIssue();
                              } else {
                                showToast("Failed to remove attachment.");
                              }
                            } catch {
                              showToast("Network error removing attachment.");
                            }
                          }}
                          aria-label={`Delete attachment ${att.filename}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Draft Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-floating border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Formal Grievance Escalation Letter
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pre-composed draft for Grievance Officer, Nodal Support, or Consumer Forum
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEscalateModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Safety Precaution Banner */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Safety First: Please review this draft before sending</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-950 font-semibold px-1.5 py-0.5 rounded">Verify Details</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Automated templates may make errors or need specific personal details. Please verify the company name, reference number, dates, and amounts before emailing your service provider or filing with consumer authorities.
                  </p>
                </div>
              </div>

              {/* Subject line */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[11px] font-bold text-slate-400 block">SUBJECT LINE</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {escalationSubject}
                  </span>
                </div>
                <button
                  onClick={handleCopySubject}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 shrink-0 flex items-center gap-1 transition"
                >
                  {copiedSubject ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Subject</span>
                    </>
                  )}
                </button>
              </div>

              {/* Letter Preview */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Escalation Letter Body
                </label>
                <textarea
                  readOnly
                  rows={14}
                  value={escalationBody}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none select-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/50 gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition min-h-[40px]"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={mailtoUrl}
                  onClick={() =>
                    logQuickCommunication(
                      "escalation",
                      `Opened email client with formal Escalation Letter addressed to ${issue?.company}`
                    )
                  }
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition min-h-[40px]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Email Client</span>
                </a>

                <button
                  onClick={handleCopyLetter}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm min-h-[40px]"
                >
                  {copiedLetter ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Letter Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Letter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete complaint confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-floating space-y-4">
            <div className="text-center space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">Delete this complaint?</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will permanently remove the complaint, all updates, and any uploaded files. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Keep It
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 rounded p-1 hover:bg-white/20 transition"
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
