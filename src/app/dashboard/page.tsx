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
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
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

  // Groupings based on Attention Hierarchy
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
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Issue Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Attention-first follow-up tracker for unresolved service issues
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Issue</span>
          </Link>
        </div>
      </div>

      {/* Attention-First Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 my-6">
        {/* Overdue (Highest visual priority) */}
        <button
          onClick={() => setActiveTab("overdue")}
          className={`text-left rounded-xl p-4 transition border ${
            overdueIssues.length > 0
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200"
          } ${activeTab === "overdue" ? "ring-2 ring-rose-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Overdue</span>
            <AlertTriangle className={`h-4 w-4 ${overdueIssues.length > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{overdueIssues.length}</div>
          <div className="text-[11px] text-rose-600/80 font-medium mt-0.5">Promised SLA passed</div>
        </button>

        {/* Action Needed */}
        <button
          onClick={() => setActiveTab("action")}
          className={`text-left rounded-xl p-4 transition border ${
            actionNeededIssues.length > 0
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200"
          } ${activeTab === "action" ? "ring-2 ring-amber-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Action Needed</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{actionNeededIssues.length}</div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-0.5">Your action required</div>
        </button>

        {/* Due Soon */}
        <button
          onClick={() => setActiveTab("attention")}
          className={`text-left rounded-xl p-4 transition border bg-white border-slate-200 hover:border-slate-300`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Due Soon</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{dueSoonIssues.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Within 48 hours</div>
        </button>

        {/* Waiting */}
        <button
          onClick={() => setActiveTab("all")}
          className="text-left rounded-xl p-4 bg-white border border-slate-200 hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Waiting</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">{waitingIssues.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting provider</div>
        </button>

        {/* Resolved / Closed */}
        <button
          onClick={() => setActiveTab("resolved")}
          className={`text-left rounded-xl p-4 transition border col-span-2 sm:col-span-1 ${
            activeTab === "resolved" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{resolvedIssues.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Archived history</div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("attention")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "attention"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Attention Hierarchy (Recommended)
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "overdue"
              ? "bg-rose-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Overdue ({overdueIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("action")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "action"
              ? "bg-amber-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Action Needed ({actionNeededIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Active ({totalActive})
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "resolved"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Resolved ({resolvedIssues.length})
        </button>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No issues tracked yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Create an issue manually or paste a messy WhatsApp message to extract structured fields.
          </p>
          <Link
            href="/issues/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Create Your First Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "attention" && (
            <>
              {/* Section 1: OVERDUE ISSUES (Top Priority) */}
              {overdueIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-rose-700">
                      1. Overdue Issues — Immediate Attention Required ({overdueIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {overdueIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: ACTION NEEDED */}
              {actionNeededIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800">
                      2. Action Needed — You Need to Take Action ({actionNeededIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {actionNeededIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: DUE SOON */}
              {dueSoonIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-blue-800">
                      3. Due Soon — Approaching Promised Date ({dueSoonIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {dueSoonIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: WAITING / OTHER OPEN */}
              {(waitingIssues.length > 0 || otherOpenIssues.length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      4. In Progress / Waiting on Provider ({waitingIssues.length + otherOpenIssues.length})
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {[...waitingIssues, ...otherOpenIssues].map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: RESOLVED PREVIEW */}
              {resolvedIssues.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Recently Resolved / Closed ({resolvedIssues.length})
                    </h2>
                    <button
                      onClick={() => setActiveTab("resolved")}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View all resolved →
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {resolvedIssues.slice(0, 2).map((issue) => (
                      <IssueCard key={issue.id} issue={issue} compact />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "overdue" && (
            <div className="grid gap-3">
              {overdueIssues.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No overdue issues! All service promises are on track.
                </div>
              ) : (
                overdueIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          )}

          {activeTab === "action" && (
            <div className="grid gap-3">
              {actionNeededIssues.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No items requiring your action right now.
                </div>
              ) : (
                actionNeededIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          )}

          {activeTab === "all" && (
            <div className="grid gap-3">
              {[...overdueIssues, ...actionNeededIssues, ...dueSoonIssues, ...waitingIssues, ...otherOpenIssues].map(
                (issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                )
              )}
            </div>
          )}

          {activeTab === "resolved" && (
            <div className="grid gap-3">
              {resolvedIssues.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
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
        return <span className="rounded bg-slate-100 text-slate-800 px-2 py-0.5 text-[11px] font-semibold">Open</span>;
      case "waiting":
        return <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 text-[11px] font-semibold">Waiting</span>;
      case "action_needed":
        return <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-semibold">Action Needed</span>;
      case "resolved":
        return <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-semibold">Resolved</span>;
      case "closed":
        return <span className="rounded bg-slate-200 text-slate-700 px-2 py-0.5 text-[11px] font-semibold">Closed</span>;
    }
  };

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={`group block rounded-xl border bg-white transition hover:shadow-md ${
        issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
          ? "border-rose-300 hover:border-rose-400 ring-1 ring-rose-200"
          : "border-slate-200 hover:border-indigo-300"
      } p-4 sm:p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {issue.company}
          </span>
          {issue.referenceNo && (
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              #{issue.referenceNo}
            </span>
          )}
          <span className="capitalize text-xs text-slate-400 font-medium">
            {issue.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {issue.isOverdue && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
              <AlertTriangle className="h-3 w-3" />
              {issue.attentionLabel}
            </span>
          )}
          {!issue.isOverdue && issue.isDueSoon && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
              <Clock className="h-3 w-3" />
              {issue.attentionLabel}
            </span>
          )}
          {getStatusBadge(issue.status)}
        </div>
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-4">
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
        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
      </div>

      {!compact && issue.nextAction && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 text-xs text-amber-900">
          <span className="font-bold text-[10px] uppercase text-amber-700 shrink-0">Next Action:</span>
          <span className="truncate font-medium">{issue.nextAction}</span>
        </div>
      )}

      {!compact && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {issue.expectedDate ? `Expected: ${issue.expectedDate}` : `Created: ${issue.createdAt.split("T")[0]}`}
            </span>
          </div>
          <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
        </div>
      )}
    </Link>
  );
}
