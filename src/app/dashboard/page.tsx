"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Inbox,
  CheckCircle2,
  Hourglass,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { IssueCategory, IssueStatus } from "@/lib/types";
import NotificationBanner from "@/components/NotificationBanner";
import { sendBrowserNotification } from "@/lib/notifications";
import { useAuth } from "@/components/AuthProvider";

interface IssueItem {
  id: string;
  title: string;
  company: string;
  category: IssueCategory;
  referenceNo: string | null;
  description: string;
  status: IssueStatus;
  expectedDate: string | null;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysRemaining: number | null;
  attentionPriority: number;
  attentionLabel: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isDemo, refreshStats } = useAuth();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "action" | "waiting" | "resolved">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resettingDemo, setResettingDemo] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleResetDemo = async () => {
    setResettingDemo(true);
    try {
      await fetch("/api/auth/demo", { method: "PUT" });
      await fetchIssues();
    } catch (e) {
      console.error("Failed to reset demo:", e);
    } finally {
      setResettingDemo(false);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/issues");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFetchError(data?.error?.message || "Failed to load complaints");
        return;
      }
      if (data?.issues) {
        setIssues(data.issues);
        refreshStats();

        // Check if there are overdue items and send native browser notification if granted
        const overdueList = data.issues.filter(
          (i: IssueItem) => i.isOverdue && i.status !== "resolved" && i.status !== "closed"
        );
        if (overdueList.length > 0 && typeof window !== "undefined") {
          const alreadyAlerted = sessionStorage.getItem("fixflow_overdue_notified");
          if (!alreadyAlerted) {
            sendBrowserNotification(
              `FixFlow: ${overdueList.length} Issue${overdueList.length === 1 ? "" : "s"} Overdue`,
              `${overdueList[0].company}: Promised deadline has passed. Click to follow up.`
            );
            sessionStorage.setItem("fixflow_overdue_notified", "true");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
      setFetchError("Unable to connect to the server. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = (e: React.MouseEvent, refNo: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(refNo).catch(() => {});
    }
    setCopiedId(refNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const overdue = issues.filter((i) => i.isOverdue && i.status !== "resolved" && i.status !== "closed");
  const actionNeeded = issues.filter((i) => i.status === "action_needed" && !i.isOverdue);
  const waiting = issues.filter((i) => i.status === "waiting" && !i.isOverdue);
  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed");
  const activeCount = issues.length - resolved.length;

  const displayedIssues = issues.filter((i) => {
    if (filter === "overdue") return i.isOverdue && i.status !== "resolved" && i.status !== "closed";
    if (filter === "action") return i.status === "action_needed" && !i.isOverdue;
    if (filter === "waiting") return i.status === "waiting" && !i.isOverdue;
    if (filter === "resolved") return i.status === "resolved" || i.status === "closed";
    return i.status !== "resolved" && i.status !== "closed"; // "all" active
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Optional Notification Permission Prompt Banner */}
      <NotificationBanner />

      {/* Demo Sandbox Alert Banner */}
      {isDemo && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 border border-amber-200/90 p-4 sm:p-5 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <span>Demo Sandbox Mode</span>
                <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                  Temporary Data
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                You can test adding, editing, and resolving complaints freely. This shared demo account automatically resets so your test data will not be saved permanently.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleResetDemo}
              disabled={resettingDemo}
              className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/60 disabled:opacity-50 transition shadow-2xs"
            >
              {resettingDemo ? "Resetting..." : "Reset to Initial 5"}
            </button>
            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Complaints & Follow-ups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeCount === 0
              ? "All your complaints are resolved!"
              : `${activeCount} active complaint${activeCount === 1 ? "" : "s"} under follow-up`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/issues/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Track New Complaint</span>
          </Link>
        </div>
      </div>

      {/* Stat / Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {/* All Active */}
        <button
          onClick={() => setFilter("all")}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
            filter === "all"
              ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Active</span>
            <Inbox className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{activeCount}</span>
            <span className="text-[11px] text-slate-400">in progress</span>
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => setFilter("overdue")}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
            filter === "overdue"
              ? "bg-rose-50 border-rose-600 shadow-md ring-2 ring-rose-600/20"
              : overdue.length > 0
              ? "bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${overdue.length > 0 ? "text-rose-700" : "text-slate-600"}`}>
              Overdue
            </span>
            <AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? "text-rose-600" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-bold ${overdue.length > 0 ? "text-rose-700" : "text-slate-900"}`}>
              {overdue.length}
            </span>
            <span className={`text-[11px] ${overdue.length > 0 ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
              deadline passed
            </span>
          </div>
        </button>

        {/* Needs Action */}
        <button
          onClick={() => setFilter("action")}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
            filter === "action"
              ? "bg-amber-50 border-amber-600 shadow-md ring-2 ring-amber-600/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Action Needed</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{actionNeeded.length}</span>
            <span className="text-[11px] text-slate-400">your turn to reply</span>
          </div>
        </button>

        {/* Waiting on Company */}
        <button
          onClick={() => setFilter("waiting")}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
            filter === "waiting"
              ? "bg-sky-50 border-sky-600 shadow-md ring-2 ring-sky-600/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Waiting</span>
            <Hourglass className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{waiting.length}</span>
            <span className="text-[11px] text-slate-400">on company</span>
          </div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => setFilter("resolved")}
          className={`col-span-2 sm:col-span-1 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
            filter === "resolved"
              ? "bg-emerald-50 border-emerald-600 shadow-md ring-2 ring-emerald-600/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{resolved.length}</span>
            <span className="text-[11px] text-slate-400">closed</span>
          </div>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-2 font-semibold transition shrink-0 min-h-[36px] ${
            filter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          All Active ({activeCount})
        </button>
        {overdue.length > 0 && (
          <button
            onClick={() => setFilter("overdue")}
            className={`rounded-xl px-3.5 py-2 font-semibold transition shrink-0 min-h-[36px] flex items-center gap-1.5 ${
              filter === "overdue"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <span>Overdue</span>
            <span className="rounded-full bg-rose-200/90 text-rose-800 px-1.5 py-0.2 text-[10px] font-bold">
              {overdue.length}
            </span>
          </button>
        )}
        <button
          onClick={() => setFilter("action")}
          className={`rounded-xl px-3.5 py-2 font-semibold transition shrink-0 min-h-[36px] ${
            filter === "action"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Needs Action ({actionNeeded.length})
        </button>
        <button
          onClick={() => setFilter("waiting")}
          className={`rounded-xl px-3.5 py-2 font-semibold transition shrink-0 min-h-[36px] ${
            filter === "waiting"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Waiting on Company ({waiting.length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`rounded-xl px-3.5 py-2 font-semibold transition shrink-0 min-h-[36px] ${
            filter === "resolved"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Resolved ({resolved.length})
        </button>
      </div>

      {/* Issues Grid */}
      {fetchError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-rose-900">Failed to load complaints</h2>
          <p className="text-xs text-rose-600 max-w-sm mx-auto">{fetchError}</p>
          <button
            onClick={fetchIssues}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Retry Loading
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading your complaints...
        </div>
      ) : displayedIssues.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">No complaints found</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {filter !== "all"
              ? "There are no complaints matching this filter status."
              : "Track your first appliance repair, delayed refund, or service issue."}
          </p>
          {filter === "all" ? (
            <Link
              href="/issues/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Track First Complaint</span>
            </Link>
          ) : (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              View all active complaints
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {displayedIssues.map((issue) => (
            <div
              key={issue.id}
              className={`relative group flex flex-col justify-between rounded-3xl border bg-white p-5 transition-all ${
                issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
                  ? "border-rose-300 ring-1 ring-rose-200/70 shadow-xs hover:shadow-card hover:border-rose-400"
                  : "border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-card"
              }`}
            >
              {/* Full-card link */}
              <Link
                href={`/issues/${issue.id}`}
                className="absolute inset-0 z-0 rounded-3xl"
                aria-label={`View complaint details for ${issue.title}`}
              />

              <div className="relative z-10 pointer-events-none">
                {/* Header: Company, Reference #, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                    <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg truncate max-w-[140px] sm:max-w-[200px]">
                      {issue.company}
                    </span>
                    {issue.referenceNo && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyRef(e, issue.referenceNo!)}
                        title="Click to copy reference number"
                        aria-label={`Copy reference number ${issue.referenceNo}`}
                        className="pointer-events-auto inline-flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 transition max-w-[130px] sm:max-w-[180px] truncate"
                      >
                        <span className="truncate">#{issue.referenceNo}</span>
                        {copiedId === issue.referenceNo ? (
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed" && (
                      <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Overdue ({Math.abs(issue.daysRemaining || 0)}d)
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize border ${
                        issue.status === "action_needed"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : issue.status === "waiting"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : issue.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {issue.status === "waiting"
                        ? "Waiting on Company"
                        : issue.status === "action_needed"
                        ? "Action Needed"
                        : issue.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-3">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {issue.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Next Action Callout */}
                {issue.nextAction && (
                  <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
                    <span className="font-bold text-[10px] uppercase tracking-wide text-amber-800">
                      Next Step:{" "}
                    </span>
                    <span>{issue.nextAction}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Target date + View link */}
              <div className="relative z-10 pointer-events-none mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span
                    className={
                      issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
                        ? "font-semibold text-rose-600"
                        : "text-slate-500"
                    }
                  >
                    {issue.expectedDate
                      ? `Promised by: ${issue.expectedDate}`
                      : `Logged on: ${issue.createdAt.split("T")[0]}`}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs group-hover:text-indigo-600 transition-colors">
                  <span>Take Action</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
