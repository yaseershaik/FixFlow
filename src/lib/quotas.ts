import { db } from "@/lib/db";

export interface QuotaConfig {
  maxComplaints: number;
  maxComplaintsDaily: number;
  maxAttachmentsPerIssue: number;
  maxStorageBytes: number;
  maxEventsPerIssue: number;
  maxExtractionsDaily: number;
  ttlMs?: number; // Optional auto-expiration for ephemeral/demo data
}

export const REGULAR_QUOTAS: QuotaConfig = {
  maxComplaints: 50,
  maxComplaintsDaily: 15,
  maxAttachmentsPerIssue: 5,
  maxStorageBytes: 25 * 1024 * 1024, // 25 MB total storage
  maxEventsPerIssue: 50,
  maxExtractionsDaily: 30,
};

export const DEMO_QUOTAS: QuotaConfig = {
  maxComplaints: 10,
  maxComplaintsDaily: 5,
  maxAttachmentsPerIssue: 3,
  maxStorageBytes: 10 * 1024 * 1024, // 10 MB total storage
  maxEventsPerIssue: 20,
  maxExtractionsDaily: 10,
  ttlMs: 2 * 60 * 60 * 1000, // 2 hours auto-expiration
};

export function getQuotas(isDemo: boolean): QuotaConfig {
  return isDemo ? DEMO_QUOTAS : REGULAR_QUOTAS;
}

export interface QuotaCheckResult {
  allowed: boolean;
  message?: string;
  code?: string;
  current?: number;
  limit?: number;
}

/**
 * Checks if a user has exceeded total complaint count or daily complaint creation limit.
 */
export async function checkComplaintCreationQuota(
  userId: string,
  isDemo: boolean
): Promise<QuotaCheckResult> {
  const quotas = getQuotas(isDemo);

  // 1. Check total active complaints
  const totalCount = await db.issue.count({
    where: { userId },
  });

  if (totalCount >= quotas.maxComplaints) {
    return {
      allowed: false,
      code: "QUOTA_COMPLAINTS_EXCEEDED",
      message: `Account complaint quota reached (${totalCount}/${quotas.maxComplaints}). Please resolve or archive older complaints before creating new ones.`,
      current: totalCount,
      limit: quotas.maxComplaints,
    };
  }

  // 2. Check 24-hour rate of new complaints
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyCount = await db.issue.count({
    where: {
      userId,
      createdAt: { gte: oneDayAgo },
    },
  });

  if (dailyCount >= quotas.maxComplaintsDaily) {
    return {
      allowed: false,
      code: "DAILY_COMPLAINT_LIMIT_REACHED",
      message: `Daily complaint creation limit reached (${dailyCount}/${quotas.maxComplaintsDaily} per 24 hours). Please try again tomorrow.`,
      current: dailyCount,
      limit: quotas.maxComplaintsDaily,
    };
  }

  return { allowed: true, current: totalCount, limit: quotas.maxComplaints };
}

/**
 * Checks if adding a new attachment exceeds issue-level attachment count
 * or the user's total storage quota.
 */
export async function checkAttachmentUploadQuota(
  userId: string,
  issueId: string,
  newFileSizeBytes: number,
  isDemo: boolean
): Promise<QuotaCheckResult> {
  const quotas = getQuotas(isDemo);

  // 1. Check attachment count for this specific complaint
  const issueAttachmentsCount = await db.attachment.count({
    where: { issueId, userId },
  });

  if (issueAttachmentsCount >= quotas.maxAttachmentsPerIssue) {
    return {
      allowed: false,
      code: "ATTACHMENT_COUNT_EXCEEDED",
      message: `Maximum of ${quotas.maxAttachmentsPerIssue} attachments per complaint reached for this dispute.`,
      current: issueAttachmentsCount,
      limit: quotas.maxAttachmentsPerIssue,
    };
  }

  // 2. Check user's cumulative storage consumption
  const userAttachments = await db.attachment.findMany({
    where: { userId },
    select: { size: true },
  });

  const currentTotalBytes = userAttachments.reduce((sum, att) => sum + (att.size || 0), 0);
  const projectedBytes = currentTotalBytes + newFileSizeBytes;

  if (projectedBytes > quotas.maxStorageBytes) {
    const usedMB = (currentTotalBytes / (1024 * 1024)).toFixed(1);
    const limitMB = (quotas.maxStorageBytes / (1024 * 1024)).toFixed(0);
    const newMB = (newFileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      code: "STORAGE_QUOTA_EXCEEDED",
      message: `Account storage quota exceeded. Uploading ${newMB} MB would exceed your ${limitMB} MB limit (Currently using ${usedMB} MB).`,
      current: currentTotalBytes,
      limit: quotas.maxStorageBytes,
    };
  }

  return { allowed: true, current: currentTotalBytes, limit: quotas.maxStorageBytes };
}

/**
 * Checks if an issue has exceeded the maximum allowed timeline event entries.
 */
export async function checkTimelineEventQuota(
  issueId: string,
  userId: string,
  isDemo: boolean
): Promise<QuotaCheckResult> {
  const quotas = getQuotas(isDemo);

  const eventCount = await db.issueEvent.count({
    where: { issueId, userId },
  });

  if (eventCount >= quotas.maxEventsPerIssue) {
    return {
      allowed: false,
      code: "EVENT_COUNT_EXCEEDED",
      message: `Maximum of ${quotas.maxEventsPerIssue} timeline events reached for this complaint record.`,
      current: eventCount,
      limit: quotas.maxEventsPerIssue,
    };
  }

  return { allowed: true, current: eventCount, limit: quotas.maxEventsPerIssue };
}

/**
 * Checks if a user has exceeded their 24-hour AI text extraction allowance.
 */
export async function checkDailyExtractionQuota(
  userId: string,
  isDemo: boolean
): Promise<QuotaCheckResult> {
  const quotas = getQuotas(isDemo);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const extractionCount = await db.extractionRun.count({
    where: {
      userId,
      createdAt: { gte: oneDayAgo },
    },
  });

  if (extractionCount >= quotas.maxExtractionsDaily) {
    return {
      allowed: false,
      code: "EXTRACTION_QUOTA_EXCEEDED",
      message: `Daily AI extraction quota reached (${extractionCount}/${quotas.maxExtractionsDaily} per 24 hours). Resets dynamically every 24 hours.`,
      current: extractionCount,
      limit: quotas.maxExtractionsDaily,
    };
  }

  return { allowed: true, current: extractionCount, limit: quotas.maxExtractionsDaily };
}

/**
 * Cleans up temporary demo complaints and attachments older than the 2-hour TTL.
 * Canonical seed complaints (with canonical reference numbers) are preserved.
 */
export async function cleanupExpiredDemoData(demoUserId: string): Promise<number> {
  const CANONICAL_REFS = ["SR-948201", "TT-88310", "OD409218201", "AWB-672910", "SWIG-92817"];
  const expiryCutoff = new Date(Date.now() - (DEMO_QUOTAS.ttlMs || 2 * 60 * 60 * 1000));

  // Find non-canonical demo issues created before cutoff
  const expiredIssues = await db.issue.findMany({
    where: {
      userId: demoUserId,
      createdAt: { lt: expiryCutoff },
      referenceNo: { notIn: CANONICAL_REFS },
    },
    select: { id: true },
  });

  if (expiredIssues.length === 0) return 0;

  const expiredIds = expiredIssues.map((i) => i.id);

  // Delete associated attachments from database
  await db.attachment.deleteMany({
    where: { issueId: { in: expiredIds } },
  });

  // Delete associated events
  await db.issueEvent.deleteMany({
    where: { issueId: { in: expiredIds } },
  });

  // Delete issues
  const { count } = await db.issue.deleteMany({
    where: { id: { in: expiredIds } },
  });

  return count;
}

/**
 * Aggregates complete live resource usage statistics for an account.
 */
export async function getUserUsageStats(userId: string, isDemo: boolean) {
  const quotas = getQuotas(isDemo);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    complaintsTotal,
    complaintsDaily,
    attachments,
    extractionsDaily,
  ] = await Promise.all([
    db.issue.count({ where: { userId } }),
    db.issue.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
    db.attachment.findMany({ where: { userId }, select: { size: true } }),
    db.extractionRun.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
  ]);

  const storageUsedBytes = attachments.reduce((sum, a) => sum + (a.size || 0), 0);

  return {
    isDemo,
    complaints: {
      used: complaintsTotal,
      limit: quotas.maxComplaints,
      remaining: Math.max(0, quotas.maxComplaints - complaintsTotal),
      dailyUsed: complaintsDaily,
      dailyLimit: quotas.maxComplaintsDaily,
      percent: Math.min(100, Math.round((complaintsTotal / quotas.maxComplaints) * 100)),
    },
    storage: {
      usedBytes: storageUsedBytes,
      limitBytes: quotas.maxStorageBytes,
      usedMB: Number((storageUsedBytes / (1024 * 1024)).toFixed(2)),
      limitMB: Number((quotas.maxStorageBytes / (1024 * 1024)).toFixed(0)),
      remainingBytes: Math.max(0, quotas.maxStorageBytes - storageUsedBytes),
      percent: Math.min(100, Math.round((storageUsedBytes / quotas.maxStorageBytes) * 100)),
    },
    extractions: {
      usedToday: extractionsDaily,
      dailyLimit: quotas.maxExtractionsDaily,
      remaining: Math.max(0, quotas.maxExtractionsDaily - extractionsDaily),
      percent: Math.min(100, Math.round((extractionsDaily / quotas.maxExtractionsDaily) * 100)),
    },
    retentionPolicy: {
      statutoryLimitationYears: 2, // CPA 2019 Section 69
      statutoryDescription: "Under Section 69 of the Consumer Protection Act, 2019, consumer commission filings must be instituted within 2 years from the date of the cause of action.",
      demoTtlHours: isDemo ? 2 : null,
    },
  };
}
