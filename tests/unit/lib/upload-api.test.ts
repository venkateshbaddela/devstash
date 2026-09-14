import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { POST as uploadPost } from "@/app/api/upload/route";
import { GET as downloadGet } from "@/app/api/files/download/route";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import { uploadFileToB2, getFileFromB2 } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
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

    it("returns 404 when file is not found in storage", async () => {
      vi.mocked(getFileFromB2).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user/missing.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("File not found");
    });

    it("returns 200 with attachment headers by default", async () => {
      const testBuffer = Buffer.from("pdf-data-bytes");
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: testBuffer,
        contentType: "application/pdf",
        contentLength: testBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user/spec.pdf&filename=spec.pdf"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      expect(res.headers.get("Content-Length")).toBe(String(testBuffer.length));
    });

    it("returns inline Content-Disposition when inline=true", async () => {
      const testBuffer = Buffer.from("image-png-bytes");
      vi.mocked(getFileFromB2).mockResolvedValue({
        buffer: testBuffer,
        contentType: "image/png",
        contentLength: testBuffer.length,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/files/download?key=uploads/user/photo.png&filename=photo.png&inline=true"
      );
      const res = await downloadGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toContain("inline; filename=");
    });
  });
});
