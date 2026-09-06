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
  Plus,
  Phone,
  Mail,
  FileText,
  Paperclip,
  Trash2,
  Edit3,
  ExternalLink,
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

  // Add event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventType, setEventType] = useState("call");
  const [eventBody, setEventBody] = useState("");
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
        setIssue(data.issue);
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
        await fetchIssue();
      } else {
        const d = await res.json();
        alert(d.error?.message || "Failed to update status");
      }
    } catch {
      alert("Network error updating status");
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
        body: JSON.stringify({ eventType, body: eventBody.trim() }),
      });

      if (res.ok) {
        setEventBody("");
        setShowEventForm(false);
        await fetchIssue();
      } else {
        const d = await res.json();
        alert(d.error?.message || "Failed to add event");
      }
    } catch {
      alert("Network error adding event");
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
        alert(d.error?.message || "Failed to save edits");
      }
    } catch {
      alert("Network error saving edits");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

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
        setUploadError(data.error?.message || "Upload failed");
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
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-xs text-slate-400">
        Loading issue...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-700">{error || "Issue not found."}</p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-xs font-semibold text-slate-900 underline"
        >
          Return to Issues
        </Link>
      </div>
    );
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[issue.status] || [];

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Issues
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            title="Delete Issue"
            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Overdue alert if applicable */}
      {issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed" && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{issue.attentionLabel}. </span>
            <span>Follow up with {issue.company} regarding promised date {issue.expectedDate}.</span>
          </div>
        </div>
      )}

      {/* Main Issue Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* Company, Status, and Ref */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {issue.company}
            </span>
            {issue.referenceNo && (
              <button
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition"
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

          {/* Status Changer */}
          <select
            value={issue.status}
            onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 capitalize"
          >
            <option value={issue.status}>{issue.status.replace("_", " ")}</option>
            {allowedStatuses.map((st) => (
              <option key={st} value={st}>
                Mark {st.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-3">
          {issue.title}
        </h1>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
          {issue.description}
        </p>

        {/* Next Step Banner */}
        {(issue.nextAction || isEditing) && (
          <div className="mt-3 rounded-lg bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900">
            <div className="font-bold mb-0.5">Next step:</div>
            {isEditing ? (
              <input
                type="text"
                value={editNextAction}
                onChange={(e) => setEditNextAction(e.target.value)}
                placeholder="What needs to happen next?"
                className="w-full rounded-md border border-amber-300 p-1.5 text-xs text-slate-900 bg-white mt-1"
              />
            ) : (
              <p className="font-medium">{issue.nextAction}</p>
            )}
          </div>
        )}

        {/* Metadata info */}
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Promised Date:</span>
            {isEditing ? (
              <input
                type="date"
                value={editExpectedDate}
                onChange={(e) => setEditExpectedDate(e.target.value)}
                className="rounded border border-slate-200 p-1 text-xs text-slate-800 mt-0.5"
              />
            ) : (
              <span className="font-semibold text-slate-800">
                {issue.expectedDate || "None set"}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Created:</span>
            <span className="font-semibold text-slate-800">
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Private Notes */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 block text-[11px] mb-1">Notes:</span>
          {isEditing ? (
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded border border-slate-200 p-1.5 text-xs text-slate-900"
            />
          ) : (
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {issue.notes || "No notes added."}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
            >
              {savingEdit ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Activity & Updates ({issue.events.length})
          </h2>

          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 transition"
          >
            + Add Note
          </button>
        </div>

        {/* Add event form */}
        {showEventForm && (
          <form onSubmit={handleAddEvent} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Log a phone call or update</span>
              <button
                type="button"
                onClick={() => setShowEventForm(false)}
                className="text-slate-400 hover:text-slate-600 font-normal"
              >
                Cancel
              </button>
            </div>

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800"
            >
              <option value="call">Phone Call with Support</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
              <option value="promise_updated">Date/Promise Updated</option>
              <option value="escalation">Escalation</option>
            </select>

            <textarea
              rows={2}
              required
              value={eventBody}
              onChange={(e) => setEventBody(e.target.value)}
              placeholder="What happened? (e.g. Called customer care, technician re-booked for Friday)"
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loggingEvent}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                {loggingEvent ? "Saving..." : "Save Note"}
              </button>
            </div>
          </form>
        )}

        {/* Feed */}
        {issue.events.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-4">No activity logged yet.</p>
        ) : (
          <div className="space-y-3">
            {issue.events.map((evt) => (
              <div key={evt.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-slate-700 capitalize">
                    {evt.eventType.replace("_", " ")}
                  </span>
                  <span>{new Date(evt.eventAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{evt.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachments Section */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Files & Invoices ({issue.attachments.length})
          </h2>

          <label className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
            <span>{uploadingFile ? "Uploading..." : "+ Attach File"}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="hidden"
              accept="image/*,.pdf,.txt"
            />
          </label>
        </div>

        {uploadError && <p className="text-xs text-rose-600 mb-2">{uploadError}</p>}

        {issue.attachments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-3">No files attached.</p>
        ) : (
          <div className="space-y-2">
            {issue.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-xs"
              >
                <div className="truncate">
                  <span className="font-semibold text-slate-800 block truncate">{att.filename}</span>
                  <span className="text-[10px] text-slate-400">{Math.round(att.size / 1024)} KB</span>
                </div>
                <a
                  href={att.storagePath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
