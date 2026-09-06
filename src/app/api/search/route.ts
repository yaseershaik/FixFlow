import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { computeAttentionState } from "@/lib/lifecycle";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: any = {
      userId: user.id,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { company: { contains: query } },
        { referenceNo: { contains: query } },
        { description: { contains: query } },
        { notes: { contains: query } },
        { nextAction: { contains: query } },
      ];
    }

    const issues = await db.issue.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

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

    return apiSuccess({ issues: formatted, total: formatted.length });
  } catch (error) {
    console.error("Search API error:", error);
    return apiError("Search failed", "INTERNAL_ERROR", 500);
  }
}
