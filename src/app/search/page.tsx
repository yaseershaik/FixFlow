"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react";

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
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Issues
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
        Search Issues
      </h1>

      {/* Search Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3">
        <form onSubmit={executeSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, ticket #, or keyword..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-8 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTimeout(executeSearch, 0);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition active:scale-95"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="warranty">Warranty & Repairs</option>
            <option value="refund">Refunds & Returns</option>
            <option value="delivery">Delivery</option>
            <option value="telecom">Broadband & Phone</option>
            <option value="banking">Banking</option>
            <option value="education">Education</option>
            <option value="government">Civic / Govt</option>
            <option value="other">Other</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
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

      {/* Results */}
      <div className="mt-5">
        <div className="text-xs text-slate-400 mb-2">
          {loading ? "Searching..." : `${results.length} results`}
        </div>

        {results.length === 0 && !loading ? (
          <p className="text-center text-xs text-slate-400 py-8">
            No matching issues found.
          </p>
        ) : (
          <div className="space-y-2.5">
            {results.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{issue.company}</span>
                  <span className="capitalize text-[11px] text-slate-500 font-medium">
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {issue.title}
                </h3>
                {issue.referenceNo && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    #{issue.referenceNo}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
