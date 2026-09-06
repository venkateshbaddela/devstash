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
  ArrowRight,
  Settings,
  Layers,
  PanelLeft,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  currentUser as mockUser,
  itemTypes as mockItemTypes,
  collections as mockCollections,
} from "@/lib/mock-data";
import type { SidebarItemType } from "@/lib/db/items";
import type { DashboardCollection } from "@/lib/db/collections";
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
  // System item type name mappings
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface SidebarNavType {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  count: number;
  href?: string;
}

export interface SidebarNavCollection {
  id: string;
  name: string;
  itemCount: number;
  isFavorite: boolean;
  accentColor?: string;
  color?: string | null;
}

export interface SidebarProps {
  itemTypes?: SidebarItemType[];
  collections?: DashboardCollection[];
  user?: SidebarUser;
}

function SidebarContent({
  isMobile = false,
  itemTypes: propItemTypes,
  collections: propCollections,
  user: propUser,
}: {
  isMobile?: boolean;
  itemTypes?: SidebarItemType[];
  collections?: DashboardCollection[];
  user?: SidebarUser;
}) {
  const pathname = usePathname();
  const { closeMobile } = useSidebar();

  const user = propUser ?? {
    name: mockUser.name || "Demo User",
    email: mockUser.email || "demo@devstash.io",
    avatarUrl: mockUser.avatarUrl || "",
  };

  const userInitials = React.useMemo(() => {
    if (!user.name) return "DU";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user.name]);

  const itemTypes: SidebarNavType[] = React.useMemo(() => {
    if (propItemTypes) return propItemTypes;
    return mockItemTypes.map((t) => ({
      ...t,
      displayName: t.name,
      href: `/items/${t.name.toLowerCase()}`,
    }));
  }, [propItemTypes]);

  const collections: SidebarNavCollection[] = propCollections ?? mockCollections;

  const favoriteCollections = React.useMemo(
    () => collections.filter((c) => c.isFavorite),
    [collections]
  );

  const recentCollections = React.useMemo(
    () => collections.filter((c) => !c.isFavorite),
    [collections]
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
                  const IconComponent =
                    ICON_MAP[type.icon] || ICON_MAP[type.name] || Code;
                  const displayName = type.displayName || type.name;
                  const typeHref = type.href || `/items/${type.name}`;

                  const isActive =
                    pathname === typeHref ||
                    pathname === `/items/${type.name}` ||
                    pathname === `/items/${type.name}s` ||
                    pathname === `/items/${type.id}`;

                  return (
                    <Link
                      key={type.id || type.name}
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
                        <span className="truncate">{displayName}</span>
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
                        const isActive = pathname === colHref;
                        const circleColor =
                          col.accentColor ||
                          ("color" in col && col.color ? (col.color as string) : undefined) ||
                          "#3b82f6";

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

                {/* "View all collections" link */}
                <div className="pt-1.5 px-2">
                  <Link
                    href="/collections"
                    onClick={handleLinkClick}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 group/all"
                  >
                    <span>View all collections</span>
                    <ArrowRight className="size-3.5 text-muted-foreground/70 group-hover/all:text-foreground transition-transform group-hover/all:translate-x-0.5 shrink-0" />
                  </Link>
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
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-zinc-200 text-zinc-900 font-medium text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left leading-tight">
              <span className="text-sm font-medium text-foreground truncate">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
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

export function Sidebar({
  itemTypes,
  collections,
  user,
}: SidebarProps = {}) {
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
        <SidebarContent
          itemTypes={itemTypes}
          collections={collections}
          user={user}
        />
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
          <SidebarContent
            isMobile
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
