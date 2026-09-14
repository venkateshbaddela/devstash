import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDashboardCollections,
  getCollections,
  getSidebarCollections,
  getCollectionStats,
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
    },
  },
}));

describe("Collections Database Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardCollections", () => {
    it("returns empty array if target user is not found", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

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
});
