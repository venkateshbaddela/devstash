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
  Folder,
  Star,
  Settings,
  Layers,
  PanelLeft,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import { currentUser, itemTypes, collections } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { closeMobile } = useSidebar();

  const favoriteCollections = React.useMemo(
    () => collections.filter((c) => c.isFavorite),
    []
  );

  const recentCollections = React.useMemo(
    () => collections.filter((c) => !c.isFavorite),
    []
  );

  const [isTypesOpen, setIsTypesOpen] = React.useState(true);
  const [isCollectionsOpen, setIsCollectionsOpen] = React.useState(true);

  const handleLinkClick = () => {
    if (isMobile) {
      closeMobile();
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-between select-none font-sans">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo & Brand Header */}
        <div className="flex h-14 items-center justify-between gap-2.5 px-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sm text-white shrink-0">
              <Layers className="size-4" />
            </div>
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className="font-semibold text-base tracking-tight text-foreground hover:opacity-90 transition-opacity truncate"
            >
              DevStash
            </Link>
          </div>

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobile}
              className="size-8 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close Sidebar"
              type="button"
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-3 space-y-3">
          {/* Dashboard Navigation */}
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              "group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/dashboard"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-zinc-300 hover:text-white hover:bg-muted/50"
            )}
          >
            <LayoutDashboard className="size-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors" />
            <span className="truncate">Dashboard</span>
          </Link>

          {/* Types Section */}
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
                  const IconComponent = ICON_MAP[type.icon] || Code;
                  const typeHref = `/items/${type.id}`;
                  const isActive = pathname === typeHref;

                  return (
                    <Link
                      key={type.id}
                      href={typeHref}
                      onClick={handleLinkClick}
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
                        <span className="truncate">{type.name}</span>
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

          {/* Separator between Types and Collections */}
          <div className="mx-1 my-2 h-px bg-border/60" role="separator" />

          {/* Collections Section */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsCollectionsOpen((prev) => !prev)}
              className="group/btn flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-expanded={isCollectionsOpen}
            >
              <span>Collections</span>
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
                <div className="space-y-0.5">
                  <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    Favorites
                  </div>
                  <nav className="space-y-0.5" aria-label="Favorite Collections">
                    {favoriteCollections.map((col) => {
                      const colHref = `/dashboard?collection=${col.id}`;
                      const isActive = pathname === colHref;

                      return (
                        <Link
                          key={col.id}
                          href={colHref}
                          onClick={handleLinkClick}
                          className={cn(
                            "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150",
                            isActive
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Folder className="size-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors" />
                            <span className="truncate">{col.name}</span>
                          </div>
                          <Star className="size-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* All / Recent Collections */}
                <div className="space-y-0.5">
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    All Collections
                  </div>
                  <nav className="space-y-0.5" aria-label="Recent Collections">
                    {recentCollections.map((col) => {
                      const colHref = `/dashboard?collection=${col.id}`;
                      const isActive = pathname === colHref;

                      return (
                        <Link
                          key={col.id}
                          href={colHref}
                          onClick={handleLinkClick}
                          className={cn(
                            "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150",
                            isActive
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Folder className="size-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors" />
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Area at the bottom */}
      <div className="p-3 border-t border-border/60 shrink-0 bg-sidebar/50">
        <div className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="size-8 bg-zinc-200 text-zinc-900 shrink-0">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="bg-zinc-200 text-zinc-900 font-medium text-xs">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left leading-tight">
              <span className="text-sm font-medium text-foreground truncate">
                {currentUser.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Settings"
            type="button"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border/80 bg-sidebar/30 h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
          isCollapsed ? "w-0 border-r-0 opacity-0" : "w-64 opacity-100"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Always a drawer on mobile view) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 !w-64 max-w-[85vw] data-[side=left]:!w-64 data-[side=left]:max-w-[85vw] bg-background border-r border-border overflow-hidden"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>DevStash Navigation</SheetTitle>
            <SheetDescription>
              Browse item types and collections in DevStash
            </SheetDescription>
          </SheetHeader>
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
}
