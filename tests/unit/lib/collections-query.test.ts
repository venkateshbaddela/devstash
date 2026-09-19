import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDashboardCollections,
  getCollections,
  getSidebarCollections,
  getCollectionStats,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionById,
  getCollectionItems,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemCollection: {
      findMany: vi.fn(),
    },
  },
}));

describe("Collections Database Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardCollections", () => {
    it("returns empty array if target user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getDashboardCollections();
      expect(result).toEqual([]);
    });

    it("queries with bounded collection limit and bounded relation items take", async () => {
      const mockCollections = [
        {
          id: "col-1",
          name: "Frontend Toolkit",
          description: "Useful frontend tools",
          isFavorite: true,
          color: "#10b981",
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-02"),
          _count: { items: 5 },
          items: [
            {
              item: {
                itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
              },
            },
            {
              item: {
                itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
              },
            },
            {
              item: {
                itemType: { name: "note", icon: "StickyNote", color: "#f59e0b" },
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.collection.findMany).mockResolvedValue(mockCollections as never);

      const result = await getDashboardCollections("user-test-1", 6);

      expect(prisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-test-1" },
          take: 6,
          include: expect.objectContaining({
            items: expect.objectContaining({
              take: 100,
            }),
            _count: {
              select: { items: true },
            },
          }),
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("col-1");
      expect(result[0].itemCount).toBe(5);
      expect(result[0].accentColor).toBe("#3b82f6"); // Snippet is most-used
      expect(result[0].types).toHaveLength(2);
      expect(result[0].types[0].name).toBe("snippet");
      expect(result[0].types[0].count).toBe(2);
      expect(result[0].types[1].name).toBe("note");
      expect(result[0].types[1].count).toBe(1);
    });
  });

  describe("getCollections", () => {
    it("defaults to limit = 50 to prevent unbounded queries", async () => {
      vi.mocked(prisma.collection.findMany).mockResolvedValue([]);

      await getCollections("user-test-1");

      expect(prisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-test-1" },
          take: 50,
        })
      );
    });

    it("respects custom limit when provided", async () => {
      vi.mocked(prisma.collection.findMany).mockResolvedValue([]);

      await getCollections("user-test-1", 25);

      expect(prisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-test-1" },
          take: 25,
        })
      );
    });
  });

  describe("getSidebarCollections", () => {
    it("fetches lightweight collection records without nested item rows", async () => {
      vi.mocked(prisma.collection.findMany).mockResolvedValue([
        {
          id: "col-side-1",
          name: "Quick Notes",
          isFavorite: false,
          color: "#8b5cf6",
          _count: { items: 3 },
        },
      ] as never);

      const result = await getSidebarCollections("user-test-1");

      expect(result).toEqual([
        {
          id: "col-side-1",
          name: "Quick Notes",
          isFavorite: false,
          color: "#8b5cf6",
          itemCount: 3,
        },
      ]);
    });
  });

  describe("getCollectionStats", () => {
    it("returns total and favorite counts", async () => {
      vi.mocked(prisma.collection.count)
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(4); // favorite

      const stats = await getCollectionStats("user-test-1");

      expect(stats).toEqual({
        totalCollections: 12,
        favoriteCollections: 4,
      });
    });
  });

  describe("createCollection", () => {
    it("creates a new collection record scoped to the user with default values", async () => {
      const mockCreated = {
        id: "col-new-1",
        name: "Cloud Architecture",
        description: "AWS and GCP resources",
        isFavorite: false,
        color: null,
        userId: "user-test-1",
        createdAt: new Date("2026-09-15T10:00:00Z"),
        updatedAt: new Date("2026-09-15T10:00:00Z"),
      };

      vi.mocked(prisma.collection.create).mockResolvedValue(mockCreated as never);

      const result = await createCollection("user-test-1", {
        name: "Cloud Architecture",
        description: "AWS and GCP resources",
      });

      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: {
          name: "Cloud Architecture",
          description: "AWS and GCP resources",
          color: null,
          userId: "user-test-1",
        },
      });

      expect(result).toEqual({
        id: "col-new-1",
        name: "Cloud Architecture",
        description: "AWS and GCP resources",
        isFavorite: false,
        itemCount: 0,
        accentColor: "#3b82f6",
        types: [],
        createdAt: mockCreated.createdAt,
        updatedAt: mockCreated.updatedAt,
      });
    });

    it("falls back to default accent color (#3b82f6) when color is not provided", async () => {
      const mockCreated = {
        id: "col-new-2",
        name: "General",
        description: null,
        isFavorite: false,
        color: null,
        userId: "user-test-1",
        createdAt: new Date("2026-09-15T10:00:00Z"),
        updatedAt: new Date("2026-09-15T10:00:00Z"),
      };

      vi.mocked(prisma.collection.create).mockResolvedValue(mockCreated as never);

      const result = await createCollection("user-test-1", {
        name: "General",
      });

      expect(result.accentColor).toBe("#3b82f6");
      expect(result.description).toBeNull();
      expect(result.itemCount).toBe(0);
    });
  });

  describe("getCollectionById", () => {
    it("returns null when collection does not exist or user mismatch", async () => {
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      const result = await getCollectionById("col-missing", "user-test-1");
      expect(result).toBeNull();
    });

    it("returns mapped collection with derived accent color when found", async () => {
      const mockFound = {
        id: "col-found-1",
        name: "TypeScript Tips",
        description: "Helpful TS snippets",
        isFavorite: true,
        color: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
        _count: { items: 1 },
        items: [
          {
            item: {
              itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
            },
          },
        ],
      };

      vi.mocked(prisma.collection.findFirst).mockResolvedValue(mockFound as never);

      const result = await getCollectionById("col-found-1", "user-test-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("col-found-1");
      expect(result?.accentColor).toBe("#3b82f6");
      expect(result?.itemCount).toBe(1);
      expect(result?.types).toHaveLength(1);
    });

    it("falls back to demo user when userId is not provided", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "demo-user-id" } as never);
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      await getCollectionById("col-1");

      expect(prisma.collection.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "col-1",
            userId: "demo-user-id",
          },
        })
      );
    });

    it("returns null if target user cannot be resolved", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getCollectionById("col-1");
      expect(result).toBeNull();
    });
  });

  describe("getCollectionItems", () => {
    it("returns empty array if target user cannot be resolved", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const items = await getCollectionItems("col-1");
      expect(items).toEqual([]);
    });

    it("queries items scoped to collection and user ordered by addedAt desc", async () => {
      const mockRelations = [
        {
          item: {
            id: "item-1",
            title: "Reusable Hook",
            description: "Custom React hook",
            content: "export function useHook() {}",
            contentType: "TEXT",
            url: null,
            language: "typescript",
            fileUrl: null,
            fileName: null,
            fileSize: null,
            mimeType: null,
            isFavorite: true,
            isPinned: false,
            createdAt: new Date("2026-03-01T12:00:00Z"),
            itemType: {
              name: "snippet",
              icon: "Code",
              color: "#3b82f6",
            },
            tags: [
              { tag: { name: "react" } },
              { tag: { name: "hooks" } },
            ],
          },
        },
        {
          item: {
            id: "item-2",
            title: "Architecture Diagram",
            description: "System diagram",
            content: null,
            contentType: "FILE",
            url: null,
            language: null,
            fileUrl: "https://storage.devstash.io/diagram.png",
            fileName: "diagram.png",
            fileSize: BigInt(2048),
            mimeType: "image/png",
            isFavorite: false,
            isPinned: true,
            createdAt: new Date("2026-03-02T15:00:00Z"),
            itemType: {
              name: "image",
              icon: "Image",
              color: "#ec4899",
            },
            tags: [],
          },
        },
      ];

      vi.mocked(prisma.itemCollection.findMany).mockResolvedValue(mockRelations as never);

      const items = await getCollectionItems("col-123", "user-456");

      expect(prisma.itemCollection.findMany).toHaveBeenCalledWith({
        where: {
          collectionId: "col-123",
          collection: {
            userId: "user-456",
          },
        },
        orderBy: {
          addedAt: "desc",
        },
        select: expect.objectContaining({
          item: expect.any(Object),
        }),
      });

      expect(items).toHaveLength(2);

      expect(items[0]).toEqual(
        expect.objectContaining({
          id: "item-1",
          title: "Reusable Hook",
          type: "snippet",
          typeIcon: "Code",
          typeColor: "#3b82f6",
          tags: ["react", "hooks"],
          isFavorite: true,
          isPinned: false,
        })
      );

      expect(items[1]).toEqual(
        expect.objectContaining({
          id: "item-2",
          title: "Architecture Diagram",
          type: "image",
          typeIcon: "Image",
          typeColor: "#ec4899",
          tags: [],
          fileUrl: "https://storage.devstash.io/diagram.png",
          fileSize: 2048,
          isFavorite: false,
          isPinned: true,
        })
      );
    });

    it("falls back to demo user when userId is omitted", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "demo-user-id" } as never);
      vi.mocked(prisma.itemCollection.findMany).mockResolvedValue([]);

      await getCollectionItems("col-123");

      expect(prisma.itemCollection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            collectionId: "col-123",
            collection: {
              userId: "demo-user-id",
            },
          },
        })
      );
    });
  });

  describe("updateCollection", () => {
    it("updates collection successfully when owned by user", async () => {
      const mockExisting = {
        id: "col-123",
        userId: "user-1",
        name: "Old Name",
        description: "Old Desc",
        items: [],
        _count: { items: 0 },
      };
      const mockUpdated = {
        id: "col-123",
        userId: "user-1",
        name: "New Name",
        description: "New Desc",
        isFavorite: false,
        color: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
        items: [
          {
            item: {
              itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
            },
          },
        ],
        _count: { items: 1 },
      };

      vi.mocked(prisma.collection.findFirst).mockResolvedValue(
        mockExisting as never
      );
      vi.mocked(prisma.collection.update).mockResolvedValue(
        mockUpdated as never
      );

      const result = await updateCollection("user-1", "col-123", {
        name: "New Name",
        description: "New Desc",
      });

      expect(prisma.collection.findFirst).toHaveBeenCalledWith({
        where: { id: "col-123", userId: "user-1" },
        include: expect.any(Object),
      });

      expect(prisma.collection.update).toHaveBeenCalledWith({
        where: { id: "col-123" },
        data: {
          name: "New Name",
          description: "New Desc",
        },
        include: expect.any(Object),
      });

      expect(result).toEqual({
        id: "col-123",
        name: "New Name",
        description: "New Desc",
        isFavorite: false,
        itemCount: 1,
        accentColor: "#3b82f6",
        types: [{ name: "snippet", icon: "Code", color: "#3b82f6", count: 1 }],
        createdAt: mockUpdated.createdAt,
        updatedAt: mockUpdated.updatedAt,
      });
    });

    it("throws error when collection is not found or unauthorized", async () => {
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      await expect(
        updateCollection("user-1", "col-nonexistent", { name: "Test" })
      ).rejects.toThrow("Collection not found or unauthorized.");

      expect(prisma.collection.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteCollection", () => {
    it("deletes collection successfully when owned by user", async () => {
      vi.mocked(prisma.collection.findFirst).mockResolvedValue({
        id: "col-123",
      } as never);
      vi.mocked(prisma.collection.delete).mockResolvedValue({
        id: "col-123",
      } as never);

      const result = await deleteCollection("user-1", "col-123");

      expect(prisma.collection.findFirst).toHaveBeenCalledWith({
        where: { id: "col-123", userId: "user-1" },
        select: { id: true },
      });

      expect(prisma.collection.delete).toHaveBeenCalledWith({
        where: { id: "col-123" },
      });

      expect(result).toEqual({ success: true, id: "col-123" });
    });

    it("throws error when collection is not found or unauthorized", async () => {
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      await expect(
        deleteCollection("user-1", "col-nonexistent")
      ).rejects.toThrow("Collection not found or unauthorized.");

      expect(prisma.collection.delete).not.toHaveBeenCalled();
    });
  });
});

