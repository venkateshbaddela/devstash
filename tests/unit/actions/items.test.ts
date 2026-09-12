import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Session } from "next-auth";
import { updateItemAction } from "@/actions/items";
import { updateItemSchema } from "@/lib/validations/items";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { updateItem as updateItemDb } from "@/lib/db/items";
import { getDefaultUserId } from "@/lib/db/collections";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  getDefaultUserId: vi.fn().mockResolvedValue("demo-user-id"),
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: vi.fn(),
}));

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

const createMockSession = (id = "user-123"): Session => ({
  user: {
    id,
    email: "test@devstash.io",
    name: "Test Developer",
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
});

const mockUpdatedItem = {
  id: "item-1",
  title: "Updated Title",
  description: "Updated Description",
  content: "console.log('hello');",
  contentType: "TEXT",
  url: null,
  language: "javascript",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  isFavorite: false,
  isPinned: false,
  type: "snippet",
  typeDisplayName: "Snippets",
  typeIcon: "Code",
  typeColor: "#3b82f6",
  isPro: false,
  tags: ["javascript", "utils"],
  collections: [],
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-12T07:00:00.000Z",
  formattedCreatedAt: "September 1, 2026",
  formattedUpdatedAt: "September 12, 2026",
};

describe("Items Server Actions & Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateItemSchema validation", () => {
    it("validates a complete valid payload", () => {
      const result = updateItemSchema.safeParse({
        title: "Docker Compose for Next.js",
        description: "Production ready compose file",
        content: "version: '3.8'",
        url: "https://docker.com",
        language: "yaml",
        tags: ["docker", "devops"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Docker Compose for Next.js");
        expect(result.data.description).toBe("Production ready compose file");
        expect(result.data.url).toBe("https://docker.com");
        expect(result.data.tags).toEqual(["docker", "devops"]);
      }
    });

    it("fails when title is empty or only whitespace", () => {
      const result1 = updateItemSchema.safeParse({ title: "" });
      expect(result1.success).toBe(false);

      const result2 = updateItemSchema.safeParse({ title: "   " });
      expect(result2.success).toBe(false);
    });

    it("fails when title exceeds 255 characters", () => {
      const result = updateItemSchema.safeParse({ title: "a".repeat(256) });
      expect(result.success).toBe(false);
    });

    it("transforms empty strings in optional fields to null", () => {
      const result = updateItemSchema.safeParse({
        title: "Valid Title",
        description: "   ",
        content: "",
        url: "",
        language: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
        expect(result.data.content).toBeNull();
        expect(result.data.url).toBeNull();
        expect(result.data.language).toBeNull();
      }
    });

    it("fails when URL is invalid", () => {
      const result = updateItemSchema.safeParse({
        title: "Test Bookmark",
        url: "not-a-valid-url",
      });

      expect(result.success).toBe(false);
    });

    it("accepts valid http and https URLs", () => {
      const result = updateItemSchema.safeParse({
        title: "Test Bookmark",
        url: "https://nextjs.org/docs",
      });

      expect(result.success).toBe(true);
    });

    it("fails when an empty tag string is provided inside tags array", () => {
      const result = updateItemSchema.safeParse({
        title: "Test Item",
        tags: ["valid", ""],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateItemAction", () => {
    it("fails when itemId is empty or missing", async () => {
      const result = await updateItemAction("", { title: "New Title" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Item ID is required");
    });

    it("fails when title is missing from payload", async () => {
      const result = await updateItemAction("item-1", { title: "" });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("fails when user is unauthorized and no default demo user exists", async () => {
      mockAuth.mockResolvedValue(null);
      vi.mocked(getDefaultUserId).mockResolvedValueOnce(null);

      const result = await updateItemAction("item-1", { title: "New Title" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("uses authenticated session user ID when available", async () => {
      mockAuth.mockResolvedValue(createMockSession("auth-user-456"));
      vi.mocked(updateItemDb).mockResolvedValue(mockUpdatedItem);

      const result = await updateItemAction("item-1", {
        title: "Updated Title",
        tags: ["javascript"],
      });

      expect(result.success).toBe(true);
      expect(updateItemDb).toHaveBeenCalledWith("item-1", "auth-user-456", {
        title: "Updated Title",
        description: null,
        content: null,
        url: null,
        language: null,
        tags: ["javascript"],
      });
    });

    it("falls back to default demo user ID when session is unauthenticated", async () => {
      mockAuth.mockResolvedValue(null);
      vi.mocked(getDefaultUserId).mockResolvedValue("demo-user-id");
      vi.mocked(updateItemDb).mockResolvedValue(mockUpdatedItem);

      const result = await updateItemAction("item-1", {
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
      expect(updateItemDb).toHaveBeenCalledWith("item-1", "demo-user-id", expect.any(Object));
    });

    it("returns error when item is not found or does not belong to the user", async () => {
      mockAuth.mockResolvedValue(createMockSession("user-123"));
      vi.mocked(updateItemDb).mockResolvedValue(null);

      const result = await updateItemAction("non-existent-id", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Item not found or you do not have permission");
    });

    it("successfully updates item, triggers path revalidations, and returns updated data", async () => {
      mockAuth.mockResolvedValue(createMockSession("user-123"));
      vi.mocked(updateItemDb).mockResolvedValue(mockUpdatedItem);

      const result = await updateItemAction("item-1", {
        title: "Updated Title",
        description: "Updated Description",
        language: "javascript",
        tags: ["javascript", "utils"],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedItem);
      expect(result.message).toBe("Item updated successfully.");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePath).toHaveBeenCalledWith("/items", "layout");
    });

    it("handles database exceptions gracefully", async () => {
      mockAuth.mockResolvedValue(createMockSession("user-123"));
      vi.mocked(updateItemDb).mockRejectedValue(new Error("Database connection lost"));

      const result = await updateItemAction("item-1", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("An unexpected error occurred");
    });
  });
});
