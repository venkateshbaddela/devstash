"use client";

import React, { useState } from "react";
import { Star, Pin } from "lucide-react";
import type { Item as MockItem } from "@/lib/mock-data";
import type { DashboardItem } from "@/lib/db/items";
import { ItemTypeIcon } from "@/lib/icons";
import { useOptionalItemDrawer } from "@/components/items/item-drawer-context";
import { formatFileSize } from "@/lib/file-constraints";

interface ImageCardProps {
  item: DashboardItem | MockItem;
  onClick?: (item: DashboardItem | MockItem) => void;
}

export function ImageCard({ item, onClick }: ImageCardProps) {
  const drawer = useOptionalItemDrawer();
  const [imgError, setImgError] = useState(false);

  const fileUrl = "fileUrl" in item ? item.fileUrl : null;
  const fileSize = "fileSize" in item ? item.fileSize : null;
  const hasImage = Boolean(fileUrl) && !imgError;

  const handleClick = () => {
    onClick?.(item);
    if (drawer && item.id) {
      drawer.openItem(item.id, item as DashboardItem);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col rounded-xl border border-border/80 bg-card/40 overflow-hidden transition-all duration-300 hover:bg-card/70 hover:border-border hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none text-left"
      style={{
        borderTopWidth: "3px",
        borderTopColor: item.typeColor || "#ec4899",
      }}
    >
      {/* 16:9 Aspect Ratio Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl!}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-muted/20 text-muted-foreground p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <ItemTypeIcon
                name={item.typeIcon || "Image"}
                className="size-5"
                style={{ color: item.typeColor || "#ec4899" }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/70">
              No preview available
            </span>
          </div>
        )}

        {/* Badges Overlay (Pin & Star) */}
        {(item.isPinned || item.isFavorite) && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs border border-white/10 shadow-xs">
            {item.isPinned && (
              <Pin
                className="size-3 text-white fill-white rotate-45 shrink-0"
                aria-label="Pinned"
              />
            )}
            {item.isFavorite && (
              <Star
                className="size-3 fill-amber-400 text-amber-400 shrink-0"
                aria-label="Favorite"
              />
            )}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {item.date}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer: Tags & File Size */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] bg-muted/40 border border-border/60 text-muted-foreground font-normal truncate max-w-[100px]"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground/70">
                +{item.tags.length - 2}
              </span>
            )}
          </div>

          {fileSize && (
            <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0 tabular-nums">
              {formatFileSize(fileSize)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
