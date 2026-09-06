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
import { collections, itemTypes } from "@/lib/mock-data";

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

const TYPE_COLOR_MAP: Record<string, string> = {
  Code: "#3b82f6",
  Sparkles: "#8b5cf6",
  Terminal: "#f97316",
  StickyNote: "#fde047",
  File: "#6b7280",
  Image: "#ec4899",
  Link: "#10b981",
};

export function CollectionsGrid() {
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
                {col.itemCount} items
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground/90 mt-2.5 line-clamp-2">
                {col.description}
              </p>
            </div>

            {/* Type Icons at bottom */}
            <div className="flex items-center gap-2 pt-3.5 mt-2">
              {col.types.map((typeName) => {
                const IconComponent = ICON_MAP[typeName] || File;
                const iconColor =
                  TYPE_COLOR_MAP[typeName] ||
                  itemTypes.find((t) => t.icon === typeName)?.color ||
                  "#6b7280";

                return (
                  <IconComponent
                    key={typeName}
                    className="size-3.5 shrink-0"
                    style={{ color: iconColor }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
