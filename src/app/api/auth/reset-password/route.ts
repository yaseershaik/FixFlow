import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import crypto from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ResetPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  code: z.string().length(6, "Reset code must be exactly 6 digits"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password cannot exceed 128 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rlIp = checkRateLimit(`reset-pwd:ip:${ip}`, 10, 60 * 1000);
    if (!rlIp.success) {
      return apiError("Too many password reset attempts. Please wait a minute.", "RATE_LIMITED", 429);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = ResetPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const { email, code, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Account-level brute-force defense against 6-digit guessing (5 attempts per 15 mins)
    const rlAccount = checkRateLimit(`reset-pwd:account:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rlAccount.success) {
      return apiError(
        "Too many failed verification attempts for this account. Please request a new recovery code.",
        "RATE_LIMITED",
        429
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return apiError("Invalid or expired password reset code", "INVALID_CODE", 400);
    }

    if (Date.now() > user.resetTokenExpiry.getTime()) {
      return apiError("Password reset code has expired. Please request a new one.", "EXPIRED_CODE", 400);
    }

    // Cryptographic constant-time comparison to prevent timing side-channel attacks
    const storedBuf = Buffer.from(user.resetToken);
    const inputBuf = Buffer.from(code);
    if (storedBuf.length !== inputBuf.length || !crypto.timingSafeEqual(storedBuf, inputBuf)) {
      return apiError("Incorrect password reset code", "INVALID_CODE", 400);
    }

    // Set new password and invalidate reset token
    const newHash = hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return apiSuccess({ message: "Password reset successful! You can now sign in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to reset password", "INTERNAL_ERROR", 500);
  }
}
