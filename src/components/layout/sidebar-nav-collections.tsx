"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Folder, Star, ChevronDown } from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export interface SidebarNavCollection {
  id: string;
  name: string;
  itemCount: number;
  isFavorite: boolean;
  accentColor?: string;
  color?: string | null;
}

interface SidebarNavCollectionsProps {
  collections: SidebarNavCollection[];
  onItemClick?: () => void;
}

export function SidebarNavCollections({
  collections,
  onItemClick,
}: SidebarNavCollectionsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCollectionId = searchParams.get("collection");
  const { isCollectionsOpen, setIsCollectionsOpen } = useSidebar();

  const favoriteCollections = React.useMemo(
    () => collections.filter((c) => c.isFavorite),
    [collections]
  );

  const recentCollections = React.useMemo(
    () => collections.filter((c) => !c.isFavorite),
    [collections]
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsCollectionsOpen((prev) => !prev)}
        className="group/btn flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-expanded={isCollectionsOpen}
      >
        <div className="flex items-center gap-1.5">
          <Folder className="size-3.5 text-muted-foreground/70 group-hover/btn:text-foreground transition-colors" />
          <span>Collections</span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground/70 transition-transform duration-200 group-hover/btn:text-foreground",
            !isCollectionsOpen && "-rotate-90"
          )}
        />
      </button>

      {isCollectionsOpen && (
        <div className="space-y-3 pt-0.5">
          {/* Favorites */}
          {favoriteCollections.length > 0 && (
            <div className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                Favorites
              </div>
              <nav className="space-y-0.5" aria-label="Favorite Collections">
                {favoriteCollections.map((col) => {
                  const colHref = `/dashboard?collection=${col.id}`;
                  const isActive =
                    pathname === "/dashboard" && activeCollectionId === col.id;

                  return (
                    <Link
                      key={col.id}
                      href={colHref}
                      onClick={onItemClick}
                      className={cn(
                        "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150",
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-zinc-300 hover:text-white hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Star className="size-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="truncate">{col.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-normal">
                        {col.itemCount}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* All / Recent Collections */}
          {recentCollections.length > 0 && (
            <div className="space-y-0.5">
              <div className="px-2 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                Recent Collections
              </div>
              <nav className="space-y-0.5" aria-label="Recent Collections">
                {recentCollections.map((col) => {
                  const colHref = `/dashboard?collection=${col.id}`;
                  const isActive =
                    pathname === "/dashboard" && activeCollectionId === col.id;
                  const circleColor =
                    col.accentColor ||
                    ("color" in col && col.color ? (col.color as string) : undefined) ||
                    "#3b82f6";

                  return (
                    <Link
                      key={col.id}
                      href={colHref}
                      onClick={onItemClick}
                      className={cn(
                        "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150",
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-zinc-300 hover:text-white hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Colored circle based on the most-used item type */}
                        <div className="flex size-4 items-center justify-center shrink-0">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: circleColor }}
                          />
                        </div>
                        <span className="truncate">{col.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-normal">
                        {col.itemCount}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
