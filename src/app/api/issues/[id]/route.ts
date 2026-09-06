import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateIssueSchema } from "@/lib/types";
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from "@/lib/api-response";
import { canTransition, computeAttentionState } from "@/lib/lifecycle";

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

    // Strict ownership boundary: query must include userId
    const issue = await db.issue.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        events: {
          orderBy: { eventAt: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        reminders: true,
      },
    });

    if (!issue) {
      return apiNotFound("Issue not found or access denied");
    }

    const attention = computeAttentionState(issue.status as any, issue.expectedDate);

    return apiSuccess({
      issue: {
        ...issue,
        expectedDate: issue.expectedDate ? issue.expectedDate.toISOString().split("T")[0] : null,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
        isOverdue: attention.isOverdue,
        isDueSoon: attention.isDueSoon,
        daysRemaining: attention.daysRemaining,
        attentionPriority: attention.attentionPriority,
        attentionLabel: attention.attentionLabel,
      },
    });
  } catch (error) {
    console.error("Get issue error:", error);
    return apiError("Failed to fetch issue", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = params;
    const body = await req.json();
    const parsed = UpdateIssueSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    // Check existing issue ownership
    const existing = await db.issue.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return apiNotFound("Issue not found or access denied");
    }

    const updateData: any = {};
    const data = parsed.data;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.referenceNo !== undefined) updateData.referenceNo = data.referenceNo;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.nextAction !== undefined) updateData.nextAction = data.nextAction;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.expectedDate !== undefined) {
      updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;
    }

    // Lifecycle check
    let statusChanged = false;
    if (data.status !== undefined && data.status !== existing.status) {
      if (!canTransition(existing.status as any, data.status as any)) {
        return apiError(
          `Invalid status transition from "${existing.status}" to "${data.status}"`,
          "INVALID_TRANSITION",
          400
        );
      }
      updateData.status = data.status;
      statusChanged = true;
    }

    const updated = await db.issue.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Automatically record event if status changed
    if (statusChanged) {
      await db.issueEvent.create({
        data: {
          issueId: updated.id,
          userId: user.id,
          eventType: "status_change",
          body: `Status changed from "${existing.status}" to "${updated.status}"`,
        },
      });
    }

    return apiSuccess({ issue: updated });
  } catch (error) {
    console.error("Update issue error:", error);
    return apiError("Failed to update issue", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = params;

    // Strict ownership check
    const existing = await db.issue.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return apiNotFound("Issue not found or access denied");
    }

    await db.issue.delete({
      where: { id: existing.id },
    });

    return apiSuccess({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Delete issue error:", error);
    return apiError("Failed to delete issue", "INTERNAL_ERROR", 500);
  }
}
