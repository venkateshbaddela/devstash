import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItemById } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
    },
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

describe("getItemById Query Function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
