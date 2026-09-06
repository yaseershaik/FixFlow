import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateIssueSchema } from "@/lib/types";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { computeAttentionState } from "@/lib/lifecycle";
import { checkComplaintCreationQuota } from "@/lib/quotas";

export const dynamic = "force-dynamic";

const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "title",
  "company",
  "status",
  "expectedDate",
  "category",
];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const isDemo = user.email === "demo@fixflow.app";
    const quotaCheck = await checkComplaintCreationQuota(user.id, isDemo);
    if (!quotaCheck.allowed) {
      return apiError(
        quotaCheck.message || "Complaint creation limit reached",
        quotaCheck.code || "QUOTA_EXCEEDED",
        403
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = CreateIssueSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const data = parsed.data;

    // Use a transaction to ensure both the issue and its initial event are created atomically
    const issue = await db.$transaction(async (tx) => {
      const newIssue = await tx.issue.create({
        data: {
          userId: user.id,
          title: data.title,
          company: data.company,
          category: data.category,
          referenceNo: data.referenceNo || null,
          description: data.description,
          status: data.status || "open",
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          nextAction: data.nextAction || null,
          notes: data.notes || null,
        },
      });

      await tx.issueEvent.create({
        data: {
          issueId: newIssue.id,
          userId: user.id,
          eventType: "created",
          body: `Issue created with status "${newIssue.status}"${newIssue.referenceNo ? ` (Ref #${newIssue.referenceNo})` : ""}`,
        },
      });

      return newIssue;
    });

    return apiSuccess({ issue }, 201);
  } catch (error) {
    console.error("Create issue error:", error);
    return apiError("Failed to create issue", "INTERNAL_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const rawSortBy = searchParams.get("sortBy") || "updatedAt";
    const sortBy = ALLOWED_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "updatedAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: user.id,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const [total, issues] = await Promise.all([
      db.issue.count({ where: whereClause }),
      db.issue.findMany({
        where: whereClause,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      }),
    ]);

    // Augment issues with attention state (overdue, due soon)
    const formatted = issues.map((issue) => {
      const attention = computeAttentionState(issue.status as any, issue.expectedDate);
      return {
        ...issue,
        expectedDate: issue.expectedDate ? issue.expectedDate.toISOString().split("T")[0] : null,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
        isOverdue: attention.isOverdue,
        isDueSoon: attention.isDueSoon,
        daysRemaining: attention.daysRemaining,
        attentionPriority: attention.attentionPriority,
        attentionLabel: attention.attentionLabel,
      };
    });

    return apiSuccess({ issues: formatted, total, page, limit });
  } catch (error) {
    console.error("List issues error:", error);
    return apiError("Failed to fetch issues", "INTERNAL_ERROR", 500);
  }
}
