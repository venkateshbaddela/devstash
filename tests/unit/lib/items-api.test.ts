import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/items/[id]/route";
import { getItemById } from "@/lib/db/items";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  getDefaultUserId: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  getItemById: vi.fn(),
}));

describe("GET /api/items/[id] API Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated and no demo user is available", async () => {
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getDefaultUserId).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/items/123");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when id parameter is empty or whitespace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new Request("http://localhost:3000/api/items/");
    const response = await GET(request, {
      params: Promise.resolve({ id: "   " }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Item ID is required");
  });

  it("returns 404 when item is not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getItemById).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/items/not-found");
    const response = await GET(request, {
      params: Promise.resolve({ id: "not-found" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Item not found");
  });

  it("returns 200 with item details when found", async () => {
    const mockDetail = {
      id: "item-123",
      title: "useAuth Hook",
      description: "Custom authentication hook for React applications",
      content: "export function useAuth() {}",
      contentType: "TEXT",
      url: null,
      language: "typescript",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      isFavorite: true,
      isPinned: false,
      type: "snippet",
      typeDisplayName: "Snippets",
      typeIcon: "Code",
      typeColor: "#3b82f6",
      tags: ["react", "auth"],
      collections: [{ id: "col-1", name: "React Patterns", color: "#3b82f6" }],
      createdAt: "2024-01-15T12:00:00.000Z",
      updatedAt: "2024-01-15T14:30:00.000Z",
      formattedCreatedAt: "January 15, 2024",
      formattedUpdatedAt: "January 15, 2024",
    };

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getItemById).mockResolvedValue(mockDetail);

    const request = new Request("http://localhost:3000/api/items/item-123");
    const response = await GET(request, {
      params: Promise.resolve({ id: "item-123" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.item).toEqual(mockDetail);
    expect(getItemById).toHaveBeenCalledWith("item-123", "user-123");
  });

  it("falls back to demo user when session is null but demo user exists", async () => {
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getDefaultUserId).mockResolvedValue("demo-user-id");
    vi.mocked(getItemById).mockResolvedValue({ id: "demo-item" } as unknown as Awaited<ReturnType<typeof getItemById>>);

    const request = new Request("http://localhost:3000/api/items/demo-item");
    const response = await GET(request, {
      params: Promise.resolve({ id: "demo-item" }),
    });

    expect(response.status).toBe(200);
    expect(getItemById).toHaveBeenCalledWith("demo-item", "demo-user-id");
  });

  it("returns 500 when getItemById throws an unexpected error", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getItemById).mockRejectedValue(new Error("Database connection lost"));

    const request = new Request("http://localhost:3000/api/items/item-123");
    const response = await GET(request, {
      params: Promise.resolve({ id: "item-123" }),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch item details");
  });
});
