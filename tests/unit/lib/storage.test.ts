import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadFileToB2, getFileFromB2, deleteFileFromB2, s3Client } from "@/lib/storage";
import { Readable } from "node:stream";

describe("Storage Service (Backblaze B2 Direct Storage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a file buffer to B2 and returns success and storage key", async () => {
    vi.spyOn(s3Client, "send").mockResolvedValueOnce({} as never);

    const buffer = Buffer.from("console.log('test file')");
    const key = `uploads/user-test/${Date.now()}-test.txt`;

    const result = await uploadFileToB2({
      key,
      buffer,
      contentType: "text/plain",
    });

    expect(result.success).toBe(true);
    expect(result.key).toBe(key);
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });

  it("throws an error when Backblaze B2 upload fails (no silent fallback)", async () => {
    vi.spyOn(s3Client, "send").mockRejectedValueOnce(
      new Error("Backblaze B2 bucket access denied")
    );

    const buffer = Buffer.from("failing file");
    const key = `uploads/user-test/${Date.now()}-fail.txt`;

    await expect(
      uploadFileToB2({
        key,
        buffer,
        contentType: "text/plain",
      })
    ).rejects.toThrow("Backblaze B2 bucket access denied");
  });

  it("retrieves an uploaded file from B2 by key", async () => {
    const content = JSON.stringify({ hello: "world" });
    const buffer = Buffer.from(content);
    const stream = Readable.from(buffer);

    vi.spyOn(s3Client, "send").mockResolvedValueOnce({
      Body: stream,
      ContentType: "application/json",
      ContentLength: buffer.length,
    } as never);

    const key = `uploads/user-test/${Date.now()}-data.json`;
    const fetched = await getFileFromB2(key);

    expect(fetched).not.toBeNull();
    if (fetched) {
      expect(fetched.buffer.toString()).toBe(content);
      expect(fetched.contentLength).toBe(buffer.length);
      expect(fetched.contentType).toBe("application/json");
    }
  });

  it("returns null when file is not found (NoSuchKey)", async () => {
    const notFoundError = new Error("Object not found");
    notFoundError.name = "NoSuchKey";
    vi.spyOn(s3Client, "send").mockRejectedValueOnce(notFoundError);

    const fetched = await getFileFromB2("non-existent-key-12345");
    expect(fetched).toBeNull();
  });

  it("deletes a file from B2 by key", async () => {
    vi.spyOn(s3Client, "send").mockResolvedValueOnce({} as never);

    const key = `uploads/user-test/${Date.now()}-temp.txt`;
    const deleteResult = await deleteFileFromB2(key);

    expect(deleteResult).toBe(true);
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });

  it("returns false if B2 delete fails", async () => {
    vi.spyOn(s3Client, "send").mockRejectedValueOnce(new Error("B2 delete error"));

    const key = `uploads/user-test/${Date.now()}-fail-delete.txt`;
    const deleteResult = await deleteFileFromB2(key);

    expect(deleteResult).toBe(false);
  });
});
