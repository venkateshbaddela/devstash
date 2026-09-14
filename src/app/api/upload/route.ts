import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import { validateFileConstraints } from "@/lib/file-constraints";
import { uploadFileToB2 } from "@/lib/storage";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // In standalone / non-request context
    }

    const userId = session?.user?.id ?? (await getDefaultUserId());
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to upload files." },
        { status: 401 }
      );
    }

    const clientIp = await getClientIp(req);
    const rateLimit = await checkRateLimit("upload", `${userId}:${clientIp}`);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const requestedType = (formData.get("type") as string || "").toLowerCase().trim();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file was provided in the upload request." },
        { status: 400 }
      );
    }

    const fileName = "name" in file && typeof file.name === "string" ? file.name : "unnamed-file";
    const fileSize = file.size;
    const fileMime = file.type || "";

    // Determine target validation type
    const targetType: "image" | "file" =
      requestedType === "image"
        ? "image"
        : requestedType === "file"
        ? "file"
        : fileMime.startsWith("image/")
        ? "image"
        : "file";

    // Validate size, extension, and MIME type
    const validation = validateFileConstraints(
      { name: fileName, size: fileSize, type: fileMime },
      targetType
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "File validation failed." },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique storage key
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const storageKey = `uploads/${userId}/${Date.now()}-${uniqueId}-${sanitizedName}`;

    // Upload to Backblaze B2 (with local fallback)
    const uploadResult = await uploadFileToB2({
      key: storageKey,
      buffer,
      contentType: fileMime || "application/octet-stream",
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: "Failed to upload file to storage." },
        { status: 500 }
      );
    }

    const downloadUrl = `/api/files/download?key=${encodeURIComponent(
      storageKey
    )}&filename=${encodeURIComponent(fileName)}`;

    const isSvg =
      fileName.toLowerCase().endsWith(".svg") ||
      Boolean(fileMime && fileMime.toLowerCase().includes("svg"));

    const previewUrl = isSvg
      ? `${downloadUrl}&preview=true`
      : `${downloadUrl}&inline=true`;

    return NextResponse.json({
      success: true,
      fileName,
      fileSize,
      mimeType: fileMime || (targetType === "image" ? "image/png" : "application/octet-stream"),
      storageKey,
      fileUrl: downloadUrl,
      previewUrl,
    });
  } catch (error) {
    console.error("Error in /api/upload:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred while processing the file upload.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
