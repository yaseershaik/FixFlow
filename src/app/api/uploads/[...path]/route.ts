import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const pathSegments = params.path || [];
    if (pathSegments.length < 2) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid file path", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const [fileOwnerId, ...filenameParts] = pathSegments;
    const filename = filenameParts.join("/");

    // Strict tenant isolation: users can only access their own uploaded files
    if (fileOwnerId !== user.id) {
      return NextResponse.json(
        { success: false, error: { message: "Access denied to requested resource", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Prevent path traversal
    const safeBaseDir = path.resolve(process.cwd(), "uploads", user.id);
    const resolvedPath = path.resolve(safeBaseDir, filename);

    let fileBuffer: Buffer;
    let fileSize: number;

    if (fs.existsSync(resolvedPath) && (resolvedPath === safeBaseDir || resolvedPath.startsWith(safeBaseDir + path.sep))) {
      const stat = fs.statSync(resolvedPath);
      fileSize = stat.size;
      fileBuffer = fs.readFileSync(resolvedPath);
    } else {
      // Reject any dot-segments or separators in filename before remote cloud download
      if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json(
          { success: false, error: { message: "Invalid file path", code: "BAD_REQUEST" } },
          { status: 400 }
        );
      }

      // Stream from Supabase Storage if configured
      const { supabaseAdmin, EVIDENCE_BUCKET } = await import("@/lib/supabase-admin");
      if (!supabaseAdmin) {
        return NextResponse.json(
          { success: false, error: { message: "File not found", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      const { data: cloudBlob, error: downloadErr } = await supabaseAdmin.storage
        .from(EVIDENCE_BUCKET)
        .download(`${user.id}/${filename}`);

      if (downloadErr || !cloudBlob) {
        return NextResponse.json(
          { success: false, error: { message: "File not found in storage", code: "NOT_FOUND" } },
          { status: 404 }
        );
      }

      const arr = await cloudBlob.arrayBuffer();
      fileBuffer = Buffer.from(arr);
      fileSize = fileBuffer.length;
    }

    // Determine content type
    let contentType = "application/octet-stream";
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".txt") contentType = "text/plain";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File download error:", error instanceof Error ? error.message : "Internal error");
    return NextResponse.json(
      { success: false, error: { message: "Failed to stream file", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
