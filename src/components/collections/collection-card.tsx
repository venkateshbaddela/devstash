import Link from "next/link";
import { Star, MoreHorizontal } from "lucide-react";
import type { DashboardCollection } from "@/lib/db/collections";
import { ItemTypeIcon } from "@/lib/icons";

export interface CollectionCardProps {
  collection: DashboardCollection;
}

export function CollectionCard({ collection: col }: CollectionCardProps) {
  return (
    <div
      className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 transition-all hover:bg-card/70 hover:border-border cursor-pointer"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: col.accentColor || "#3b82f6",
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/collections/${col.id}`}
              className="font-medium text-sm sm:text-base text-foreground hover:underline truncate"
            >
              <span className="absolute inset-0 rounded-xl" aria-hidden="true" />
              {col.name}
            </Link>
            {col.isFavorite && (
              <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </div>
          <button
            type="button"
            aria-label={`Options for ${col.name}`}
            className="relative z-10 size-6 -mr-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground mt-0.5">
          {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
        </div>

        {col.description && (
          <p className="text-xs sm:text-sm text-muted-foreground/90 mt-2.5 line-clamp-2">
            {col.description}
          </p>
        )}
      </div>

      {/* Small icons of all types in this collection */}
      <div className="flex items-center gap-2 pt-3.5 mt-2 min-h-[1.875rem]">
        {col.types.map((typeInfo) => (
          <ItemTypeIcon
            key={typeInfo.name}
            name={typeInfo.icon || typeInfo.name}
            className="size-3.5 shrink-0"
            style={{ color: typeInfo.color }}
          />
        ))}
      </div>
    </div>
  );
}
