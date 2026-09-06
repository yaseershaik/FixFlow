import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rlIp = checkRateLimit(`login:ip:${ip}`, 15, 60 * 1000);
    if (!rlIp.success) {
      return apiError("Too many login attempts from this network. Please wait a minute.", "RATE_LIMITED", 429);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = LoginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("Valid email and password are required", "VALIDATION_ERROR", 400);
    }

    const { email, password, rememberMe } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Account-level brute-force defense
    const rlAccount = checkRateLimit(`login:account:${normalizedEmail}`, 5, 60 * 1000);
    if (!rlAccount.success) {
      return apiError("Too many failed attempts for this account. Please wait 1 minute or reset your password.", "RATE_LIMITED", 429);
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const { valid, needsRehash } = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    // Transparently upgrade legacy hash to modern scrypt hash
    if (needsRehash) {
      const newHash = hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }).catch((err) => console.error("Failed to migrate password hash:", err));
    }

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    const token = createSessionToken(
      { id: user.id, email: user.email, name: user.name },
      maxAge * 1000
    );

    const response = apiSuccess({
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : "Internal error");
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
