import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import { getFileFromB2 } from "@/lib/storage";
import sharp from "sharp";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const requestedFileName = searchParams.get("filename");
    const isInline = searchParams.get("inline") === "true" || searchParams.get("inline") === "1";
    const isPreview = searchParams.get("preview") === "true" || searchParams.get("preview") === "1";

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

    const isSvg =
      fileName.toLowerCase().endsWith(".svg") ||
      cleanKey.toLowerCase().endsWith(".svg") ||
      Boolean(fileData.contentType && fileData.contentType.toLowerCase().includes("svg"));

    // If SVG preview is requested, safely convert SVG to rasterized PNG using sharp
    if (isSvg && isPreview) {
      try {
        const pngBuffer = await sharp(fileData.buffer).png().toBuffer();
        const pngFileName = fileName.replace(/\.svg$/i, ".png");
        const safePngName = pngFileName.replace(/["\r\n]/g, "_");

        const headers = new Headers();
        headers.set("Content-Type", "image/png");
        headers.set("Content-Length", String(pngBuffer.length));
        headers.set(
          "Content-Disposition",
          `inline; filename="${safePngName}"; filename*=UTF-8''${encodeURIComponent(safePngName)}`
        );
        headers.set("Cache-Control", "private, max-age=86400, stale-while-revalidate=3600");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(new Uint8Array(pngBuffer), {
          status: 200,
          headers,
        });
      } catch (err) {
        console.error("Failed to generate SVG PNG preview:", err);
        return NextResponse.json(
          { error: "Failed to generate preview for SVG image." },
          { status: 500 }
        );
      }
    }

    const safeFileName = fileName.replace(/["\r\n]/g, "_");
    const headers = new Headers();

    if (isSvg) {
      // SVG download security:
      // NEVER allow original SVG to be served with Content-Disposition: inline
      headers.set("Content-Type", "image/svg+xml");
      headers.set("Content-Length", String(fileData.contentLength));
      headers.set(
        "Content-Disposition",
        `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`
      );
      headers.set("Cache-Control", "private, max-age=86400, stale-while-revalidate=3600");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Content-Security-Policy", "default-src 'none'; sandbox");

      return new Response(new Uint8Array(fileData.buffer), {
        status: 200,
        headers,
      });
    }

    // Normal raster images (PNG, JPG, JPEG, GIF, WebP) and other files
    const dispositionType = isInline ? "inline" : "attachment";
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
