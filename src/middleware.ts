import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "fixflow_session";
const SECRET = process.env.SESSION_SECRET || "fixflow-super-secret-key-change-in-production-2026";

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Cryptographically verifies session token HMAC-SHA256 signature in the Edge runtime.
 * Guarantees that tampered cookies, forged payloads, or expired sessions are rejected immediately.
 */
async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    if (!encoded || !signature) return null;

    // 1. Recompute HMAC-SHA256 signature with Web Crypto
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded));
    const expectedSignature = arrayBufferToBase64Url(sigBuf);

    // Cryptographic constant-time comparison in Web Crypto / Edge Runtime
    if (signature.length !== expectedSignature.length) {
      return null;
    }
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (mismatch !== 0) {
      return null;
    }

    // 2. Decode and check expiration
    const normalizedB64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const paddedB64 = normalizedB64.padEnd(
      normalizedB64.length + ((4 - (normalizedB64.length % 4)) % 4),
      "="
    );
    const jsonStr = atob(paddedB64);
    const payload = JSON.parse(jsonStr);

    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/contact",
  "/help",
  "/consumer-rights",
  "/privacy",
  "/terms",
  "/blog",
]);

const AUTH_PAGES = new Set([
  "/login",
  "/register",
  "/forgot-password",
]);

const PUBLIC_APIS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/demo",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

  // Static root files (e.g. google verification html, IndexNow txt)
  if (pathname.includes(".") && !pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // Cryptographically verify session at the edge
  const verifiedUserId = await verifySessionTokenEdge(sessionCookie, SECRET);
  const isAuthenticated = Boolean(verifiedUserId);

  // 1. Public educational and landing pages: allow all
  if (PUBLIC_PAGES.has(pathname) || pathname.startsWith("/blog/")) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 2. Auth Pages: allow access without forcing auto-redirect
  if (AUTH_PAGES.has(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 3. Public Auth APIs: allow all
  if (PUBLIC_APIS.has(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 4. Any other route requires verified authentication
  if (!isAuthenticated) {
    // If it's an API route, return 401 JSON immediately
    if (pathname.startsWith("/api/")) {
      const unauthorizedResponse = NextResponse.json(
        { success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
      applySecurityHeaders(unauthorizedResponse);
      if (sessionCookie) unauthorizedResponse.cookies.delete(COOKIE_NAME);
      return unauthorizedResponse;
    }

    // Stop unauthorized users at the landing page itself!
    const redirectUrl = new URL("/", req.url);
    redirectUrl.searchParams.set("unauthorized", "1");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySecurityHeaders(redirectResponse);
    if (sessionCookie) redirectResponse.cookies.delete(COOKIE_NAME);
    return redirectResponse;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, icon-*.png (metadata files)
     * - manifest.webmanifest, robots.txt, sitemap.xml
     * - static root files (*.html, *.txt)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|icon-.*\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:html|txt)$).*)",
  ],
};
