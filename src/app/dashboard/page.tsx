import { StatsCards } from "@/components/dashboard/stats-cards";
import { CollectionsGrid } from "@/components/dashboard/collections-grid";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import {
  getDashboardCollections,
  getCollectionStats,
} from "@/lib/db/collections";

export default async function DashboardPage() {
  const [collections, collectionStats] = await Promise.all([
    getDashboardCollections(),
    getCollectionStats(),
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
      <StatsCards collectionStats={collectionStats} />

      {/* Recent Collections Grid */}
      <CollectionsGrid collections={collections} />

      {/* Pinned Items */}
      <PinnedItems />

      {/* 10 Recent Items */}
      <RecentItems />
    </div>
  );
}
