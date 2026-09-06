import { StatsCards } from "@/components/dashboard/stats-cards";
import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import {
  getDashboardCollections,
  getCollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
} from "@/lib/db/items";

export default async function DashboardPage() {
  const [
    collections,
    collectionStats,
    pinnedItems,
    recentItems,
    itemStats,
  ] = await Promise.all([
    getDashboardCollections(),
    getCollectionStats(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 sm:space-y-8 pb-10">
      {/* Dashboard Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your developer knowledge hub
        </p>
      </div>

      {/* 4 Stats Cards at the top */}
      <StatsCards
        collectionStats={collectionStats}
        itemStats={itemStats}
      />

      {/* Recent Collections Grid */}
      <CollectionsGrid collections={collections} />

      {/* Pinned Items */}
      <PinnedItems items={pinnedItems} />

      {/* 10 Recent Items */}
      <RecentItems items={recentItems} />
    </div>
  );
}
