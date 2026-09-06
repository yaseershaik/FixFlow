import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSuccess, apiUnauthorized, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const now = new Date();

    const [overdueCount, activeCount, totalCount] = await Promise.all([
      db.issue.count({
        where: {
          userId: user.id,
          status: { notIn: ["resolved", "closed"] },
          expectedDate: { lt: now },
        },
      }),
      db.issue.count({
        where: {
          userId: user.id,
          status: { notIn: ["resolved", "closed"] },
        },
      }),
      db.issue.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return apiSuccess({ overdueCount, activeCount, totalCount });
  } catch (err) {
    console.error("Issue stats error:", err);
    return apiError("Failed to fetch issue stats", "INTERNAL_ERROR", 500);
  }
}
