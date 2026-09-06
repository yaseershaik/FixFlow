import { NextResponse } from "next/server";
import crypto from "crypto";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, code = "BAD_REQUEST", status = 400) {
  const requestId = crypto.randomUUID();
  return NextResponse.json(
    {
      error: {
        code,
        message,
        request_id: requestId,
      },
    },
    { status }
  );
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError(message, "UNAUTHORIZED", 401);
}

export function apiForbidden(message = "Access denied to requested resource") {
  return apiError(message, "FORBIDDEN", 403);
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, "NOT_FOUND", 404);
}
