import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  Pin,
  type LucideIcon,
} from "lucide-react";
import type { Item } from "@/lib/mock-data";

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const IconComponent = ICON_MAP[item.typeIcon] || Code;

  return (
    <article
      className="group relative flex items-start gap-3.5 sm:gap-4 rounded-xl border border-border/80 bg-card/40 p-3.5 sm:p-4 transition-all hover:bg-card/70 hover:border-border cursor-pointer"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: item.typeColor || "#3b82f6",
      }}
    >
      {/* Icon Square */}
      <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-muted/40 shrink-0 mt-0.5">
        <IconComponent
          className="size-4 sm:size-4.5"
          style={{ color: item.typeColor || "#3b82f6" }}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-foreground truncate group-hover:text-foreground">
              {item.title}
            </h3>
            {item.isPinned && (
              <Pin
                className="size-3 text-muted-foreground fill-muted-foreground rotate-45 shrink-0"
                aria-label="Pinned"
              />
            )}
            {item.isFavorite && (
              <Star
                className="size-3.5 fill-amber-400 text-amber-400 shrink-0"
                aria-label="Favorite"
              />
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {item.date}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[11px] sm:text-xs bg-muted/40 border border-border/60 text-muted-foreground font-normal"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
