import { IssueStatus } from "./types";

export const ALLOWED_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  open: ["waiting", "action_needed", "resolved", "closed"],
  waiting: ["action_needed", "resolved", "closed"],
  action_needed: ["waiting", "resolved", "closed"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

export function canTransition(current: IssueStatus, next: IssueStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

export interface AttentionState {
  isOverdue: boolean;
  isDueSoon: boolean;
  daysRemaining: number | null; // negative if overdue
  attentionPriority: number; // 1 (Overdue) to 5 (Resolved/Closed)
  attentionLabel: string;
}

export function computeAttentionState(
  status: IssueStatus,
  expectedDateStr?: string | Date | null
): AttentionState {
  // If resolved or closed, it's low priority
  if (status === "resolved" || status === "closed") {
    return {
      isOverdue: false,
      isDueSoon: false,
      daysRemaining: null,
      attentionPriority: 5,
      attentionLabel: status === "resolved" ? "Resolved" : "Closed",
    };
  }

  if (!expectedDateStr) {
    if (status === "action_needed") {
      return {
        isOverdue: false,
        isDueSoon: false,
        daysRemaining: null,
        attentionPriority: 2,
        attentionLabel: "Action Needed",
      };
    }
    return {
      isOverdue: false,
      isDueSoon: false,
      daysRemaining: null,
      attentionPriority: status === "waiting" ? 4 : 3,
      attentionLabel: status === "waiting" ? "Waiting" : "Open",
    };
  }

  const expectedDate = new Date(expectedDateStr);
  const now = new Date();

  // Reset times to start of day for clean date comparison
  const expDay = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = expDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isDueSoon: false,
      daysRemaining: diffDays,
      attentionPriority: 1, // Highest visual priority
      attentionLabel: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
    };
  }

  if (status === "action_needed") {
    return {
      isOverdue: false,
      isDueSoon: diffDays <= 2,
      daysRemaining: diffDays,
      attentionPriority: 2,
      attentionLabel: diffDays === 0 ? "Action Needed Today" : "Action Needed",
    };
  }

  if (diffDays <= 2) {
    return {
      isOverdue: false,
      isDueSoon: true,
      daysRemaining: diffDays,
      attentionPriority: 3,
      attentionLabel: diffDays === 0 ? "Due Today" : diffDays === 1 ? "Due Tomorrow" : "Due in 2 days",
    };
  }

  return {
    isOverdue: false,
    isDueSoon: false,
    daysRemaining: diffDays,
    attentionPriority: status === "waiting" ? 4 : 3,
    attentionLabel: status === "waiting" ? "Waiting for response" : "In progress",
  };
}
