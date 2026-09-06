import { NextRequest } from "next/server";
import { getSessionUser, verifyPassword, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function handleDeleteAccount(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const rawBody = await req.json().catch(() => null);
    const password = rawBody?.password;

    if (!password) {
      return apiError("Your password is required to permanently delete your account", "PASSWORD_REQUIRED", 400);
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return apiUnauthorized();
    }

    if (dbUser.email === "demo@fixflow.app") {
      return apiError("The shared demo account cannot be deleted. Please create a free personal account.", "FORBIDDEN", 403);
    }

    const { valid } = verifyPassword(password, dbUser.passwordHash);
    if (!valid) {
      return apiError("Incorrect password. Account deletion was not completed.", "INVALID_CREDENTIALS", 403);
    }

    // 1. Delete physical files from disk
    const uploadsDir = path.join(process.cwd(), "uploads", user.id);
    if (fs.existsSync(uploadsDir)) {
      try {
        fs.rmSync(uploadsDir, { recursive: true, force: true });
      } catch (fsErr) {
        console.warn("Failed to delete user uploads folder:", fsErr);
      }
    }

    // 2. Cascade delete user records from database
    await db.user.delete({
      where: { id: user.id },
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");
    const response = apiSuccess({ message: "Your account and all associated data have been permanently deleted." });
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to delete account", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  return handleDeleteAccount(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteAccount(req);
}
