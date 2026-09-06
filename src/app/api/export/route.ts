import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { format } = await req.json().catch(() => ({ format: "json" }));

    const issues = await db.issue.findMany({
      where: { userId: user.id },
      include: {
        events: {
          orderBy: { eventAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Generate standard CSV
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
        return `"${str.replace(/"/g, '""').replace(/\n/g, " ")}"`;
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
          "Content-Disposition": `attachment; filename="fixflow-export-${Date.now()}.csv"`,
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
  } catch (error) {
    console.error("Export API error:", error);
    return apiError("Export failed", "INTERNAL_ERROR", 500);
  }
}
