import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateIssueSchema } from "@/lib/types";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { computeAttentionState } from "@/lib/lifecycle";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const parsed = CreateIssueSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const data = parsed.data;

    // Create issue scoped to the authenticated user (Never trust user_id in body)
    const issue = await db.issue.create({
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

    // Automatically record an initial timeline event
    await db.issueEvent.create({
      data: {
        issueId: issue.id,
        userId: user.id,
        eventType: "created",
        body: `Issue created with status "${issue.status}"${issue.referenceNo ? ` (Ref #${issue.referenceNo})` : ""}`,
      },
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
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const whereClause: any = {
      userId: user.id,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const issues = await db.issue.findMany({
      where: whereClause,
      orderBy: { [sortBy]: order },
      include: {
        events: {
          orderBy: { eventAt: "desc" },
          take: 1,
        },
      },
    });

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

    return apiSuccess({ issues: formatted });
  } catch (error) {
    console.error("List issues error:", error);
    return apiError("Failed to fetch issues", "INTERNAL_ERROR", 500);
  }
}
