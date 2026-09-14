import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import DashboardPage from "@/app/(app)/dashboard/page";
import { auth } from "@/auth";

const mockAuth = auth as unknown as Mock;
import {
  getDashboardCollections,
  getCollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
} from "@/lib/db/items";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  getDashboardCollections: vi.fn().mockResolvedValue([]),
  getCollectionStats: vi.fn().mockResolvedValue({ totalCollections: 0, favoriteCollections: 0 }),
}));

vi.mock("@/lib/db/items", () => ({
  getPinnedItems: vi.fn().mockResolvedValue([]),
  getRecentItems: vi.fn().mockResolvedValue([]),
  getItemStats: vi.fn().mockResolvedValue({ totalItems: 0, favoriteItems: 0 }),
}));

vi.mock("@/components/dashboard/stats-cards", () => ({
  StatsCards: () => null,
}));

vi.mock("@/components/dashboard/collections-grid", () => ({
  CollectionsGrid: () => null,
}));

vi.mock("@/components/dashboard/pinned-items", () => ({
  PinnedItems: () => null,
}));

vi.mock("@/components/dashboard/recent-items", () => ({
  RecentItems: () => null,
}));

describe("Dashboard Page User Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves session and passes authenticated userId to all dashboard queries", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-abc-456", email: "alice@example.com" },
      expires: "2099-01-01",
    });

    await DashboardPage();

    expect(auth).toHaveBeenCalled();
    expect(getDashboardCollections).toHaveBeenCalledWith("user-abc-456");
    expect(getCollectionStats).toHaveBeenCalledWith("user-abc-456");
    expect(getPinnedItems).toHaveBeenCalledWith("user-abc-456");
    expect(getRecentItems).toHaveBeenCalledWith("user-abc-456");
    expect(getItemStats).toHaveBeenCalledWith("user-abc-456");
  });

  it("passes undefined when unauthenticated, falling back gracefully", async () => {
    mockAuth.mockResolvedValue(null);

    await DashboardPage();

    expect(auth).toHaveBeenCalled();
    expect(getDashboardCollections).toHaveBeenCalledWith(undefined);
    expect(getCollectionStats).toHaveBeenCalledWith(undefined);
    expect(getPinnedItems).toHaveBeenCalledWith(undefined);
    expect(getRecentItems).toHaveBeenCalledWith(undefined);
    expect(getItemStats).toHaveBeenCalledWith(undefined);
  });
});
