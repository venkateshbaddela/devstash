"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ICON_MAP: Record<string, LucideIcon> = {
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

export interface SidebarNavType {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  count: number;
  href?: string;
  isPro?: boolean;
}

interface SidebarNavTypesProps {
  itemTypes: SidebarNavType[];
  onItemClick?: () => void;
}

export function SidebarNavTypes({ itemTypes, onItemClick }: SidebarNavTypesProps) {
  const pathname = usePathname();
  const { isTypesOpen, setIsTypesOpen } = useSidebar();

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsTypesOpen((prev) => !prev)}
        className="group/btn flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-expanded={isTypesOpen}
      >
        <span>Types</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground/70 transition-transform duration-200 group-hover/btn:text-foreground",
            !isTypesOpen && "-rotate-90"
          )}
        />
      </button>

      {isTypesOpen && (
        <nav className="space-y-0.5 pt-0.5" aria-label="Item Types">
          {itemTypes.map((type) => {
            const IconComponent =
              ICON_MAP[type.icon] || ICON_MAP[type.name] || Code;
            const displayName = type.displayName || type.name;
            const typeHref = type.href || `/items/${type.name}`;

            const isActive =
              pathname === typeHref ||
              pathname === `/items/${type.name}` ||
              pathname === `/items/${type.name}s` ||
              pathname === `/items/${type.id}`;

            const isPro =
              type.isPro ??
              ["file", "files", "image", "images"].includes(
                type.name.toLowerCase()
              );

            return (
              <Link
                key={type.id || type.name}
                href={typeHref}
                onClick={onItemClick}
                className={cn(
                  "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent
                    className="size-4 shrink-0 transition-transform duration-150 group-hover:scale-110"
                    style={{ color: type.color }}
                  />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{displayName}</span>
                    {isPro && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-4.5 px-1.5 text-[9px] font-semibold uppercase tracking-normal leading-none rounded-lg border transition-colors shrink-0",
                          isActive
                            ? "bg-foreground/10 text-foreground border-foreground/20"
                            : "bg-muted/60 text-muted-foreground border-border/80 group-hover:text-foreground group-hover:border-border"
                        )}
                      >
                        PRO
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-normal">
                  {type.count}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
