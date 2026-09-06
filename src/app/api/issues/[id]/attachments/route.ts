import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from "@/lib/api-response";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id: issueId } = params;
    const issue = await db.issue.findFirst({
      where: { id: issueId, userId: user.id },
    });

    if (!issue) {
      return apiNotFound("Issue not found or access denied");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("File is required", "MISSING_FILE", 400);
    }

    // Security check 1: MIME allowlist
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(
        "Invalid file type. Allowed formats: JPG, PNG, WebP, PDF, TXT",
        "INVALID_FILE_TYPE",
        400
      );
    }

    // Security check 2: Size limits
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("File exceeds maximum allowed size of 5MB", "FILE_TOO_LARGE", 400);
    }

    // Save locally into secure private uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads", user.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const attachment = await db.attachment.create({
      data: {
        issueId,
        userId: user.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath: `/uploads/${user.id}/${safeFilename}`,
      },
    });

    // Auto-record timeline event
    await db.issueEvent.create({
      data: {
        issueId,
        userId: user.id,
        eventType: "note",
        body: `Attached file: ${file.name} (${Math.round(file.size / 1024)} KB)`,
      },
    });

    return apiSuccess({ attachment }, 201);
  } catch (error) {
    console.error("Upload attachment error:", error);
    return apiError("Failed to upload attachment", "INTERNAL_ERROR", 500);
  }
}
