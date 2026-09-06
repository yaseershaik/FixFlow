import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractIssueFromText, hashInput } from "@/lib/extraction";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkDailyExtractionQuota } from "@/lib/quotas";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ExtractRequestSchema = z.object({
  text: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(10000, "Text cannot exceed 10,000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    // Rate limit per user (20 requests per minute)
    const rl = checkRateLimit(`extract:${user.id}`, 20, 60 * 1000);
    if (!rl.success) {
      return apiError(
        "Too many extraction requests. Please wait a minute before trying again.",
        "RATE_LIMIT_EXCEEDED",
        429
      );
    }

    // 24-hour quota limit (30/day for regular users, 10/day for demo)
    const isDemo = user.email === "demo@fixflow.app";
    const quotaCheck = await checkDailyExtractionQuota(user.id, isDemo);
    if (!quotaCheck.allowed) {
      return apiError(
        quotaCheck.message || "Daily extraction quota reached",
        quotaCheck.code || "EXTRACTION_QUOTA_EXCEEDED",
        429
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = ExtractRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const { text } = parsed.data;
    const inputHash = hashInput(text);

    // Call extraction engine
    const result = await extractIssueFromText(text);

    const providerName = process.env.GEMINI_API_KEY
      ? "gemini-1.5-flash"
      : process.env.OPENAI_API_KEY
      ? "gpt-4o-mini"
      : "heuristic-nlp";

    // Record extraction run in audit database table
    try {
      await db.extractionRun.create({
        data: {
          userId: user.id,
          provider: providerName,
          model: providerName,
          inputHash,
          outputJson: JSON.stringify(result),
        },
      });
    } catch (auditErr) {
      console.warn("Failed to log extraction run audit:", auditErr);
    }

    return apiSuccess({ result });
  } catch (error) {
    console.error("Extraction endpoint error:", error);
    return apiError("Extraction processing failed", "INTERNAL_ERROR", 500);
  }
}
