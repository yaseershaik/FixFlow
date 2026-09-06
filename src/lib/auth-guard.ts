import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/**
 * Server-Side Authentication Guard.
 * Enforces strict database-verified authentication before any protected page
 * HTML or client-side JavaScript is sent to the user's browser.
 *
 * If unauthenticated or if session is for a deleted/invalid user, immediately
 * stops the request on the server and redirects to the landing page with ?unauthorized=1.
 */
export async function enforceServerAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?unauthorized=1");
  }
  return user;
}
