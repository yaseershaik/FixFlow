"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  ChevronRight,
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
  const [filter, setFilter] = useState<"all" | "overdue" | "action" | "waiting" | "resolved">("all");

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

  const overdue = issues.filter((i) => i.isOverdue && i.status !== "resolved" && i.status !== "closed");
  const actionNeeded = issues.filter((i) => i.status === "action_needed" && !i.isOverdue);
  const waiting = issues.filter((i) => i.status === "waiting" && !i.isOverdue);
  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed");

  const displayedIssues = issues.filter((i) => {
    if (filter === "overdue") return i.isOverdue && i.status !== "resolved" && i.status !== "closed";
    if (filter === "action") return i.status === "action_needed" && !i.isOverdue;
    if (filter === "waiting") return i.status === "waiting" && !i.isOverdue;
    if (filter === "resolved") return i.status === "resolved" || i.status === "closed";
    return i.status !== "resolved" && i.status !== "closed"; // "all" active
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Issues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {issues.length - resolved.length} active service complaints
          </p>
        </div>

        <Link
          href="/issues/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Issue</span>
        </Link>
      </div>

      {/* Clean Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Active ({issues.length - resolved.length})
        </button>
        {overdue.length > 0 && (
          <button
            onClick={() => setFilter("overdue")}
            className={`rounded-full px-3.5 py-1.5 font-medium transition flex items-center gap-1.5 ${
              filter === "overdue"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <span>Overdue</span>
            <span className="rounded-full bg-rose-200/80 px-1.5 py-0.2 text-[10px] font-bold">
              {overdue.length}
            </span>
          </button>
        )}
        <button
          onClick={() => setFilter("action")}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            filter === "action"
              ? "bg-amber-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Needs Action ({actionNeeded.length})
        </button>
        <button
          onClick={() => setFilter("waiting")}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            filter === "waiting"
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Waiting ({waiting.length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            filter === "resolved"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Resolved ({resolved.length})
        </button>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading issues...
        </div>
      ) : displayedIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Inbox className="h-6 w-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No issues in this view</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {filter !== "all" ? "Try switching to Active issues." : "Add your first complaint or repair."}
          </p>
          {filter === "all" && (
            <Link
              href="/issues/new"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add an Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedIssues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className={`block rounded-2xl border bg-white p-4 transition active:bg-slate-50 ${
                issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed"
                  ? "border-rose-300 ring-1 ring-rose-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Card Header: Company, Reference, Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {issue.company}
                  </span>
                  {issue.referenceNo && (
                    <span className="font-mono text-xs text-slate-400">
                      #{issue.referenceNo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {issue.isOverdue && issue.status !== "resolved" && issue.status !== "closed" && (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {issue.attentionLabel}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      issue.status === "action_needed"
                        ? "bg-amber-100 text-amber-800"
                        : issue.status === "waiting"
                        ? "bg-sky-50 text-sky-700"
                        : issue.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-2">
                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {issue.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {/* Next Action Callout */}
              {issue.nextAction && (
                <div className="mt-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 px-2.5 py-1.5 text-xs text-amber-900">
                  <span className="font-bold text-[11px]">Next: </span>
                  <span>{issue.nextAction}</span>
                </div>
              )}

              {/* Card Footer: Target date */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {issue.expectedDate
                      ? `Promised: ${issue.expectedDate}`
                      : `Logged: ${issue.createdAt.split("T")[0]}`}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-slate-500 font-medium">
                  <span>View details</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
