"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  PlusCircle,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Inbox,
} from "lucide-react";
import { IssueCategory, IssueStatus } from "@/lib/types";

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
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"attention" | "all" | "overdue" | "action" | "resolved">("attention");

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data?.issues) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const overdueIssues = issues.filter((i) => i.isOverdue && i.status !== "resolved" && i.status !== "closed");
  const actionNeededIssues = issues.filter(
    (i) => i.status === "action_needed" && !i.isOverdue
  );
  const dueSoonIssues = issues.filter(
    (i) => i.isDueSoon && !i.isOverdue && i.status !== "resolved" && i.status !== "closed"
  );
  const waitingIssues = issues.filter(
    (i) => i.status === "waiting" && !i.isOverdue && !i.isDueSoon
  );
  const otherOpenIssues = issues.filter(
    (i) => i.status === "open" && !i.isOverdue && !i.isDueSoon
  );
  const resolvedIssues = issues.filter((i) => i.status === "resolved" || i.status === "closed");

  const totalActive = issues.length - resolvedIssues.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Service Dashboard
            </h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
              {totalActive} active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prioritized by SLA urgency: overdue promises and required actions surfaced first
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-subtle transition"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-card hover:bg-slate-800 transition active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4 text-indigo-400" />
            <span>New Issue</span>
          </Link>
        </div>
      </div>

      {/* Attention-First Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 my-6">
        {/* Overdue */}
        <button
          onClick={() => setActiveTab("overdue")}
          className={`text-left rounded-2xl p-4 transition-all border ${
            overdueIssues.length > 0
              ? "bg-gradient-to-br from-rose-50/90 to-rose-100/40 border-rose-200 shadow-sm ring-1 ring-rose-300/50"
              : "bg-white border-slate-200/80 shadow-card"
          } ${activeTab === "overdue" ? "ring-2 ring-rose-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Overdue</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-200/80 text-rose-700">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-700">{overdueIssues.length}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Immediate action</div>
        </button>

        {/* Action Needed */}
        <button
          onClick={() => setActiveTab("action")}
          className={`text-left rounded-2xl p-4 transition-all border ${
            actionNeededIssues.length > 0
              ? "bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-amber-200 shadow-sm ring-1 ring-amber-300/50"
              : "bg-white border-slate-200/80 shadow-card"
          } ${activeTab === "action" ? "ring-2 ring-amber-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Action Needed</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/80 text-amber-700">
              <AlertCircle className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-700">{actionNeededIssues.length}</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-1">Waiting on you</div>
        </button>

        {/* Due Soon */}
        <button
          onClick={() => setActiveTab("attention")}
          className="text-left rounded-2xl p-4 bg-white border border-slate-200/80 shadow-card hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Due Soon</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Clock className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-sky-700">{dueSoonIssues.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">Within 48 hours</div>
        </button>

        {/* Waiting */}
        <button
          onClick={() => setActiveTab("all")}
          className="text-left rounded-2xl p-4 bg-white border border-slate-200/80 shadow-card hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Waiting</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Clock className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-800">{waitingIssues.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">On provider</div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => setActiveTab("resolved")}
          className={`text-left rounded-2xl p-4 transition-all border col-span-2 sm:col-span-1 ${
            activeTab === "resolved" ? "bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-500" : "bg-white border-slate-200/80 shadow-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700">{resolvedIssues.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">Archived</div>
        </button>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-slate-200/60 p-1.5 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("attention")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "attention"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Urgency Hierarchy (Recommended)
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "overdue"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Overdue ({overdueIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("action")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "action"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Action Needed ({actionNeededIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Active ({totalActive})
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "resolved"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Resolved ({resolvedIssues.length})
        </button>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium">Loading records...</div>
      ) : issues.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No complaints or issues tracked</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an issue manually or paste a messy customer service message to extract structured fields.
          </p>
          <Link
            href="/issues/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-card hover:bg-slate-800"
          >
            Create First Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "attention" && (
            <>
              {/* Section 1: OVERDUE ISSUES */}
              {overdueIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                      1. Overdue SLA Breaches ({overdueIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3.5">
                    {overdueIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: ACTION NEEDED */}
              {actionNeededIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      2. Action Needed by You ({actionNeededIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3.5">
                    {actionNeededIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: DUE SOON */}
              {dueSoonIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                      3. Approaching Promised Dates ({dueSoonIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3.5">
                    {dueSoonIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: WAITING / OTHER OPEN */}
              {(waitingIssues.length > 0 || otherOpenIssues.length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. In Progress / Awaiting Provider ({waitingIssues.length + otherOpenIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3.5">
                    {[...waitingIssues, ...otherOpenIssues].map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: RESOLVED PREVIEW */}
              {resolvedIssues.length > 0 && (
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Archived / Resolved ({resolvedIssues.length})
                    </h2>
                    <button
                      onClick={() => setActiveTab("resolved")}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                    >
                      View all archived →
                    </button>
                  </div>
                  <div className="grid gap-2.5">
                    {resolvedIssues.slice(0, 2).map((issue) => (
                      <IssueCard key={issue.id} issue={issue} compact />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "overdue" && (
            <div className="grid gap-3.5">
              {overdueIssues.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  No overdue issues! All service promises are on track.
                </div>
              ) : (
                overdueIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          )}

          {activeTab === "action" && (
            <div className="grid gap-3.5">
              {actionNeededIssues.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  No items requiring your action right now.
                </div>
              ) : (
                actionNeededIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          )}

          {activeTab === "all" && (
            <div className="grid gap-3.5">
              {[...overdueIssues, ...actionNeededIssues, ...dueSoonIssues, ...waitingIssues, ...otherOpenIssues].map(
                (issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                )
              )}
            </div>
          )}

          {activeTab === "resolved" && (
            <div className="grid gap-3.5">
              {resolvedIssues.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  No resolved issues yet.
                </div>
              ) : (
                resolvedIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, compact = false }: { issue: IssueItem; compact?: boolean }) {
  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "open":
        return <span className="rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 text-[10px] font-bold">Open</span>;
      case "waiting":
        return <span className="rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-[10px] font-bold">Waiting</span>;
      case "action_needed":
        return <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold">Action Needed</span>;
      case "resolved":
        return <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">Resolved</span>;
      case "closed":
        return <span className="rounded-full bg-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold">Closed</span>;
    }
  };

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={`group block rounded-2xl border bg-white/95 transition-all hover:shadow-elevated ${
        issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
          ? "border-rose-300/90 ring-1 ring-rose-200 hover:border-rose-400"
          : "border-slate-200/80 hover:border-indigo-300"
      } p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80">
            {issue.company}
          </span>
          {issue.referenceNo && (
            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
              #{issue.referenceNo}
            </span>
          )}
          <span className="capitalize text-xs text-slate-400 font-medium">
            {issue.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {issue.isOverdue && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              <AlertTriangle className="h-3 w-3" />
              {issue.attentionLabel}
            </span>
          )}
          {!issue.isOverdue && issue.isDueSoon && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
              <Clock className="h-3 w-3" />
              {issue.attentionLabel}
            </span>
          )}
          {getStatusBadge(issue.status)}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
            {issue.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          )}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition shrink-0 mt-0.5">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {!compact && issue.nextAction && (
        <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/80 px-3.5 py-2 text-xs text-amber-950">
          <span className="font-bold text-[10px] uppercase text-amber-700 shrink-0">Next Action:</span>
          <span className="truncate font-semibold">{issue.nextAction}</span>
        </div>
      )}

      {!compact && (
        <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {issue.expectedDate ? `Promised: ${issue.expectedDate}` : `Created: ${issue.createdAt.split("T")[0]}`}
            </span>
          </div>
          <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
        </div>
      )}
    </Link>
  );
}
