import Link from "next/link";
import { Search, LayoutDashboard, Home, Plus, HelpCircle, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Animated Badge */}
        <div className="relative inline-flex items-center justify-center mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50/80 border border-indigo-200/70 flex items-center justify-center shadow-subtle">
            <span className="text-4xl font-black font-mono tracking-tight text-indigo-700">404</span>
          </div>
          <div className="absolute -bottom-2 -right-2 rounded-xl bg-amber-50 border border-amber-200 p-1.5 text-amber-600 shadow-xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Page or Complaint Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The page, complaint docket, or resource you were looking for doesn't exist, was removed, or may belong to another private consumer account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm active:scale-95 min-h-[42px]"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs min-h-[42px]"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs min-h-[42px]"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span>Search Records</span>
          </Link>
        </div>

        {/* Security & Support Note */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500 space-y-1 max-w-md mx-auto">
          <div className="font-semibold text-slate-700 flex items-center justify-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            <span>Need assistance with a disputed transaction?</span>
          </div>
          <p className="text-[11px] text-slate-400">
            For statutory dispute guidance, visit our{" "}
            <Link href="/consumer-rights" className="text-indigo-600 font-medium hover:underline">
              Consumer Rights Guide
            </Link>{" "}
            or contact the National Consumer Helpline toll-free at <strong>1915</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
