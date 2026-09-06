import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from "@/lib/api-response";
import { checkAttachmentUploadQuota } from "@/lib/quotas";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function isValidFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  if (mimeType === "application/pdf") {
    // %PDF (0x25 0x50 0x44 0x46)
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  if (mimeType === "image/png") {
    // 0x89 PNG
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === "image/jpeg") {
    // 0xFF 0xD8 0xFF
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    // RIFF .... WEBP
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (mimeType === "text/plain") {
    // Ensure no null bytes or binary execution signatures
    return !buffer.includes(0x00);
  }

  return false;
}

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

    // Security check 2b: Quota limits (per-issue attachment count & total account storage cap)
    const isDemo = user.email === "demo@fixflow.app";
    const quotaCheck = await checkAttachmentUploadQuota(user.id, issueId, file.size, isDemo);
    if (!quotaCheck.allowed) {
      return apiError(
        quotaCheck.message || "Storage quota exceeded",
        quotaCheck.code || "STORAGE_QUOTA_EXCEEDED",
        403
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Security check 3: Magic byte inspection
    if (!isValidFileSignature(buffer, file.type)) {
      return apiError(
        "File signature does not match declared type. Upload rejected.",
        "MALICIOUS_FILE",
        400
      );
    }

    // Save locally into secure private uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads", user.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    // Also upload to Supabase Storage if configured
    const { supabaseAdmin, EVIDENCE_BUCKET, ensureEvidenceBucket } = await import("@/lib/supabase-admin");
    if (supabaseAdmin) {
      try {
        await ensureEvidenceBucket();
        await supabaseAdmin.storage
          .from(EVIDENCE_BUCKET)
          .upload(`${user.id}/${safeFilename}`, buffer, {
            contentType: file.type,
            upsert: true,
          });
      } catch (cloudErr) {
        console.warn("Supabase Storage upload warning:", cloudErr);
      }
    }

    const storagePath = `/api/uploads/${user.id}/${safeFilename}`;

    const attachment = await db.attachment.create({
      data: {
        issueId,
        userId: user.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return apiUnauthorized();

    const { id: issueId } = params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return apiError("Attachment ID is required", "MISSING_PARAM", 400);
    }

    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, issueId, userId: user.id },
    });

    if (!attachment) {
      return apiNotFound("Attachment not found");
    }

    // Delete physical file if it exists
    if (attachment.storagePath.startsWith("/api/uploads/") || attachment.storagePath.startsWith("/uploads/")) {
      const parts = attachment.storagePath.replace(/^\/(api\/)?uploads\//, "").split("/");
      if (parts.length === 2) {
        const filePath = path.join(process.cwd(), "uploads", parts[0], parts[1]);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("Failed to delete physical file:", err);
          }
        }
      }

      // Also remove from Supabase Storage
      const { supabaseAdmin, EVIDENCE_BUCKET } = await import("@/lib/supabase-admin");
      if (supabaseAdmin && parts.length === 2) {
        try {
          await supabaseAdmin.storage.from(EVIDENCE_BUCKET).remove([`${parts[0]}/${parts[1]}`]);
        } catch (cloudErr) {
          console.warn("Supabase Storage delete warning:", cloudErr);
        }
      }
    }

    await db.attachment.delete({
      where: { id: attachment.id },
    });

    return apiSuccess({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return apiError("Failed to delete attachment", "INTERNAL_ERROR", 500);
  }
}
