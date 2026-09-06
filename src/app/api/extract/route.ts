import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractIssueFromText, hashInput } from "@/lib/extraction";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { z } from "zod";

const ExtractRequestSchema = z.object({
  text: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(10000, "Text cannot exceed 10,000 characters"),
});

// In-memory per-user sliding window rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(userId, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    // Aggressive rate-limiting as required by Section 8.2
    if (isRateLimited(user.id)) {
      return apiError(
        "Too many extraction requests. Please wait a minute before trying again.",
        "RATE_LIMIT_EXCEEDED",
        429
      );
    }

    const body = await req.json();
    const parsed = ExtractRequestSchema.safeParse(body);

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
