import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  REGULAR_QUOTAS,
  DEMO_QUOTAS,
  getQuotas,
  checkComplaintCreationQuota,
  checkAttachmentUploadQuota,
  checkTimelineEventQuota,
  checkDailyExtractionQuota,
  getUserUsageStats,
  cleanupExpiredDemoData,
} from "../src/lib/quotas";
import { db } from "../src/lib/db";

describe("Resource Limits, Storage Quotas & Expiration (Fair-Use Enforcement)", () => {
  const testEmail = `quota-test-${Date.now()}@example.com`;
  let testUserId: string;

  beforeEach(async () => {
    const user = await db.user.create({
      data: {
        email: testEmail,
        passwordHash: "dummy-hash",
        name: "Quota Tester",
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    try {
      await db.attachment.deleteMany({ where: { userId: testUserId } });
      await db.issueEvent.deleteMany({ where: { userId: testUserId } });
      await db.extractionRun.deleteMany({ where: { userId: testUserId } });
      await db.issue.deleteMany({ where: { userId: testUserId } });
      await db.user.delete({ where: { id: testUserId } });
    } catch {}
  });

  it("should configure different quota tiers for regular vs demo users", () => {
    const regular = getQuotas(false);
    const demo = getQuotas(true);

    expect(regular.maxComplaints).toBe(50);
    expect(demo.maxComplaints).toBe(10);

    expect(regular.maxStorageBytes).toBe(25 * 1024 * 1024);
    expect(demo.maxStorageBytes).toBe(10 * 1024 * 1024);

    expect(regular.maxAttachmentsPerIssue).toBe(5);
    expect(demo.maxAttachmentsPerIssue).toBe(3);

    expect(demo.ttlMs).toBe(2 * 60 * 60 * 1000); // 2 hours
  });

  it("should enforce maximum complaint creation quota", async () => {
    // Fresh user should be allowed
    const initialCheck = await checkComplaintCreationQuota(testUserId, false);
    expect(initialCheck.allowed).toBe(true);
    expect(initialCheck.current).toBe(0);

    // Create 10 demo issues to test demo quota
    for (let i = 0; i < 10; i++) {
      await db.issue.create({
        data: {
          userId: testUserId,
          title: `Demo Complaint ${i + 1}`,
          company: "Test Telecom",
          category: "telecom",
          description: "Testing quota limits for complaints.",
          status: "open",
        },
      });
    }

    // Demo quota is 10, so 11th creation must be blocked
    const demoCheck = await checkComplaintCreationQuota(testUserId, true);
    expect(demoCheck.allowed).toBe(false);
    expect(demoCheck.code).toBe("QUOTA_COMPLAINTS_EXCEEDED");
    expect(demoCheck.message).toContain("Account complaint quota reached");

    // Regular quota is 50, so for a regular user with 10 complaints, it should still be allowed
    const regularCheck = await checkComplaintCreationQuota(testUserId, false);
    expect(regularCheck.allowed).toBe(true);
  });

  it("should enforce per-issue attachment count and total user storage cap", async () => {
    const issue = await db.issue.create({
      data: {
        userId: testUserId,
        title: "Broadband Issue",
        company: "Fiber Net",
        category: "telecom",
        description: "Testing attachment quotas.",
        status: "open",
      },
    });

    // Upload 3 attachments (reaches demo limit of 3)
    for (let i = 0; i < 3; i++) {
      await db.attachment.create({
        data: {
          issueId: issue.id,
          userId: testUserId,
          filename: `doc_${i}.pdf`,
          mimeType: "application/pdf",
          size: 1024 * 1024, // 1 MB
          storagePath: `/uploads/${testUserId}/doc_${i}.pdf`,
        },
      });
    }

    // Next attachment should be blocked for demo account (limit = 3)
    const demoAttCheck = await checkAttachmentUploadQuota(testUserId, issue.id, 1024 * 1024, true);
    expect(demoAttCheck.allowed).toBe(false);
    expect(demoAttCheck.code).toBe("ATTACHMENT_COUNT_EXCEEDED");

    // For regular account, 4th attachment is allowed (limit = 5)
    const regAttCheck = await checkAttachmentUploadQuota(testUserId, issue.id, 1024 * 1024, false);
    expect(regAttCheck.allowed).toBe(true);

    // Test storage byte quota limit (25 MB cap)
    const hugeFileSize = 24 * 1024 * 1024; // 24 MB (current is 3 MB, so 3 + 24 = 27 MB > 25 MB)
    const storageOverflowCheck = await checkAttachmentUploadQuota(testUserId, issue.id, hugeFileSize, false);
    expect(storageOverflowCheck.allowed).toBe(false);
    expect(storageOverflowCheck.code).toBe("STORAGE_QUOTA_EXCEEDED");
  });

  it("should enforce timeline event limits per complaint", async () => {
    const issue = await db.issue.create({
      data: {
        userId: testUserId,
        title: "Fridge Issue",
        company: "Cool Electronics",
        category: "warranty",
        description: "Testing timeline event quota.",
        status: "open",
      },
    });

    // Create 20 events (demo limit is 20)
    for (let i = 0; i < 20; i++) {
      await db.issueEvent.create({
        data: {
          issueId: issue.id,
          userId: testUserId,
          eventType: "note",
          body: `Timeline log event ${i + 1}`,
        },
      });
    }

    // Demo limit is 20, next event should be rejected
    const demoEventCheck = await checkTimelineEventQuota(issue.id, testUserId, true);
    expect(demoEventCheck.allowed).toBe(false);
    expect(demoEventCheck.code).toBe("EVENT_COUNT_EXCEEDED");

    // Regular limit is 50, next event should be allowed
    const regEventCheck = await checkTimelineEventQuota(issue.id, testUserId, false);
    expect(regEventCheck.allowed).toBe(true);
  });

  it("should enforce 24-hour AI extraction limits", async () => {
    // Initial check
    const initialCheck = await checkDailyExtractionQuota(testUserId, false);
    expect(initialCheck.allowed).toBe(true);

    // Create 10 extraction runs (demo limit is 10)
    for (let i = 0; i < 10; i++) {
      await db.extractionRun.create({
        data: {
          userId: testUserId,
          provider: "gemini",
          model: "gemini-1.5-flash",
          inputHash: `hash-${i}`,
          outputJson: "{}",
        },
      });
    }

    // Demo quota exceeded on 11th run
    const demoCheck = await checkDailyExtractionQuota(testUserId, true);
    expect(demoCheck.allowed).toBe(false);
    expect(demoCheck.code).toBe("EXTRACTION_QUOTA_EXCEEDED");

    // Regular user has 30 limit, so still allowed
    const regCheck = await checkDailyExtractionQuota(testUserId, false);
    expect(regCheck.allowed).toBe(true);
  });

  it("should accurately aggregate live user usage metrics and statutory retention policy", async () => {
    // Add 1 issue and 1 attachment
    const issue = await db.issue.create({
      data: {
        userId: testUserId,
        title: "Courier Delay",
        company: "Speed Post",
        category: "delivery",
        description: "Testing metrics.",
        status: "open",
      },
    });

    await db.attachment.create({
      data: {
        issueId: issue.id,
        userId: testUserId,
        filename: "receipt.png",
        mimeType: "image/png",
        size: 2 * 1024 * 1024, // 2 MB
        storagePath: `/uploads/${testUserId}/receipt.png`,
      },
    });

    const stats = await getUserUsageStats(testUserId, false);

    expect(stats.complaints.used).toBe(1);
    expect(stats.complaints.limit).toBe(50);
    expect(stats.complaints.remaining).toBe(49);

    expect(stats.storage.usedMB).toBe(2);
    expect(stats.storage.limitMB).toBe(25);
    expect(stats.storage.remainingBytes).toBe(23 * 1024 * 1024);

    expect(stats.retentionPolicy.statutoryLimitationYears).toBe(2);
    expect(stats.retentionPolicy.statutoryDescription).toContain("Section 69 of the Consumer Protection Act, 2019");
  });

  it("should auto-expire and purge temporary demo complaints older than 2 hours while preserving canonical records", async () => {
    // 1. Create a canonical demo issue
    const canonical = await db.issue.create({
      data: {
        userId: testUserId,
        title: "Samsung Fridge (Canonical)",
        company: "Samsung",
        category: "warranty",
        referenceNo: "SR-948201",
        description: "Canonical demo seed complaint.",
        status: "action_needed",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    });

    // 2. Create an expired temporary demo issue
    const expiredTemp = await db.issue.create({
      data: {
        userId: testUserId,
        title: "User Test Temporary Complaint",
        company: "Local Cable",
        category: "telecom",
        referenceNo: "USER-TEMP-999",
        description: "Temporary user-created demo complaint.",
        status: "open",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago (> 2-hour TTL)
      },
    });

    // Run cleanup
    const purgedCount = await cleanupExpiredDemoData(testUserId);
    expect(purgedCount).toBe(1);

    // Canonical issue must STILL exist
    const canonicalRemaining = await db.issue.findUnique({ where: { id: canonical.id } });
    expect(canonicalRemaining).not.toBeNull();

    // Expired temporary issue must be DELETED
    const expiredRemaining = await db.issue.findUnique({ where: { id: expiredTemp.id } });
    expect(expiredRemaining).toBeNull();
  });
});
