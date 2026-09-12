import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItemById, updateItem, deleteItem, createItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

const mockTx = {
  itemTag: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  tag: {
    upsert: vi.fn(),
  },
  item: {
    update: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    itemType: {
      findFirst: vi.fn(),
    },
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemTag: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  },
}));

vi.mock("@/lib/db/collections", () => ({
  getDefaultUserId: vi.fn().mockResolvedValue("demo-user-id"),
}));

const mockDbItem = {
  id: "item-123",
  title: "useAuth Hook",
  description: "Custom authentication hook for React applications",
  content: "export function useAuth() { return useContext(AuthContext); }",
  contentType: "TEXT",
  url: null,
  language: "typescript",
  fileUrl: null,
  fileName: null,
  fileSize: BigInt(1024),
  mimeType: null,
  isFavorite: true,
  isPinned: false,
  createdAt: new Date("2024-01-15T12:00:00.000Z"),
  updatedAt: new Date("2024-01-15T14:30:00.000Z"),
  itemType: {
    id: "type-1",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
  },
  tags: [
    { tag: { id: "tag-1", name: "react" } },
    { tag: { id: "tag-2", name: "auth" } },
  ],
  collections: [
    {
      collection: {
        id: "col-1",
        name: "React Patterns",
        color: "#3b82f6",
      },
    },
  ],
};

describe("Item Database Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getItemById Query Function", () => {
    it("fetches and maps item details correctly with formatted fields", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>
      );

      const result = await getItemById("item-123", "user-456");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("item-123");
      expect(result?.title).toBe("useAuth Hook");
      expect(result?.description).toBe("Custom authentication hook for React applications");
      expect(result?.content).toBe("export function useAuth() { return useContext(AuthContext); }");
      expect(result?.contentType).toBe("TEXT");
      expect(result?.language).toBe("typescript");
      expect(result?.isFavorite).toBe(true);
      expect(result?.isPinned).toBe(false);
      expect(result?.type).toBe("snippet");
      expect(result?.typeDisplayName).toBe("Snippets");
      expect(result?.typeIcon).toBe("Code");
      expect(result?.typeColor).toBe("#3b82f6");
      expect(result?.isPro).toBe(false);
      expect(result?.fileSize).toBe(1024);
      expect(result?.tags).toEqual(["react", "auth"]);
      expect(result?.collections).toEqual([
        { id: "col-1", name: "React Patterns", color: "#3b82f6" },
      ]);
      expect(result?.formattedCreatedAt).toBe("January 15, 2024");
      expect(result?.formattedUpdatedAt).toBe("January 15, 2024");
    });

    it("identifies PRO status for file and image items", async () => {
      const fileDbItem = {
        ...mockDbItem,
        itemType: {
          id: "type-5",
          name: "file",
          icon: "File",
          color: "#6b7280",
        },
      };

      vi.mocked(prisma.item.findFirst).mockResolvedValue(
        fileDbItem as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>
      );

      const result = await getItemById("item-file", "user-456");
      expect(result?.isPro).toBe(true);
      expect(result?.typeDisplayName).toBe("Files");
    });

    it("falls back to default demo user if userId is not provided", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>
      );

      await getItemById("item-123");

      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: {
          id: "item-123",
          userId: "demo-user-id",
        },
        include: expect.any(Object),
      });
    });

    it("returns null when item is not found", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

      const result = await getItemById("non-existent-id", "user-456");
      expect(result).toBeNull();
    });

    it("returns null when neither userId nor demo user can be resolved", async () => {
      const { getDefaultUserId } = await import("@/lib/db/collections");
      vi.mocked(getDefaultUserId).mockResolvedValueOnce(null);

      const result = await getItemById("item-123");
      expect(result).toBeNull();
      expect(prisma.item.findFirst).not.toHaveBeenCalled();
    });

    it("handles items with empty optional fields and null fileSize gracefully", async () => {
      const minimalItem = {
        ...mockDbItem,
        fileSize: null,
        language: null,
        description: null,
        tags: [],
        collections: [],
      };

      vi.mocked(prisma.item.findFirst).mockResolvedValue(
        minimalItem as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>
      );

      const result = await getItemById("item-min", "user-456");
      expect(result).not.toBeNull();
      expect(result?.fileSize).toBeNull();
      expect(result?.language).toBeNull();
      expect(result?.description).toBeNull();
      expect(result?.tags).toEqual([]);
      expect(result?.collections).toEqual([]);
    });
  });

  describe("updateItem Query Function", () => {
    it("returns null when item does not exist or user does not own it", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

      const result = await updateItem("non-existent-id", "user-123", {
        title: "New Title",
      });

      expect(result).toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns null when userId cannot be resolved", async () => {
      const { getDefaultUserId } = await import("@/lib/db/collections");
      vi.mocked(getDefaultUserId).mockResolvedValueOnce(null);

      const result = await updateItem("item-123", undefined, {
        title: "New Title",
      });

      expect(result).toBeNull();
      expect(prisma.item.findFirst).not.toHaveBeenCalled();
    });

    it("updates item fields and reconciles tags inside transaction", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue({
        id: "item-123",
        userId: "user-123",
      } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);

      mockTx.tag.upsert.mockResolvedValue({ id: "tag-new-id", name: "nextjs" });
      mockTx.item.update.mockResolvedValue({
        ...mockDbItem,
        title: "Updated Title",
        description: "Updated Description",
        tags: [{ tag: { id: "tag-new-id", name: "nextjs" } }],
      });

      const result = await updateItem("item-123", "user-123", {
        title: "  Updated Title  ",
        description: "Updated Description",
        tags: ["nextjs", "nextjs"], // Deduplication check
      });

      expect(mockTx.itemTag.deleteMany).toHaveBeenCalledWith({
        where: { itemId: "item-123" },
      });
      expect(mockTx.tag.upsert).toHaveBeenCalledTimes(1);
      expect(mockTx.tag.upsert).toHaveBeenCalledWith({
        where: {
          userId_name: {
            userId: "user-123",
            name: "nextjs",
          },
        },
        create: {
          name: "nextjs",
          userId: "user-123",
        },
        update: {},
      });
      expect(mockTx.itemTag.create).toHaveBeenCalledWith({
        data: {
          itemId: "item-123",
          tagId: "tag-new-id",
        },
      });
      expect(mockTx.item.update).toHaveBeenCalledWith({
        where: { id: "item-123" },
        data: {
          title: "Updated Title",
          description: "Updated Description",
          content: undefined,
          url: undefined,
          language: undefined,
        },
        include: expect.any(Object),
      });

      expect(result?.title).toBe("Updated Title");
      expect(result?.tags).toEqual(["nextjs"]);
    });

    it("preserves existing tags when tags property is undefined", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue({
        id: "item-123",
        userId: "user-123",
      } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);

      mockTx.item.update.mockResolvedValue(mockDbItem);

      await updateItem("item-123", "user-123", {
        title: "Only Title Changed",
      });

      expect(mockTx.itemTag.deleteMany).not.toHaveBeenCalled();
      expect(mockTx.tag.upsert).not.toHaveBeenCalled();
    });

    it("clears all tags when tags property is an empty array", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue({
        id: "item-123",
        userId: "user-123",
      } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);

      mockTx.item.update.mockResolvedValue({
        ...mockDbItem,
        tags: [],
      });

      const result = await updateItem("item-123", "user-123", {
        title: "Cleared Tags",
        tags: [],
      });

      expect(mockTx.itemTag.deleteMany).toHaveBeenCalledWith({
        where: { itemId: "item-123" },
      });
      expect(mockTx.tag.upsert).not.toHaveBeenCalled();
      expect(result?.tags).toEqual([]);
    });
  });

  describe("deleteItem Query Function", () => {
    it("returns false if itemId is empty or invalid", async () => {
      const res1 = await deleteItem("", "user-123");
      expect(res1).toBe(false);

      const res2 = await deleteItem("   ", "user-123");
      expect(res2).toBe(false);
    });

    it("returns false if no target user can be resolved", async () => {
      const { getDefaultUserId } = await import("@/lib/db/collections");
      vi.mocked(getDefaultUserId).mockResolvedValueOnce(null);

      const res = await deleteItem("item-123", null);
      expect(res).toBe(false);
    });

    it("returns false if the item does not exist or does not belong to user", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

      const res = await deleteItem("non-existent-item", "user-123");

      expect(res).toBe(false);
      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: { id: "non-existent-item", userId: "user-123" },
        select: { id: true },
      });
      expect(prisma.item.delete).not.toHaveBeenCalled();
    });

    it("deletes the item and returns true when item exists and belongs to user", async () => {
      vi.mocked(prisma.item.findFirst).mockResolvedValue({
        id: "item-123",
      } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);
      vi.mocked(prisma.item.delete).mockResolvedValue({
        id: "item-123",
      } as unknown as Awaited<ReturnType<typeof prisma.item.delete>>);

      const res = await deleteItem("item-123", "user-123");

      expect(res).toBe(true);
      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: { id: "item-123", userId: "user-123" },
        select: { id: true },
      });
      expect(prisma.item.delete).toHaveBeenCalledWith({
        where: { id: "item-123" },
      });
    });
  });

  describe("createItem Query Function", () => {
    it("returns null if target user cannot be resolved", async () => {
      const { getDefaultUserId } = await import("@/lib/db/collections");
      vi.mocked(getDefaultUserId).mockResolvedValueOnce(null);

      const res = await createItem(null, {
        type: "snippet",
        title: "Test Snippet",
      });

      expect(res).toBe(null);
    });

    it("returns null if the system item type cannot be found", async () => {
      vi.mocked(prisma.itemType.findFirst).mockResolvedValue(null);

      const res = await createItem("user-123", {
        type: "unknown-type",
        title: "Invalid Type Item",
      });

      expect(res).toBe(null);
      expect(prisma.itemType.findFirst).toHaveBeenCalledWith({
        where: {
          name: "unknown-type",
          OR: [{ userId: "user-123" }, { userId: null }],
        },
      });
    });

    it("creates a snippet item with TEXT contentType and links tags", async () => {
      vi.mocked(prisma.itemType.findFirst).mockResolvedValue({
        id: "type-snippet-id",
        name: "snippet",
        icon: "Code",
        color: "#3b82f6",
      } as unknown as Awaited<ReturnType<typeof prisma.itemType.findFirst>>);

      mockTx.item.create.mockResolvedValue({
        id: "created-snippet-123",
      });

      mockTx.tag.upsert.mockResolvedValue({
        id: "tag-react-id",
        name: "react",
        userId: "user-123",
      });

      mockTx.item.findUnique.mockResolvedValue({
        ...mockDbItem,
        id: "created-snippet-123",
        title: "New Snippet",
        tags: [{ tag: { id: "tag-react-id", name: "react" } }],
      });

      const res = await createItem("user-123", {
        type: "snippet",
        title: "New Snippet",
        content: "const a = 1;",
        language: "typescript",
        tags: ["react"],
      });

      expect(mockTx.item.create).toHaveBeenCalledWith({
        data: {
          title: "New Snippet",
          description: null,
          contentType: "TEXT",
          content: "const a = 1;",
          url: null,
          language: "typescript",
          userId: "user-123",
          itemTypeId: "type-snippet-id",
        },
      });

      expect(mockTx.tag.upsert).toHaveBeenCalledWith({
        where: {
          userId_name: {
            userId: "user-123",
            name: "react",
          },
        },
        create: {
          name: "react",
          userId: "user-123",
        },
        update: {},
      });

      expect(mockTx.itemTag.create).toHaveBeenCalledWith({
        data: {
          itemId: "created-snippet-123",
          tagId: "tag-react-id",
        },
      });

      expect(res).not.toBeNull();
      expect(res?.id).toBe("created-snippet-123");
    });

    it("creates a link item with URL contentType", async () => {
      vi.mocked(prisma.itemType.findFirst).mockResolvedValue({
        id: "type-link-id",
        name: "link",
        icon: "Link2",
        color: "#f97316",
      } as unknown as Awaited<ReturnType<typeof prisma.itemType.findFirst>>);

      mockTx.item.create.mockResolvedValue({
        id: "created-link-123",
      });

      mockTx.item.findUnique.mockResolvedValue({
        ...mockDbItem,
        id: "created-link-123",
        title: "DevStash Documentation",
        contentType: "URL",
        url: "https://devstash.io/docs",
        tags: [],
      });

      const res = await createItem("user-123", {
        type: "link",
        title: "DevStash Documentation",
        url: "https://devstash.io/docs",
      });

      expect(mockTx.item.create).toHaveBeenCalledWith({
        data: {
          title: "DevStash Documentation",
          description: null,
          contentType: "URL",
          content: null,
          url: "https://devstash.io/docs",
          language: null,
          userId: "user-123",
          itemTypeId: "type-link-id",
        },
      });

      expect(res).not.toBeNull();
      expect(res?.id).toBe("created-link-123");
    });
  });
});
