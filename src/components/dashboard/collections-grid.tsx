import Link from "next/link";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  getDashboardCollections,
  type DashboardCollection,
} from "@/lib/db/collections";

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
  // System item type name mappings
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

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
          href="/dashboard"
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
            <div
              key={col.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 transition-all hover:bg-card/70 hover:border-border"
              style={{
                borderLeftWidth: "3px",
                borderLeftColor: col.accentColor || "#3b82f6",
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link
                      href={`/dashboard?collection=${col.id}`}
                      className="font-medium text-sm sm:text-base text-foreground hover:underline truncate"
                    >
                      {col.name}
                    </Link>
                    {col.isFavorite && (
                      <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Options for ${col.name}`}
                    className="size-6 -mr-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
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
                {col.types.map((typeInfo) => {
                  const IconComponent =
                    ICON_MAP[typeInfo.icon] || ICON_MAP[typeInfo.name] || File;

                  return (
                    <IconComponent
                      key={typeInfo.name}
                      className="size-3.5 shrink-0"
                      style={{ color: typeInfo.color }}
                      aria-label={`${typeInfo.name} (${typeInfo.count})`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
