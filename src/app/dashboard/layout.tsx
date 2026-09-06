import { enforceServerAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceServerAuth();
  return <>{children}</>;
}
