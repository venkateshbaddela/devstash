import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  updateCollectionAction,
  deleteCollectionAction,
} from "@/actions/collections";
import { getAuthenticatedUserId } from "@/lib/auth-guards";
import {
  updateCollection as updateCollectionDb,
  deleteCollection as deleteCollectionDb,
} from "@/lib/db/collections";
import { revalidatePath } from "next/cache";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guards", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

const mockGetAuthenticatedUserId = getAuthenticatedUserId as unknown as Mock<
  () => Promise<string | null>
>;
const mockUpdateCollectionDb = updateCollectionDb as unknown as Mock;
const mockDeleteCollectionDb = deleteCollectionDb as unknown as Mock;
const mockRevalidatePath = revalidatePath as unknown as Mock;

describe("Collections Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateCollectionAction", () => {
    it("fails when collectionId is missing or empty", async () => {
      const result = await updateCollectionAction("", { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Collection ID is required.");
      expect(mockUpdateCollectionDb).not.toHaveBeenCalled();
    });

    it("fails when input validation fails (e.g. empty name)", async () => {
      const result = await updateCollectionAction("col-123", { name: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Collection name cannot be empty.");
      expect(mockUpdateCollectionDb).not.toHaveBeenCalled();
    });

    it("fails when user is unauthenticated", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const result = await updateCollectionAction("col-123", {
        name: "Valid Name",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockUpdateCollectionDb).not.toHaveBeenCalled();
    });

    it("successfully updates collection and revalidates paths", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue("user-1");
      const mockUpdatedCollection = {
        id: "col-123",
        name: "Updated Name",
        description: "Updated Description",
        isFavorite: false,
        itemCount: 2,
        accentColor: "#3b82f6",
        types: [],
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
      };
      mockUpdateCollectionDb.mockResolvedValue(mockUpdatedCollection);

      const result = await updateCollectionAction("col-123", {
        name: "Updated Name",
        description: "Updated Description",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedCollection);
      expect(result.message).toBe("Collection updated successfully.");

      expect(mockUpdateCollectionDb).toHaveBeenCalledWith(
        "user-1",
        "col-123",
        expect.objectContaining({
          name: "Updated Name",
          description: "Updated Description",
        })
      );

      expect(mockRevalidatePath).toHaveBeenCalledWith("/collections");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/collections/col-123");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("returns error message when db operation throws", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue("user-1");
      mockUpdateCollectionDb.mockRejectedValue(
        new Error("Collection not found or unauthorized.")
      );

      const result = await updateCollectionAction("col-nonexistent", {
        name: "Valid Name",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Collection not found or unauthorized.");
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("deleteCollectionAction", () => {
    it("fails when collectionId is missing or empty", async () => {
      const result = await deleteCollectionAction("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Collection ID is required.");
      expect(mockDeleteCollectionDb).not.toHaveBeenCalled();
    });

    it("fails when user is unauthenticated", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const result = await deleteCollectionAction("col-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockDeleteCollectionDb).not.toHaveBeenCalled();
    });

    it("successfully deletes collection and revalidates paths", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue("user-1");
      mockDeleteCollectionDb.mockResolvedValue({ success: true, id: "col-123" });

      const result = await deleteCollectionAction("col-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, id: "col-123" });
      expect(result.message).toBe("Collection deleted successfully.");

      expect(mockDeleteCollectionDb).toHaveBeenCalledWith("user-1", "col-123");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/collections");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("returns error message when db operation throws", async () => {
      mockGetAuthenticatedUserId.mockResolvedValue("user-1");
      mockDeleteCollectionDb.mockRejectedValue(
        new Error("Collection not found or unauthorized.")
      );

      const result = await deleteCollectionAction("col-nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Collection not found or unauthorized.");
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});
