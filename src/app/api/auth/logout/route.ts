import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { resetDemoAccount, DEMO_EMAIL } from "@/lib/demo-sandbox";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user?.email === DEMO_EMAIL) {
      await resetDemoAccount(user.id);
    }
  } catch (err) {
    console.error("Logout cleanup error:", err);
  }

  const response = apiSuccess({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
