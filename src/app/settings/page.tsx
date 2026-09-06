"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Trash2,
  Lock,
  User,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => router.push("/login"));
  }, []);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fixflow-issues-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fixflow-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      alert("Failed to export data");
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "WARNING: This will permanently delete your account and all associated issues, timelines, and attachments. This action cannot be undone.\n\nAre you sure you want to proceed?"
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        alert("Account and data deleted successfully.");
        router.push("/");
      } else {
        alert("Failed to delete account.");
      }
    } catch {
      alert("Network error deleting account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="border-b border-slate-200/80 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Export your complaint history, manage security, or delete your account
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-subtle">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">User Identity</h2>
              <p className="text-xs text-slate-500">Authenticated user context</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="font-bold text-slate-800">{user?.email || "Loading..."}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Name:</span>
              <span className="font-bold text-slate-800">{user?.name || "Demo User"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">User Identifier:</span>
              <span className="font-mono text-slate-600">{user?.id || "..."}</span>
            </div>
          </div>
        </div>

        {/* Export Data Section */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-subtle">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Data Portability & Export</h2>
              <p className="text-xs text-slate-500">
                You own your records. Export your complaints and chronological logs at any time.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-subtle transition active:scale-[0.98]"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              )}
              Export as CSV Spreadsheet
            </button>

            <button
              onClick={() => handleExport("json")}
              disabled={exporting !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-subtle transition active:scale-[0.98]"
            >
              {exporting === "json" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 text-indigo-600" />
              )}
              Export as JSON Backup
            </button>
          </div>
        </div>

        {/* Privacy & Guardrails Statement */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-subtle">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Privacy & Security Guarantees</h2>
              <p className="text-xs text-slate-500">Built to ensure confidentiality of personal service data</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/60 p-3 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Automatic Mailbox Access:</strong> FixFlow will never connect to or scrape your private email or messaging inboxes.
              </span>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/60 p-3 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Owner-Scoped Queries:</strong> Database row-level security isolates all issues, timeline events, and attachments strictly to your account.
              </span>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/60 p-3 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>No Secrets in Frontend:</strong> All LLM API keys and database credentials reside securely on the server.
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-subtle">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">Permanently Delete Account & Data</h2>
              <p className="text-xs text-rose-700">
                Purges your account, all tracked issues, timelines, and file attachments
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-rose-600/90 leading-relaxed">
            Account deletion is immediate and permanent. Export any required history prior to deletion.
          </p>

          <div className="mt-5">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Purging Records...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete My Account & Wipe All Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
