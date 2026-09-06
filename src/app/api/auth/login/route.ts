import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Email and password are required", "VALIDATION_ERROR", 400);
    }

    const { email, password } = parsed.data;
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const token = createSessionToken(user.id);
    const response = apiSuccess({
      user: { id: user.id, email: user.email, name: user.name },
    });

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
    console.error("Login error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
