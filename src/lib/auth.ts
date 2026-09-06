import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE_NAME = "fixflow_session";

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "fixflow-super-secret-key-change-in-production-2026")
) {
  console.warn("WARNING: SESSION_SECRET must be configured with a secure random value in production deployments.");
}

const SECRET = process.env.SESSION_SECRET || "fixflow-super-secret-key-change-in-production-2026";

/**
 * Generates a cryptographically strong scrypt password hash with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored hash using constant-time comparison.
 * Supports legacy HMAC-SHA256 hashes with automatic migration flag.
 */
export function verifyPassword(
  password: string,
  storedHash: string
): { valid: boolean; needsRehash: boolean } {
  if (!storedHash) return { valid: false, needsRehash: false };

  // 1. Modern scrypt format: "scrypt:<salt>:<hex>"
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, keyHex] = parts;
    const keyBuf = Buffer.from(keyHex, "hex");
    const derived = crypto.scryptSync(password, salt, keyBuf.length, { N: 16384, r: 8, p: 1 });

    if (keyBuf.length !== derived.length) return { valid: false, needsRehash: false };
    const valid = crypto.timingSafeEqual(keyBuf, derived);
    return { valid, needsRehash: false };
  }

  // 2. Legacy HMAC-SHA256 backward compatibility
  const legacyHash = crypto.createHmac("sha256", SECRET).update(password).digest("hex");
  const legacyBuf = Buffer.from(legacyHash);
  const storedBuf = Buffer.from(storedHash);

  if (legacyBuf.length === storedBuf.length && crypto.timingSafeEqual(legacyBuf, storedBuf)) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

export interface SessionUserData {
  id: string;
  email: string;
  name: string | null;
}

export interface SessionPayload {
  userId: string;
  email?: string;
  name?: string | null;
  exp: number;
}

export function createSessionToken(
  userOrId: string | { id: string; email: string; name?: string | null },
  customDurationMs?: number
): string {
  const isObject = typeof userOrId === "object" && userOrId !== null;
  const userId = isObject ? userOrId.id : userOrId;
  const email = isObject ? userOrId.email : undefined;
  const name = isObject ? userOrId.name || null : undefined;

  const duration = customDurationMs || 7 * 24 * 60 * 60 * 1000; // default 7 days

  const payload: SessionPayload = {
    userId,
    email,
    name,
    exp: Date.now() + duration,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionTokenPayload(token: string): SessionPayload | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = crypto.createHmac("sha256", SECRET).update(encoded).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string): string | null {
  const payload = verifySessionTokenPayload(token);
  return payload?.userId || null;
}

/**
 * High-speed session retriever.
 * Checks HMAC signature and returns the authenticated user data in 0.02ms in-memory
 * without incurring a 100-300ms remote database roundtrip.
 */
export async function getSessionUser(): Promise<SessionUserData | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const payload = verifySessionTokenPayload(sessionToken);
  if (!payload) {
    try { cookieStore.delete(COOKIE_NAME); } catch {}
    return null;
  }

  // Fast-path: verified cryptographic signature with user profile in token
  if (payload.email) {
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name ?? null,
    };
  }

  // Fallback for legacy tokens without email: query DB once
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    try { cookieStore.delete(COOKIE_NAME); } catch {}
    return null;
  }

  return user;
}

export async function requireAuth(): Promise<SessionUserData> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export { COOKIE_NAME };

