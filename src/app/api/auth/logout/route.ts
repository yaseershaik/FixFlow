import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
