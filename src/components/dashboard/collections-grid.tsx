import Link from "next/link";
import {
  getDashboardCollections,
  type DashboardCollection,
} from "@/lib/db/collections";
import { CollectionCard } from "@/components/collections/collection-card";

interface CollectionsGridProps {
  collections?: DashboardCollection[];
}

export async function CollectionsGrid({
  collections: propCollections,
}: CollectionsGridProps = {}) {
  const collections = propCollections ?? (await getDashboardCollections());

  return (
    <section className="space-y-3.5" aria-label="Collections">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          Collections
        </h2>
        <Link
          href="/collections"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/20">
          <p className="text-sm text-muted-foreground">No collections found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      )}
    </section>
  );
}
