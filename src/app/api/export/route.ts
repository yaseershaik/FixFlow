import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

function generateExportData(issues: any[], format: string, user: any) {
  if (format === "csv") {
    const headers = [
      "ID",
      "Title",
      "Company",
      "Category",
      "Reference Number",
      "Status",
      "Expected Date",
      "Next Action",
      "Created Date",
      "Description",
      "Events Count",
    ];

    const escapeCSV = (str: string | null | undefined) => {
      if (!str) return '""';
      let clean = str.replace(/"/g, '""').replace(/[\r\n]+/g, " ");
      // Mitigate formula injection in Excel / Sheets
      if (/^[=+\-@\t]/.test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const rows = issues.map((i) => [
      escapeCSV(i.id),
      escapeCSV(i.title),
      escapeCSV(i.company),
      escapeCSV(i.category),
      escapeCSV(i.referenceNo),
      escapeCSV(i.status),
      escapeCSV(i.expectedDate ? i.expectedDate.toISOString().split("T")[0] : ""),
      escapeCSV(i.nextAction),
      escapeCSV(i.createdAt.toISOString()),
      escapeCSV(i.description),
      escapeCSV(i.events.length.toString()),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fixflow-complaints-${Date.now()}.csv"`,
      },
    });
  }

  // Default JSON export
  return apiSuccess({
    exportDate: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    issuesCount: issues.length,
    issues,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiUnauthorized();

    const rawBody = await req.json().catch(() => ({}));
    const format = rawBody?.format || "json";

    const issues = await db.issue.findMany({
      where: { userId: user.id },
      include: {
        events: {
          orderBy: { eventAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return generateExportData(issues, format, user);
  } catch (error) {
    console.error("Export API error:", error);
    return apiError("Export failed", "INTERNAL_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const issues = await db.issue.findMany({
      where: { userId: user.id },
      include: {
        events: {
          orderBy: { eventAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return generateExportData(issues, format, user);
  } catch (error) {
    console.error("Export API error:", error);
    return apiError("Export failed", "INTERNAL_ERROR", 500);
  }
}
