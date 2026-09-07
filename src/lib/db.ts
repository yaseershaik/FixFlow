import { PrismaClient } from "@prisma/client";

// Supabase Connection Pooler (Transaction mode on port 6543)
// Resolves over IPv4 for AWS Lambda & Vercel serverless environments
const SUPABASE_POOLER_URL =
  "postgresql://postgres.ntifhiphuxgzfurdlzkp:8gK0Wn67T4eyXBpE@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    return SUPABASE_POOLER_URL;
  }
  // If user configured the direct db.*.supabase.co:5432 URL in Vercel,
  // automatically rewrite to the IPv4 pooler because Vercel Lambda lacks IPv6 outbound egress
  if (envUrl.includes("db.ntifhiphuxgzfurdlzkp.supabase.co")) {
    return envUrl.replace(
      /postgresql:\/\/postgres:([^@]+)@db\.ntifhiphuxgzfurdlzkp\.supabase\.co:5432\/postgres/,
      "postgresql://postgres.ntifhiphuxgzfurdlzkp:$1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
    );
  }
  return envUrl;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
