import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateRealEmail } from "@/lib/email-validator";
import crypto from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rl = checkRateLimit(`forgot-pwd:${ip}`, 5, 60 * 1000);
    if (!rl.success) {
      return apiError("Too many password reset requests. Please wait a minute.", "RATE_LIMITED", 429);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = ForgotPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Block temporary, disposable, or burner email addresses
    const emailCheck = validateRealEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return apiError(
        emailCheck.error || "Temporary or disposable emails are not permitted.",
        "INVALID_EMAIL",
        400
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Do not leak user existence, return identical response
      return apiSuccess({
        message: "If an account exists with this email, a 6-digit recovery code has been issued.",
      });
    }

    // Generate 6-digit numeric verification code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiry,
      },
    });

    // In local development, log to server console for friction-free developer testing
    if (process.env.NODE_ENV === "development") {
      console.info(`[FixFlow DEV] Password reset code for ${normalizedEmail}: ${resetCode}`);
    }

    return apiSuccess({
      message: "If an account exists with this email, a 6-digit recovery code has been issued.",
    });
  } catch (error) {
    console.error("Forgot password error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to initiate password reset", "INTERNAL_ERROR", 500);
  }
}
