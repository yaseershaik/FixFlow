import Link from "next/link";
import { ShieldAlert, LayoutDashboard, Plus, Search } from "lucide-react";

export default function IssueNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shadow-xs mx-auto">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complaint Not Found or Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            This complaint docket does not exist, has been deleted, or belongs to another consumer's private account.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm active:scale-95 min-h-[42px]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm active:scale-95 min-h-[42px]"
          >
            <Plus className="h-4 w-4" />
            <span>File New Issue</span>
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs min-h-[42px]"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span>Search Complaints</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
