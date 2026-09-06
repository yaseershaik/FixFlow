import { NextRequest } from "next/server";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password cannot exceed 128 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const rl = checkRateLimit(`change-pwd:${user.id}`, 5, 60 * 1000);
    if (!rl.success) {
      return apiError("Too many password change attempts. Please wait a minute.", "RATE_LIMITED", 429);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request payload", "BAD_REQUEST", 400);
    }

    const parsed = ChangePasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return apiUnauthorized();
    }

    if (dbUser.email === "demo@fixflow.app") {
      return apiError("Demo account credentials cannot be changed. Please create a free personal account.", "FORBIDDEN", 403);
    }

    const { valid } = verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return apiError("The current password you entered is incorrect", "INVALID_PASSWORD", 403);
    }

    const newHash = hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return apiSuccess({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to update password", "INTERNAL_ERROR", 500);
  }
}
