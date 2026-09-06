"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit3,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { IssueCategory, IssueStatus } from "@/lib/types";
import { ALLOWED_TRANSITIONS } from "@/lib/lifecycle";

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
  const [copiedAction, setCopiedAction] = useState(false);

  // New Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventType, setEventType] = useState("note");
  const [eventBody, setEventBody] = useState("");
  const [loggingEvent, setLoggingEvent] = useState(false);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Upload attachment state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit issue mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editNextAction, setEditNextAction] = useState("");
  const [editExpectedDate, setEditExpectedDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
        setError("Issue not found or you do not have permission to view it.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data?.issue) {
        setIssue(data.issue);
        setEditNextAction(data.issue.nextAction || "");
        setEditExpectedDate(data.issue.expectedDate || "");
        setEditNotes(data.issue.notes || "");
      }
    } catch {
      setError("Failed to load issue details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: "ref" | "action") => {
    navigator.clipboard.writeText(text);
    if (type === "ref") {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedAction(true);
      setTimeout(() => setCopiedAction(false), 2000);
    }
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || newStatus === issue.status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to update status");
      } else {
        await fetchIssue();
      }
    } catch {
      alert("Network error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventBody.trim()) return;

    setLoggingEvent(true);
    try {
      const res = await fetch(`/api/issues/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          body: eventBody.trim(),
        }),
      });

      if (res.ok) {
        setEventBody("");
        setShowEventForm(false);
        await fetchIssue();
      } else {
        const d = await res.json();
        alert(d.error?.message || "Failed to log event");
      }
    } catch {
      alert("Network error logging event");
    } finally {
      setLoggingEvent(false);
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
        setIsEditing(false);
        await fetchIssue();
      } else {
        const d = await res.json();
        alert(d.error?.message || "Failed to update issue");
      }
    } catch {
      alert("Network error saving edits");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this issue and its timeline?")) {
      return;
    }

    try {
      const res = await fetch(`/api/issues/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to delete issue");
      }
    } catch {
      alert("Network error deleting issue");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/issues/${id}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error?.message || "File upload failed");
      } else {
        await fetchIssue();
      }
    } catch {
      setUploadError("Upload network error");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-xs text-slate-400 font-medium">
        Loading issue history...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 text-xs font-semibold shadow-card">
          {error || "Issue not found"}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[issue.status] || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-indigo-600" />;
      case "status_change":
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
      case "escalation":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "promise_updated":
        return <Clock className="h-4 w-4 text-emerald-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-subtle transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-400" />
            <span>{isEditing ? "Done Editing" : "Edit Details"}</span>
          </button>
          <button
            onClick={handleDelete}
            title="Delete Issue"
            className="rounded-xl border border-rose-200/80 bg-white p-2 text-rose-600 hover:bg-rose-50 shadow-subtle transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overdue Attention Banner */}
      {issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed" && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-rose-50/70 to-white p-5 text-rose-900 shadow-card flex items-start gap-3.5">
          <div className="rounded-xl bg-rose-600 p-2.5 text-white shrink-0 mt-0.5 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-950">
              Resolution Target Overdue ({issue.attentionLabel})
            </h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              The promised action date was {issue.expectedDate}. Please escalate to a nodal officer or
              grievance cell at {issue.company}.
            </p>
          </div>
        </div>
      )}

      {/* Main Issue Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                {issue.company}
              </span>
              <span className="capitalize text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                {issue.category}
              </span>
              {issue.referenceNo && (
                <button
                  onClick={() => handleCopy(issue.referenceNo!, "ref")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition"
                  title="Click to copy reference number"
                >
                  <span>#{issue.referenceNo}</span>
                  {copiedRef ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                </button>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {issue.title}
            </h1>
          </div>

          {/* Lifecycle Status Switcher */}
          <div className="shrink-0 flex flex-col sm:items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Current Lifecycle
            </span>
            <select
              value={issue.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-subtle transition"
            >
              <option value={issue.status}>
                ● {issue.status.toUpperCase()} (Current)
              </option>
              {allowedStatuses.map((st) => (
                <option key={st} value={st}>
                  → Transition to {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Immediate Next Action Banner */}
        {(issue.nextAction || isEditing) && (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-amber-50/40 p-4 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Immediate Next Step
              </span>
              {issue.nextAction && !isEditing && (
                <button
                  onClick={() => handleCopy(issue.nextAction!, "action")}
                  className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                >
                  {copiedAction ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Next Step
                    </>
                  )}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <input
                  type="text"
                  value={editNextAction}
                  onChange={(e) => setEditNextAction(e.target.value)}
                  placeholder="e.g. Call nodal officer if technician doesn't arrive by 2 PM"
                  className="w-full rounded-xl border border-amber-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            ) : (
              <p className="mt-1.5 text-xs sm:text-sm font-bold text-amber-950">
                {issue.nextAction}
              </p>
            )}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-xl bg-slate-50/60 p-3.5 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Promised Date / SLA
            </div>
            {isEditing ? (
              <input
                type="date"
                value={editExpectedDate}
                onChange={(e) => setEditExpectedDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-800"
              />
            ) : (
              <div className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>{issue.expectedDate || "No target date set"}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50/60 p-3.5 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created On</div>
            <div className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/60 p-3.5 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Activity</div>
            <div className="mt-1 text-xs font-bold text-slate-800">
              {new Date(issue.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {issue.description}
          </p>
        </div>

        {/* Notes */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Private Notes & Reference Details
          </h3>
          {isEditing ? (
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/40 p-3 rounded-xl border border-slate-100">
              {issue.notes || "No private notes added yet."}
            </p>
          )}
        </div>

        {/* Save Edits button */}
        {isEditing && (
          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Chronological Event Timeline */}
      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Resolution Timeline ({issue.events.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of customer calls, emails, and promises
            </p>
          </div>

          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-subtle transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Event</span>
          </button>
        </div>

        {/* Add Event Form */}
        {showEventForm && (
          <form onSubmit={handleAddEvent} className="mb-6 rounded-2xl border border-indigo-200/80 bg-slate-50/70 p-5 space-y-3.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Log New Communication or Escalation
              </span>
              <button
                type="button"
                onClick={() => setShowEventForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="call">Phone Call with Support</option>
                <option value="email">Email Sent / Received</option>
                <option value="note">Internal Note / Observation</option>
                <option value="promise_updated">Promise / Date Update</option>
                <option value="technician_visit">Technician Visit</option>
                <option value="escalation">Escalation to Nodal / Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Event Summary / Notes
              </label>
              <textarea
                rows={2}
                required
                value={eventBody}
                onChange={(e) => setEventBody(e.target.value)}
                placeholder="What occurred? (e.g. Spoke to agent Vikram, ticket escalated to Level 2)"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loggingEvent}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {loggingEvent ? "Logging..." : "Add to Timeline"}
              </button>
            </div>
          </form>
        )}

        {/* Timeline Events Feed */}
        {issue.events.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No events logged yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {issue.events.map((evt) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-indigo-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 capitalize">
                    {getEventIcon(evt.eventType)}
                    <span>{evt.eventType.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(evt.eventAt).toLocaleString()}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {evt.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachments Section */}
      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Attachments ({issue.attachments.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoices, repair job sheets, and support screenshots (max 5MB)
            </p>
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-subtle transition">
            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
            <span>{uploadingFile ? "Uploading..." : "Upload File"}</span>
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
          <div className="mb-4 text-xs text-rose-600 font-semibold">{uploadError}</div>
        )}

        {issue.attachments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No files attached to this issue.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {issue.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {att.filename}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round(att.size / 1024)} KB • {new Date(att.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <a
                  href={att.storagePath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition shrink-0"
                  title="View attachment"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
