import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateEventSchema } from "@/lib/types";
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from "@/lib/api-response";
import { checkTimelineEventQuota } from "@/lib/quotas";

export const dynamic = "force-dynamic";

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

    // Quota check: limit total events per issue to avoid ballooning storage
    const isDemo = user.email === "demo@fixflow.app";
    const quotaCheck = await checkTimelineEventQuota(issue.id, user.id, isDemo);
    if (!quotaCheck.allowed) {
      return apiError(
        quotaCheck.message || "Timeline event limit reached",
        quotaCheck.code || "EVENT_COUNT_EXCEEDED",
        400
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return apiError("Invalid request body", "BAD_REQUEST", 400);
    }

    const parsed = CreateEventSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    const data = parsed.data;

    let eventDate = new Date();
    if (data.eventAt) {
      const parsedDate = new Date(data.eventAt);
      if (isNaN(parsedDate.getTime())) {
        return apiError("Invalid event date format", "VALIDATION_ERROR", 400);
      }
      eventDate = parsedDate;
    }

    const event = await db.$transaction(async (tx) => {
      const newEvent = await tx.issueEvent.create({
        data: {
          issueId: issue.id,
          userId: user.id,
          eventType: data.eventType,
          body: data.body,
          eventAt: eventDate,
        },
      });

      const issueUpdateData: any = { updatedAt: new Date() };
      if (data.newExpectedDate) {
        const parsedExpected = new Date(data.newExpectedDate);
        if (!isNaN(parsedExpected.getTime())) {
          issueUpdateData.expectedDate = parsedExpected;
        }
      }

      // Touch issue updatedAt and update expectedDate if provided
      await tx.issue.update({
        where: { id: issue.id },
        data: issueUpdateData,
      });

      return newEvent;
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
