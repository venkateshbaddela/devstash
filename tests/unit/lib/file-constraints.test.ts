import { describe, it, expect } from "vitest";
import {
  IMAGE_CONSTRAINTS,
  FILE_CONSTRAINTS,
  validateFileConstraints,
  getFileExtension,
  formatFileSize,
} from "@/lib/file-constraints";

describe("File Constraints & Validation Utility", () => {
  describe("getFileExtension", () => {
    it("extracts extension in lowercase including dot", () => {
      expect(getFileExtension("photo.PNG")).toBe(".png");
      expect(getFileExtension("document.spec.pdf")).toBe(".pdf");
      expect(getFileExtension("archive.tar.gz")).toBe(".gz");
    });

    it("returns empty string when no extension is present", () => {
      expect(getFileExtension("Dockerfile")).toBe("");
      expect(getFileExtension("")).toBe("");
    });
  });

  describe("formatFileSize", () => {
    it("formats 0 bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(null)).toBe("0 B");
      expect(formatFileSize(undefined)).toBe("0 B");
    });

    it("formats bytes, kilobytes, and megabytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1048576)).toBe("1.0 MB");
      expect(formatFileSize(5242880)).toBe("5.0 MB");
      expect(formatFileSize(BigInt(10485760))).toBe("10.0 MB");
    });
  });

  describe("validateFileConstraints for images", () => {
    it("allows valid image files within 5 MB", () => {
      for (const ext of IMAGE_CONSTRAINTS.allowedExtensions) {
        const res = validateFileConstraints(
          { name: `test-image${ext}`, size: 2 * 1024 * 1024, type: "image/png" },
          "image"
        );
        expect(res.valid).toBe(true);
      }
    });

    it("rejects images exceeding 5 MB", () => {
      const res = validateFileConstraints(
        {
          name: "large-architecture.png",
          size: 5 * 1024 * 1024 + 1,
          type: "image/png",
        },
        "image"
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds the maximum allowed limit of 5 MB");
    });

    it("rejects non-image extensions", () => {
      const disallowed = ["document.pdf", "script.sh", "archive.zip", "video.mp4"];
      for (const name of disallowed) {
        const res = validateFileConstraints(
          { name, size: 500 * 1024, type: "application/pdf" },
          "image"
        );
        expect(res.valid).toBe(false);
        expect(res.error).toContain("Unsupported image format");
      }
    });

    it("rejects invalid MIME types for images", () => {
      const res = validateFileConstraints(
        { name: "fake-image.png", size: 1024, type: "application/x-executable" },
        "image"
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Invalid MIME type");
    });
  });

  describe("validateFileConstraints for files", () => {
    it("allows valid document files within 10 MB", () => {
      for (const ext of FILE_CONSTRAINTS.allowedExtensions) {
        const res = validateFileConstraints(
          { name: `sample-doc${ext}`, size: 4 * 1024 * 1024, type: "text/plain" },
          "file"
        );
        expect(res.valid).toBe(true);
      }
    });

    it("rejects files exceeding 10 MB", () => {
      const res = validateFileConstraints(
        {
          name: "huge-dump.json",
          size: 10 * 1024 * 1024 + 1,
          type: "application/json",
        },
        "file"
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds the maximum allowed limit of 10 MB");
    });

    it("rejects unsupported file extensions", () => {
      const disallowed = ["executable.exe", "bundle.apk", "movie.mkv", "app.dmg"];
      for (const name of disallowed) {
        const res = validateFileConstraints(
          { name, size: 500 * 1024, type: "application/octet-stream" },
          "file"
        );
        expect(res.valid).toBe(false);
        expect(res.error).toContain("Unsupported file format");
      }
    });

    it("accepts generic text and octet-stream MIME types for valid extensions", () => {
      const res = validateFileConstraints(
        { name: "config.toml", size: 1024, type: "application/octet-stream" },
        "file"
      );
      expect(res.valid).toBe(true);

      const res2 = validateFileConstraints(
        { name: "settings.ini", size: 512, type: "text/plain" },
        "file"
      );
      expect(res2.valid).toBe(true);
    });
  });
});
