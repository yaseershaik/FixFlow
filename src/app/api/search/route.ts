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
    const query = searchParams.get("q")?.trim().slice(0, 200) || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const fromDateStr = searchParams.get("fromDate");
    const toDateStr = searchParams.get("toDate");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (fromDateStr || toDateStr) {
      const dateFilter: any = {};
      if (fromDateStr) {
        const fromDate = new Date(fromDateStr);
        if (!isNaN(fromDate.getTime())) {
          dateFilter.gte = fromDate;
        }
      }
      if (toDateStr) {
        const toDate = new Date(toDateStr);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          dateFilter.lte = toDate;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { referenceNo: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        { nextAction: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, issues] = await Promise.all([
      db.issue.count({ where }),
      db.issue.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

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
    console.error("Search API error:", error);
    return apiError("Search failed", "INTERNAL_ERROR", 500);
  }
}
