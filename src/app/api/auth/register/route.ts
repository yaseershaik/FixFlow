import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateRealEmail } from "@/lib/email-validator";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid email address").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  name: z.string().min(1, "Name is required").max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rl = checkRateLimit(`register:${ip}`, 6, 60 * 1000);
    if (!rl.success) {
      return apiError("Too many accounts created recently. Please wait a minute.", "RATE_LIMITED", 429);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = RegisterSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const { email, password, name } = parsed.data;
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

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return apiError("An account with this email already exists", "USER_EXISTS", 409);
    }

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        name: name?.trim() || normalizedEmail.split("@")[0],
      },
    });

    const token = createSessionToken({ id: user.id, email: user.email, name: user.name });
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
  } catch (error: any) {
    if (error?.code === "P2002") {
      return apiError("An account with this email already exists", "USER_EXISTS", 409);
    }
    console.error("Register error:", error);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
