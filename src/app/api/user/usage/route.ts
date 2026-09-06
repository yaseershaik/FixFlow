import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserUsageStats, cleanupExpiredDemoData } from "@/lib/quotas";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const isDemo = user.email === "demo@fixflow.app";

    // If demo user, trigger automatic cleanup of expired demo records (> 2 hours old)
    if (isDemo) {
      await cleanupExpiredDemoData(user.id).catch((err) =>
        console.warn("Demo expired cleanup warning:", err instanceof Error ? err.message : err)
      );
    }

    const stats = await getUserUsageStats(user.id, isDemo);

    return apiSuccess({ stats });
  } catch (error) {
    console.error("Usage stats error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to fetch account usage", "INTERNAL_ERROR", 500);
  }
}
