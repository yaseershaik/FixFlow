import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateEventSchema } from "@/lib/types";
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = params;

    // Verify issue ownership
    const issue = await db.issue.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!issue) {
      return apiNotFound("Issue not found or access denied");
    }

    const body = await req.json();
    const parsed = CreateEventSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const data = parsed.data;

    const event = await db.issueEvent.create({
      data: {
        issueId: issue.id,
        userId: user.id,
        eventType: data.eventType,
        body: data.body,
        eventAt: data.eventAt ? new Date(data.eventAt) : new Date(),
      },
    });

    // Touch issue updatedAt
    await db.issue.update({
      where: { id: issue.id },
      data: { updatedAt: new Date() },
    });

    return apiSuccess({ event }, 201);
  } catch (error) {
    console.error("Create event error:", error);
    return apiError("Failed to create timeline event", "INTERNAL_ERROR", 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = params;

    const issue = await db.issue.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!issue) {
      return apiNotFound("Issue not found or access denied");
    }

    const events = await db.issueEvent.findMany({
      where: {
        issueId: issue.id,
        userId: user.id,
      },
      orderBy: { eventAt: "desc" },
    });

    return apiSuccess({ events });
  } catch (error) {
    console.error("List events error:", error);
    return apiError("Failed to fetch timeline events", "INTERNAL_ERROR", 500);
  }
}
