"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from "@/lib/notifications";

export default function NotificationBanner() {
  const [permission, setPermission] = useState<string>("granted");
  const [dismissed, setDismissed] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    const status = getNotificationPermissionStatus();
    setPermission(status);
    // Check if dismissed in sessionStorage
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem("fixflow_notif_dismissed");
      if (isDismissed) setDismissed(true);
    }
  }, []);

  if (permission !== "default" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setEnabling(true);
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    setEnabling(false);
    if (result === "granted") {
      sendBrowserNotification(
        "Reminders Activated!",
        "FixFlow will now alert you if customer support misses a promised deadline."
      );
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fixflow_notif_dismissed", "true");
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-indigo-50 border border-indigo-200/80 p-4 text-xs sm:text-sm text-indigo-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <div className="font-bold text-indigo-950">
            Never miss a promised deadline
          </div>
          <div className="text-xs text-indigo-800/80 mt-0.5">
            Allow alerts so FixFlow can notify you on your device the moment a company’s resolution deadline passes.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={handleDismiss}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
        >
          Not Now
        </button>
        <button
          onClick={handleEnable}
          disabled={enabling}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition active:scale-95 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{enabling ? "Enabling..." : "Enable Alerts"}</span>
        </button>
      </div>
    </div>
  );
}
