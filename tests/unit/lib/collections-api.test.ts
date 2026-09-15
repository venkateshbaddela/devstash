import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/collections/route";
import { getAuthenticatedUserId } from "@/lib/auth-guards";
import { createCollection, getCollections, type DashboardCollection } from "@/lib/db/collections";

vi.mock("@/lib/auth-guards", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  getCollections: vi.fn(),
}));

describe("Collections API Route Handler (/api/collections)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/collections", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "My Collection" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 400 when body is not valid JSON", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");

      const request = new Request("http://localhost:3000/api/collections", {
        method: "POST",
        body: "invalid-json",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid JSON in request body");
    });

    it("returns 400 when name is missing or empty", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");

      const request = new Request("http://localhost:3000/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Collection name cannot be empty.");
    });

    it("returns 201 with created collection on valid input", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");

      const mockCollection: DashboardCollection = {
        id: "col-new",
        name: "DevOps Tools",
        description: "Docker and K8s configs",
        isFavorite: false,
        itemCount: 0,
        accentColor: "#3b82f6",
        types: [],
        createdAt: new Date("2026-09-15T12:00:00Z"),
        updatedAt: new Date("2026-09-15T12:00:00Z"),
      };

      vi.mocked(createCollection).mockResolvedValue(mockCollection);

      const request = new Request("http://localhost:3000/api/collections", {
        method: "POST",
        body: JSON.stringify({
          name: "  DevOps Tools  ",
          description: "  Docker and K8s configs  ",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.collection.id).toBe("col-new");
      expect(body.collection.name).toBe("DevOps Tools");
      expect(body.message).toBe("Collection created successfully.");

      expect(createCollection).toHaveBeenCalledWith("user-123", {
        name: "DevOps Tools",
        description: "Docker and K8s configs",
      });
    });

    it("returns 500 when createCollection throws an unexpected error", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");
      vi.mocked(createCollection).mockRejectedValue(new Error("Database crash"));

      const request = new Request("http://localhost:3000/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Snippets" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Failed to create collection");
    });
  });

  describe("GET /api/collections", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue(null);

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("returns 200 with collections list for authenticated user", async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-123");
      const mockCollections: DashboardCollection[] = [
        {
          id: "col-1",
          name: "React Hooks",
          description: null,
          isFavorite: false,
          itemCount: 3,
          accentColor: "#3b82f6",
          types: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCollections).mockResolvedValue(mockCollections);

      const response = await GET();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.collections).toHaveLength(1);
      expect(body.collections[0].id).toBe("col-1");
    });
  });
});
