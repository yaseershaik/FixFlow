import { NextRequest } from "next/server";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    // Cascade delete user data
    await db.user.delete({
      where: { id: user.id },
    });

    const response = apiSuccess({ message: "Account and associated data deleted permanently" });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return apiError("Failed to delete account", "INTERNAL_ERROR", 500);
  }
}
