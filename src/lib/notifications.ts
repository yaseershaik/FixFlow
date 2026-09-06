// Browser Web Notifications, Web Audio chimes, and 1-Click WhatsApp/Email Dispatcher

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return "denied";
  }
}

let sharedAudioCtx: AudioContext | null = null;

export function playAlertChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContextClass();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext blocked or not supported, ignore silently
  }
}

export function sendBrowserNotification(
  title: string,
  body: string,
  url: string = "/dashboard"
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "fixflow-overdue-alert",
    });

    notif.onclick = () => {
      window.focus();
      window.location.href = url;
    };

    playAlertChime();
    return true;
  } catch (err) {
    console.warn("Failed to dispatch browser notification:", err);
    return false;
  }
}

export function generateWhatsAppFollowupUrl(params: {
  company: string;
  phone?: string | null;
  referenceNo?: string | null;
  title: string;
  expectedDate?: string | null;
  daysRemaining?: number | null;
}): string {
  const { company, phone, referenceNo, title, expectedDate, daysRemaining } = params;

  let message = `Hello, I am following up on my service complaint with *${company}*.\n\n`;
  message += `• *Issue:* ${title}\n`;
  if (referenceNo) {
    message += `• *Complaint / Order ID:* #${referenceNo}\n`;
  }
  if (expectedDate) {
    const isOverdue = daysRemaining !== null && daysRemaining !== undefined && daysRemaining < 0;
    message += `• *Promised Resolution Date:* ${expectedDate} ${isOverdue ? `(OVERDUE by ${Math.abs(daysRemaining)} days)` : ""}\n`;
  }
  message += `\nPlease provide an immediate status update and next steps to resolve this. Thank you.`;

  // Clean phone number (strip spaces, dashes, parentheses)
  let cleanPhone = (phone || "").replace(/[^0-9+]/g, "");
  if (cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.slice(1);
  } else if (cleanPhone.length === 10) {
    // Assume Indian 10-digit number if no country code
    cleanPhone = "91" + cleanPhone;
  }

  const encodedText = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}

export function generateMailtoEscalationUrl(params: {
  company: string;
  email?: string | null;
  referenceNo?: string | null;
  subject: string;
  body: string;
}): string {
  const { email, subject, body } = params;
  const targetEmail = email?.trim() || "";
  return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function shareComplaintDossier(params: {
  title: string;
  text: string;
  url?: string;
}): Promise<boolean> {
  if (typeof window !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url || window.location.href,
      });
      return true;
    } catch {
      // User cancelled share sheet
      return false;
    }
  }

  // Fallback to clipboard copy
  if (typeof window !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${params.title}\n\n${params.text}`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
