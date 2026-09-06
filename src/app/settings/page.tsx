"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Trash2,
  User,
  FileSpreadsheet,
  FileJson,
  Loader2,
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
        "Are you sure you want to permanently delete your account and all saved issues? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        alert("Account deleted.");
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Issues
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
        Settings
      </h1>

      {/* Account Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Account
        </h2>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900">{user?.email || "Loading..."}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Name</span>
            <span className="font-semibold text-slate-900">{user?.name || "Demo User"}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Export Records
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Download a spreadsheet or backup file of all your tracked issues.
        </p>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            {exporting === "json" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileJson className="h-3.5 w-3.5 text-indigo-600" />
            )}
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-1">
          Delete Account
        </h2>
        <p className="text-xs text-rose-700 mb-3 leading-relaxed">
          Permanently deletes your account and all saved complaints and timeline notes.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
