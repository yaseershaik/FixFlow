import { NextRequest } from "next/server";
import { getSessionUser, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }
    return apiSuccess({ user });
  } catch (error) {
    console.error("Auth me GET error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    if (user.email === "demo@fixflow.app") {
      return apiError("Demo account profile cannot be modified. Please create a free personal account.", "FORBIDDEN", 403);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request payload", "BAD_REQUEST", 400);
    }

    const parsed = UpdateProfileSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name.trim() },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = createSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });
    const response = apiSuccess({ user: updatedUser });
    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Auth me PATCH error:", error);
    return apiError("Failed to update profile", "INTERNAL_ERROR", 500);
  }
}

