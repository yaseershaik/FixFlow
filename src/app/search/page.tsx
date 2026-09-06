"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronRight,
  Building2,
  X,
} from "lucide-react";
import { IssueCategory, IssueStatus } from "@/lib/types";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    executeSearch();
  }, [category, status]);

  const executeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data?.issues) {
        setResults(data.issues);
      }
    } catch {
      console.error("Search error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Search & Filter</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Find any past or active service complaint by reference #, company, or problem
        </p>
      </div>

      {/* Search Input and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <form onSubmit={executeSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company (Samsung), reference # (548921), keyword (cooling)..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTimeout(executeSearch, 0);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="warranty">Appliance & Warranty</option>
            <option value="refund">Refunds & Payments</option>
            <option value="delivery">Courier & Delivery</option>
            <option value="telecom">Broadband & Telecom</option>
            <option value="banking">Banking & Cards</option>
            <option value="education">Education</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>

          <div className="flex items-center gap-1.5 font-semibold text-slate-700 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="waiting">Waiting</option>
            <option value="action_needed">Action Needed</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Results list */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-medium">
          <span>{loading ? "Searching..." : `${results.length} results found`}</span>
        </div>

        {results.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
            No matching issues found. Try refining your search keywords or clear filters.
          </div>
        ) : (
          <div className="grid gap-3">
            {results.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {issue.company}
                    </span>
                    {issue.referenceNo && (
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{issue.referenceNo}
                      </span>
                    )}
                    <span className="capitalize text-xs text-slate-400">{issue.category}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {issue.isOverdue && (
                      <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        Overdue
                      </span>
                    )}
                    <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {issue.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {issue.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition" />
                </div>

                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{issue.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
