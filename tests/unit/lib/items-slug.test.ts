import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveItemTypeBySlug } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    itemType: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  getDefaultUserId: vi.fn().mockResolvedValue("demo-user-id"),
}));

const mockItemTypes = [
  { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { id: "type-2", name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { id: "type-3", name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { id: "type-4", name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type-5", name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { id: "type-6", name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { id: "type-7", name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

describe("Item Slug Normalization Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.itemType.findMany).mockResolvedValue(
      mockItemTypes as unknown as Awaited<ReturnType<typeof prisma.itemType.findMany>>
    );
  });

  it("resolves singular slugs to correct display name", async () => {
    const snippet = await resolveItemTypeBySlug("snippet");
    expect(snippet).not.toBeNull();
    expect(snippet?.name).toBe("snippet");
    expect(snippet?.displayName).toBe("Snippets");
    expect(snippet?.isPro).toBe(false);
  });

  it("resolves plural slugs to the same type", async () => {
    const snippets = await resolveItemTypeBySlug("snippets");
    expect(snippets).not.toBeNull();
    expect(snippets?.id).toBe("type-1");
    expect(snippets?.name).toBe("snippet");
  });

  it("identifies PRO types correctly (files and images)", async () => {
    const file = await resolveItemTypeBySlug("files");
    expect(file?.isPro).toBe(true);

    const image = await resolveItemTypeBySlug("image");
    expect(image?.isPro).toBe(true);
  });

  it("returns null for non-existent slug", async () => {
    const unknown = await resolveItemTypeBySlug("non-existent-slug");
    expect(unknown).toBeNull();
  });
});
