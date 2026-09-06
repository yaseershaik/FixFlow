"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  User,
  FileSpreadsheet,
  FileJson,
  Loader2,
  LogOut,
  Bell,
  Scale,
  ExternalLink,
  KeyRound,
  Check,
  AlertTriangle,
  Shield,
  Database,
  HardDrive,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  playAlertChime,
} from "@/lib/notifications";
import Modal from "@/components/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [exportNotice, setExportNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Notification state
  const [permissionStatus, setPermissionStatus] = useState<string>("default");
  const [testingNotif, setTestingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  // Resource Quota & Expiration state
  const [usageStats, setUsageStats] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setEditName(data.user.name || "");
        }
      })
      .catch(() => router.push("/login"));

    fetch("/api/user/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.stats) {
          setUsageStats(data.data.stats);
        }
      })
      .catch(() => {});

    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!editName.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setProfileError(data?.error?.message || "Failed to update profile name");
        return;
      }

      setUser((prev) => (prev ? { ...prev, name: editName.trim() } : null));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setPasswordError(data?.error?.message || "Failed to change password.");
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("Network error changing password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleEnableNotifications = async () => {
    const status = await requestBrowserNotificationPermission();
    setPermissionStatus(status);
    if (status === "granted") {
      sendBrowserNotification(
        "Notifications Enabled!",
        "FixFlow will alert you on your device whenever a company passes a promised deadline."
      );
      setNotifMessage("Browser notifications are active.");
    } else {
      setNotifMessage("Notification permission was not granted.");
    }
  };

  const handleTestNotification = () => {
    setTestingNotif(true);
    playAlertChime();
    const sent = sendBrowserNotification(
      "FixFlow Test Alert",
      "This is how you will be alerted when a customer support deadline passes!"
    );
    if (!sent && permissionStatus !== "granted") {
      setNotifMessage("Please allow notification permissions first using the 'Enable Alerts' button.");
    } else {
      setNotifMessage("Alert chime played and notification dispatched.");
    }
    setTimeout(() => {
      setTestingNotif(false);
      setNotifMessage("");
    }, 4000);
  };

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    setExportNotice(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        setExportNotice({ type: "error", message: "Failed to generate export data." });
        return;
      }

      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fixflow-complaints-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setExportNotice({ type: "success", message: "CSV complaint report downloaded." });
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fixflow-complaints-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setExportNotice({ type: "success", message: "JSON complaint records downloaded." });
      }
    } catch {
      setExportNotice({ type: "error", message: "Failed to connect to export service." });
    } finally {
      setExporting(null);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Password is required to confirm account deletion.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setDeleteModalOpen(false);
        router.push("/");
      } else {
        setDeleteError(data?.error?.message || "Failed to delete account. Incorrect password.");
      }
    } catch {
      setDeleteError("Network error during account deletion.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Bar */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 mb-2 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Issues</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your consumer profile, notifications, and dispute records.
        </p>
      </div>

      {user?.email === "demo@fixflow.app" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-amber-950">Demo Sandbox Notice</div>
            <p className="text-amber-800 leading-relaxed">
              You are currently viewing the shared demo sandbox account. Profile names, passwords, and account deletion cannot be modified here.
            </p>
            <div className="pt-1">
              <Link
                href="/register"
                className="font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Create Free Account</span> &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Account Profile Card with Editing */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Consumer Profile</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              {profileError && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "Loading..."}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label htmlFor="edit-name" className="block text-slate-700 text-xs font-semibold mb-1">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={savingProfile || editName === user?.name}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition"
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition min-h-[40px]"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Security & Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 mt-4 text-xs">
              {passwordError && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Password updated securely!</span>
                </div>
              )}

              <div>
                <label htmlFor="curr-pwd" className="block text-slate-700 font-semibold mb-1">
                  Current Password
                </label>
                <input
                  id="curr-pwd"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="new-pwd" className="block text-slate-700 font-semibold mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="conf-pwd" className="block text-slate-700 font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  id="conf-pwd"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || newPassword.length < 8}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Real Working Alerts & Sound Chimes Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Deadline & Overdue Alerts</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">
              FixFlow alerts you on your device with sound chimes and notifications when a company misses their promised resolution deadline.
            </p>

            {notifMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                {notifMessage}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2.5 flex-wrap">
            {permissionStatus !== "granted" ? (
              <button
                onClick={handleEnableNotifications}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition flex items-center gap-1.5 min-h-[40px] shadow-2xs"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <Check className="h-3.5 w-3.5" />
                <span>Alerts Enabled</span>
              </span>
            )}

            <button
              onClick={handleTestNotification}
              disabled={testingNotif}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 min-h-[40px] shadow-2xs"
            >
              <span>{testingNotif ? "Chiming..." : "Test Alert Chime"}</span>
            </button>
          </div>
        </div>

        {/* Data Export Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Export Complaint History</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">
              Download your complete grievance records, reference numbers, promised dates, and update history for consumer court or official filing.
            </p>

            {exportNotice && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-xs ${
                  exportNotice.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {exportNotice.message}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2.5 flex-wrap">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 min-h-[40px] shadow-2xs"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              )}
              <span>Export as CSV</span>
            </button>

            <button
              onClick={() => handleExport("json")}
              disabled={exporting !== null}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 min-h-[40px] shadow-2xs"
            >
              {exporting === "json" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 text-amber-600" />
              )}
              <span>Export as JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Consumer Rights Guidance Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Legal Rights & Government Helplines</h2>
        </div>

        <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600">
          <p className="leading-relaxed">
            FixFlow is built strictly in accordance with the <strong>Consumer Protection Act, 2019</strong>. If a service provider fails to resolve your grievance within their promised turnaround time, you have the statutory right to escalate without lawyer fees:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70">
              <span className="font-bold text-slate-900 block mb-1">National Consumer Helpline</span>
              <p className="text-xs text-slate-500 mb-2">Toll-free government consumer assistance:</p>
              <a href="tel:1915" className="text-xs font-bold text-indigo-600 hover:underline">
                Call 1915 (or 1800-11-4000)
              </a>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70">
              <span className="font-bold text-slate-900 block mb-1">e-Daakhil Consumer Court Portal</span>
              <p className="text-xs text-slate-500 mb-2">File online claims before District/State Commissions:</p>
              <a
                href="https://edaakhil.nic.in"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <span>edaakhil.nic.in</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-3 text-xs">
            <Link href="/privacy" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
              <span>Privacy Policy</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
              <span>Terms of Service</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Resource Quotas & Storage Limits Card */}
      {usageStats && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Resource Quotas & Storage Limits</h2>
                <p className="text-[11px] text-slate-500">Fair-use resource allocations and statutory retention policy</p>
              </div>
            </div>
            {usageStats.isDemo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                <Clock className="h-3 w-3" />
                <span>2-Hour Auto-Expire Sandbox</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Complaints Quota */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Complaints</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">
                  {usageStats.complaints.used} / {usageStats.complaints.limit}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usageStats.complaints.percent > 85 ? "bg-rose-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${usageStats.complaints.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {usageStats.complaints.remaining} remaining ({usageStats.complaints.dailyUsed}/{usageStats.complaints.dailyLimit} created today)
              </p>
            </div>

            {/* 2. Storage Quota */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Evidence Storage</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">
                  {usageStats.storage.usedMB} / {usageStats.storage.limitMB} MB
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usageStats.storage.percent > 85 ? "bg-rose-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${usageStats.storage.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {(usageStats.storage.remainingBytes / (1024 * 1024)).toFixed(1)} MB available (Max 5 files/issue)
              </p>
            </div>

            {/* 3. AI Extraction Quota */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>AI Extractions</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">
                  {usageStats.extractions.usedToday} / {usageStats.extractions.dailyLimit}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usageStats.extractions.percent > 85 ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${usageStats.extractions.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {usageStats.extractions.remaining} extractions left today (24-hr sliding window)
              </p>
            </div>
          </div>

          {/* Retention & Expiration Policy Notice */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold text-indigo-900 block">Statutory Limitation & Data Retention Policy</span>
              <p className="text-indigo-800">
                {usageStats.retentionPolicy.statutoryDescription}
              </p>
              {usageStats.isDemo && (
                <p className="text-amber-800 font-semibold pt-0.5">
                  Demo Session Expiration: User-created sample records in this demo account auto-expire after 2 hours.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account (Danger Zone) */}
      <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-rose-900">
              Delete Account & Clear All Complaints
            </h2>
            <p className="text-xs sm:text-sm text-rose-700 mt-1 max-w-xl leading-relaxed">
              Permanently deletes your account, stored complaint tickets, timeline notes, and uploaded attachments.
            </p>
          </div>

          <button
            onClick={() => {
              setDeleteError("");
              setDeletePassword("");
              setDeleteModalOpen(true);
            }}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-rose-700 transition shadow-sm min-h-[44px] shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Accessible Account Deletion Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Warning: This action is permanent</span>
            </div>
            <p>
              All your recorded complaints, timeline updates, reminders, and uploaded attachments will be erased immediately.
            </p>
          </div>

          {deleteError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <div>
            <label htmlFor="del-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter your current password to confirm:
            </label>
            <input
              id="del-password"
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              disabled={deleting}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-600 focus:outline-hidden focus:ring-2 focus:ring-rose-600/10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting || !deletePassword}
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
