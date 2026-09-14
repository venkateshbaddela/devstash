import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import { getFileFromB2 } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const requestedFileName = searchParams.get("filename");
    const isInline = searchParams.get("inline") === "true" || searchParams.get("inline") === "1";

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json(
        { error: "File key is required." },
        { status: 400 }
      );
    }

    const cleanKey = key.trim();

    // Authenticate user check (soft guard)
    let session = null;
    try {
      session = await auth();
    } catch {
      // In standalone / non-request context
    }

    const userId = session?.user?.id ?? (await getDefaultUserId());
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access files." },
        { status: 401 }
      );
    }

    // Fetch file from Backblaze B2 (or dev storage fallback)
    const fileData = await getFileFromB2(cleanKey);

    if (!fileData) {
      return NextResponse.json(
        { error: "File not found or has been removed from storage." },
        { status: 404 }
      );
    }

    const fileName =
      requestedFileName?.trim() ||
      cleanKey.split("/").pop() ||
      "downloaded-file";

    const safeFileName = fileName.replace(/["\r\n]/g, "_");
    const dispositionType = isInline ? "inline" : "attachment";

    const headers = new Headers();
    headers.set("Content-Type", fileData.contentType || "application/octet-stream");
    headers.set("Content-Length", String(fileData.contentLength));
    headers.set(
      "Content-Disposition",
      `${dispositionType}; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(
        safeFileName
      )}`
    );
    headers.set("Cache-Control", "private, max-age=86400, stale-while-revalidate=3600");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(new Uint8Array(fileData.buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in /api/files/download:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while downloading the file." },
      { status: 500 }
    );
  }
}
