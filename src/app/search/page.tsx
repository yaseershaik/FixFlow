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
  Inbox,
  Filter,
} from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    executeSearch();
  }, [category, status]);

  const executeSearch = async (forcedQuery?: string) => {
    const activeQuery = forcedQuery !== undefined ? forcedQuery : query;
    setLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      if (activeQuery.trim()) params.set("q", activeQuery.trim());
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.issues) {
        setResults(data.issues);
      }
    } catch {
      setSearchError("Failed to complete search. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Bar */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Issues</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Search Complaints
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quickly find reference numbers, company names, or customer service notes
        </p>
      </div>

      {searchError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-semibold"
        >
          {searchError}
        </div>
      )}

      {/* Search & Filter Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              aria-label="Search complaints by company, reference number, or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, ticket #, or keyword..."
              className="w-full rounded-2xl border border-slate-200 pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[44px]"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => {
                  setQuery("");
                  executeSearch("");
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm min-h-[44px] flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            id="search-category"
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[36px]"
          >
            <option value="all">All Categories</option>
            <option value="warranty">Warranty & Repairs</option>
            <option value="refund">Refunds & Returns</option>
            <option value="delivery">Courier & Delivery</option>
            <option value="telecom">Broadband & Phone</option>
            <option value="banking">Banking & Cards</option>
            <option value="education">Education</option>
            <option value="government">Civic / Govt</option>
            <option value="other">Other</option>
          </select>

          <select
            id="search-status"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 min-h-[36px]"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="waiting">Waiting on Company</option>
            <option value="action_needed">Action Needed</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-medium">
          <span>{loading ? "Searching..." : `${results.length} result${results.length === 1 ? "" : "s"} found`}</span>
        </div>

        {results.length === 0 && !loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching issues found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or resetting the category and status filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 hover:border-slate-300 hover:shadow-card transition"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg truncate max-w-[140px] sm:max-w-[200px]">
                        {issue.company}
                      </span>
                      {issue.referenceNo && (
                        <span className="font-mono text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[160px]">
                          #{issue.referenceNo}
                        </span>
                      )}
                    </div>
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
                      {issue.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {issue.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{issue.expectedDate ? `Promised: ${issue.expectedDate}` : `Logged: ${issue.createdAt.split("T")[0]}`}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-slate-600 font-medium">
                    <span>View</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
