import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { resetDemoAccount, DEMO_EMAIL } from "@/lib/demo-sandbox";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Launches an ephemeral demo session with the canonical 5 sample complaints.
 * Automatically wipes any leftover user modifications and restores pristine state.
 */
export async function POST(req: NextRequest) {
  try {
    let user = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: "Alex Demo",
          passwordHash: hashPassword("demo123"),
        },
      });
    }

    // Always reset the demo account to clean seed data on session launch
    await resetDemoAccount(user.id);

    const demoDurationSeconds = 2 * 60 * 60; // 2 hours
    const token = createSessionToken(
      { id: user.id, email: user.email, name: user.name },
      demoDurationSeconds * 1000
    );
    const response = apiSuccess({
      user: { id: user.id, email: user.email, name: user.name, isDemo: true },
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");

    // Demo sessions expire in 2 hours to prevent permanent squatting
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: demoDurationSeconds,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo launch error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Failed to initialize demo sandbox", "INTERNAL_ERROR", 500);
  }
}

/**
 * Allows the demo user to manually reset their temporary playground data back to seed state.
 */
export async function PUT() {
  try {
    const user = await getSessionUser();
    if (!user) return apiUnauthorized();

    if (user.email !== DEMO_EMAIL) {
      return apiError("Reset is only available for demo accounts", "FORBIDDEN", 403);
    }

    await resetDemoAccount(user.id);
    return apiSuccess({ message: "Demo data has been reset to default state" });
  } catch (error) {
    console.error("Demo reset error:", error);
    return apiError("Failed to reset demo data", "INTERNAL_ERROR", 500);
  }
}
