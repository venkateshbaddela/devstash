import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Configuration for Backblaze B2 (S3-compatible API)
const rawEndpoint = process.env.B2_ENDPOINT || "s3.us-east-005.backblazeb2.com";
const endpoint = rawEndpoint.trim().replace(/^["']|["']$/g, "");
const fullEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
const region = (process.env.B2_REGION || "us-east-005").trim().replace(/^["']|["']$/g, "");
const bucketName = (process.env.B2_BUCKET_NAME || "devstash-files").trim().replace(/^["']|["']$/g, "");
const accessKeyId = (process.env.B2_ACCESS_KEY_ID || "").trim().replace(/^["']|["']$/g, "");
const secretAccessKey = (process.env.B2_SECRET_ACCESS_KEY || "").trim().replace(/^["']|["']$/g, "");

export const s3Client = new S3Client({
  endpoint: fullEndpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export interface UploadResult {
  key: string;
  success: boolean;
}

/**
 * Uploads a file buffer directly to the Backblaze B2 bucket.
 * Throws an error if credentials are missing or the B2 S3 command fails,
 * ensuring failures surface to the user rather than silently writing locally.
 */
export async function uploadFileToB2(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<UploadResult> {
  const { key, buffer, contentType } = params;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Backblaze B2 credentials (B2_ACCESS_KEY_ID or B2_SECRET_ACCESS_KEY) are not configured."
    );
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { key, success: true };
  } catch (err: unknown) {
    console.error(
      "Backblaze B2 S3 upload failed:",
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
}

export interface StoredFileData {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
}

/**
 * Retrieves a file directly from the Backblaze B2 bucket.
 * Returns null if the object is not found (404 or NoSuchKey).
 */
export async function getFileFromB2(key: string): Promise<StoredFileData | null> {
  if (!accessKeyId || !secretAccessKey) {
    console.warn("Backblaze B2 credentials not configured.");
    return null;
  }

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    if (response.Body) {
      const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
        return new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          const nodeStream = stream as NodeJS.ReadableStream;
          nodeStream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          nodeStream.on("error", (err) => reject(err));
          nodeStream.on("end", () => resolve(Buffer.concat(chunks)));
        });
      };

      const buffer = await streamToBuffer(response.Body);
      return {
        buffer,
        contentType: response.ContentType || "application/octet-stream",
        contentLength: response.ContentLength || buffer.length,
      };
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      (("name" in err && (err.name === "NoSuchKey" || err.name === "NotFound")) ||
        ("$metadata" in err &&
          (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404))
    ) {
      return null;
    }
    console.error(
      "Backblaze B2 S3 get failed:",
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }

  return null;
}

/**
 * Deletes a file directly from the Backblaze B2 bucket.
 */
export async function deleteFileFromB2(key: string): Promise<boolean> {
  if (!accessKeyId || !secretAccessKey) {
    console.warn("Backblaze B2 credentials not configured, skipping B2 deletion.");
    return false;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (err: unknown) {
    console.error(
      "Backblaze B2 S3 delete failed:",
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}
