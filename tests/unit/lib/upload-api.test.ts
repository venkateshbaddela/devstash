import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { POST as uploadPost } from "@/app/api/upload/route";
import { GET as downloadGet } from "@/app/api/files/download/route";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import { uploadFileToB2, getFileFromB2 } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  getDefaultUserId: vi.fn().mockResolvedValue("demo-user-id"),
}));

vi.mock("@/lib/storage", () => ({
  uploadFileToB2: vi.fn().mockResolvedValue({ key: "uploads/user/test.pdf", success: true }),
  getFileFromB2: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
    checkRateLimit: vi.fn().mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 20,
      reset: Date.now() + 60000,
      retryAfterSeconds: 0,
    }),
  };
});

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

describe("File Upload & Download API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@devstash.io" },
      expires: "2099-01-01",
    });
  });

  describe("POST /api/upload", () => {
    it("returns 401 if unauthenticated and no default user", async () => {
      mockAuth.mockResolvedValue(null);
      vi.mocked(getDefaultUserId).mockResolvedValue(null as unknown as string);

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("returns 400 if no file is provided", async () => {
      const formData = new FormData();
      formData.append("type", "file");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("No file was provided");
    });

    it("returns 400 if image exceeds 5 MB constraint", async () => {
      const formData = new FormData();
      // 6 MB dummy file
      const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: "image/png" });
      formData.append("file", bigBlob, "huge-screenshot.png");
      formData.append("type", "image");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("exceeds the maximum allowed limit of 5 MB");
    });

    it("returns 429 when upload rate limit is exceeded", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: false,
        limit: 20,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfterSeconds: 60,
        errorMessage: "Too many attempts. Please try again in 1 minute.",
      });

      const formData = new FormData();
      const validBlob = new Blob([new Uint8Array(100)], { type: "image/png" });
      formData.append("file", validBlob, "test.png");
      formData.append("type", "image");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("60");
      const json = await res.json();
      expect(json.error).toContain("Too many attempts");
    });

    it("returns 200 and upload metadata on valid file upload", async () => {
      const formData = new FormData();
      const validBlob = new Blob(["test content"], { type: "application/pdf" });
      formData.append("file", validBlob, "document.pdf");
      formData.append("type", "file");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.fileName).toBe("document.pdf");
      expect(json.mimeType).toBe("application/pdf");
      expect(json.storageKey).toContain("uploads/user-123/");
      expect(json.fileUrl).toContain("/api/files/download?key=");
      expect(uploadFileToB2).toHaveBeenCalled();
    });

    it("returns previewUrl with preview=true when SVG is uploaded", async () => {
      const formData = new FormData();
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      formData.append("file", svgBlob, "icon.svg");
      formData.append("type", "image");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.fileName).toBe("icon.svg");
      expect(json.mimeType).toBe("image/svg+xml");
      expect(json.previewUrl).toContain("preview=true");
      expect(json.fileUrl).not.toContain("preview=true");
    });

    it("returns previewUrl with inline=true when raster image (PNG) is uploaded", async () => {
      const formData = new FormData();
      const pngBlob = new Blob([new Uint8Array(10)], { type: "image/png" });
      formData.append("file", pngBlob, "photo.png");
      formData.append("type", "image");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.fileName).toBe("photo.png");
      expect(json.mimeType).toBe("image/png");
      expect(json.previewUrl).toContain("inline=true");
    });

    it("returns 500 when Backblaze B2 upload fails", async () => {
      vi.mocked(uploadFileToB2).mockRejectedValueOnce(
        new Error("Backblaze B2 connection timeout")
      );

      const formData = new FormData();
      const validBlob = new Blob(["test content"], { type: "text/plain" });
      formData.append("file", validBlob, "notes.txt");
      formData.append("type", "file");

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Backblaze B2 connection timeout");
    });
  });

  describe("GET /api/files/download", () => {
    it("returns 400 when storage key is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/files/download");
      const res = await downloadGet(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("File key is required");
    });

    it("returns 400 when storage key contains directory traversal or invalid format", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/../etc/passwd"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid file key format");
    });

    it("returns 403 Forbidden when accessing another user's file prefix without item ownership", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/victim-user-999/secret.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("returns 200 when accessing file with different prefix if user owns the Item in database", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue({ id: "item-owned-1" } as unknown as { id: string } as never);
      const testBuffer = Buffer.from("pdf-data-bytes");
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: testBuffer,
        contentType: "application/pdf",
        contentLength: testBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/legacy-prefix/doc.pdf&filename=doc.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
    });

    it("returns 404 when file is not found in storage", async () => {
      vi.mocked(getFileFromB2).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/missing.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("File not found");
    });

    it("returns 200 with attachment headers by default for standard files", async () => {
      const testBuffer = Buffer.from("pdf-data-bytes");
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: testBuffer,
        contentType: "application/pdf",
        contentLength: testBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/spec.pdf&filename=spec.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Content-Length")).toBe(String(testBuffer.length));
    });

    it("serves raster images (PNG, JPG, WEBP, GIF) inline when inline=true is requested", async () => {
      const formats = [
        { ext: "png", mime: "image/png" },
        { ext: "jpg", mime: "image/jpeg" },
        { ext: "webp", mime: "image/webp" },
        { ext: "gif", mime: "image/gif" },
      ];

      for (const format of formats) {
        const testBuffer = Buffer.from(`dummy-${format.ext}-data`);
        vi.mocked(getFileFromB2).mockResolvedValue({
          buffer: testBuffer,
          contentType: format.mime,
          contentLength: testBuffer.length,
        });

        const req = new NextRequest(
          `http://localhost:3000/api/files/download?key=uploads/user-123/test.${format.ext}&filename=test.${format.ext}&inline=true`
        );
        const res = await downloadGet(req);
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe(format.mime);
        expect(res.headers.get("Content-Disposition")).toContain("inline; filename=");
        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      }
    });

    it("never serves original SVG inline even if inline=true is requested", async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: svgBuffer,
        contentType: "image/svg+xml",
        contentLength: svgBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/vector.svg&filename=vector.svg&inline=true"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      // Must be forced to attachment, never inline
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Content-Disposition")).not.toContain("inline");
      expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    });

    it("serves original SVG as attachment when downloaded without preview parameter", async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: svgBuffer,
        contentType: "image/svg+xml",
        contentLength: svgBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/vector.svg&filename=vector.svg"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    });

    it("generates safe raster PNG preview when preview=true is requested for SVG", async () => {
      const validSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="blue"/></svg>'
      );
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: validSvg,
        contentType: "image/svg+xml",
        contentLength: validSvg.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/logo.svg&filename=logo.svg&preview=true"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("Content-Disposition")).toContain("inline; filename=");
      expect(res.headers.get("Content-Disposition")).toContain("logo.png");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      // Check response body is valid PNG buffer (starts with PNG signature bytes 0x89, 0x50, 0x4E, 0x47)
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4e);
      expect(buffer[3]).toBe(0x47);
    });

    it("returns 500 if SVG rasterization fails", async () => {
      const invalidSvgBuffer = Buffer.from("not a valid svg content at all");
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: invalidSvgBuffer,
        contentType: "image/svg+xml",
        contentLength: invalidSvgBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user-123/corrupt.svg&filename=corrupt.svg&preview=true"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Failed to generate preview for SVG image");
    });
  });
});
