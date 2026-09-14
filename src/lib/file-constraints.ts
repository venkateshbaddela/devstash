/**
 * File upload constraints and validation rules for DevStash Backblaze B2 storage.
 * Specified in context/features/file-image-spec.md.
 */

export const IMAGE_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  maxSizeLabel: "5 MB",
  allowedExtensions: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
  ] as const,
  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ] as const,
};

export const FILE_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxSizeLabel: "10 MB",
  allowedExtensions: [
    ".pdf",
    ".txt",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".csv",
    ".toml",
    ".ini",
  ] as const,
  allowedMimeTypes: [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/json",
    "application/x-yaml",
    "text/yaml",
    "application/xml",
    "text/xml",
    "text/csv",
    "application/toml",
  ] as const,
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Extracts the file extension including the leading dot, in lower case.
 */
export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes(".")) return "";
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return ext;
}

/**
 * Formats byte size into a human-readable string (e.g., 2.4 MB, 450 KB).
 */
export function formatFileSize(bytes: number | bigint | null | undefined): string {
  if (bytes === null || bytes === undefined) return "0 B";
  const num = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (num === 0) return "0 B";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates a file against constraints for the specified item type ("image" or "file").
 */
export function validateFileConstraints(
  file: { name: string; size: number; type?: string },
  targetType: "image" | "file"
): FileValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: "A valid file is required." };
  }

  const ext = getFileExtension(file.name);
  const mimeType = (file.type || "").toLowerCase().trim();

  if (targetType === "image") {
    // 1. Max size check
    if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
      return {
        valid: false,
        error: `Image size exceeds the maximum allowed limit of ${IMAGE_CONSTRAINTS.maxSizeLabel}.`,
      };
    }

    // 2. Extension check
    const isExtAllowed = (IMAGE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
    if (!isExtAllowed) {
      return {
        valid: false,
        error: `Unsupported image format (${ext || "no extension"}). Allowed: ${IMAGE_CONSTRAINTS.allowedExtensions.join(", ")}`,
      };
    }

    // 3. MIME type check if provided
    if (mimeType) {
      const isMimeAllowed = (IMAGE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(mimeType);
      if (!isMimeAllowed && !mimeType.startsWith("image/")) {
        return {
          valid: false,
          error: `Invalid MIME type (${mimeType}) for image upload.`,
        };
      }
    }

    return { valid: true };
  }

  // targetType === "file"
  // 1. Max size check
  if (file.size > FILE_CONSTRAINTS.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed limit of ${FILE_CONSTRAINTS.maxSizeLabel}.`,
    };
  }

  // 2. Extension check
  const isExtAllowed = (FILE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
  if (!isExtAllowed) {
    return {
      valid: false,
      error: `Unsupported file format (${ext || "no extension"}). Allowed: ${FILE_CONSTRAINTS.allowedExtensions.join(", ")}`,
    };
  }

  // 3. MIME type check if provided
  if (mimeType) {
    const isMimeAllowed = (FILE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(mimeType);
    // Note: Some browsers report .ini or .toml or .md as generic text/plain or application/octet-stream
    const isGenericText =
      mimeType === "text/plain" ||
      mimeType === "application/octet-stream" ||
      mimeType === "";

    if (!isMimeAllowed && !isGenericText) {
      return {
        valid: false,
        error: `Invalid MIME type (${mimeType}) for file upload.`,
      };
    }
  }

  return { valid: true };
}
