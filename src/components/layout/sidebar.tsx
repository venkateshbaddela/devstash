"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Layers, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  currentUser as mockUser,
  itemTypes as mockItemTypes,
  collections as mockCollections,
} from "@/lib/mock-data";
import type { SidebarItemType } from "@/lib/db/items";
import type { DashboardCollection, SidebarCollection } from "@/lib/db/collections";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarNavTypes, type SidebarNavType } from "./sidebar-nav-types";
import {
  SidebarNavCollections,
  type SidebarNavCollection,
} from "./sidebar-nav-collections";
import { SidebarUserProfile, type SidebarUser } from "./sidebar-user-profile";

export type { SidebarNavType, SidebarNavCollection, SidebarUser };

export interface SidebarProps {
  itemTypes?: SidebarItemType[];
  collections?: (SidebarCollection | DashboardCollection)[];
  user?: SidebarUser;
}

interface SidebarContentProps {
  isMobile?: boolean;
  itemTypes?: SidebarItemType[];
  collections?: (SidebarCollection | DashboardCollection)[];
  user?: SidebarUser;
}

function SidebarContent({
  isMobile = false,
  itemTypes: propItemTypes,
  collections: propCollections,
  user: propUser,
}: SidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCollectionId = searchParams.get("collection");
  const isDashboardActive = pathname === "/dashboard" && !activeCollectionId;
  const { closeMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      closeMobile();
    }
  };

  const itemTypes: SidebarNavType[] = React.useMemo(() => {
    if (propItemTypes) return propItemTypes;
    return mockItemTypes.map((t) => ({
      ...t,
      displayName: t.name,
      href: `/items/${t.name.toLowerCase()}`,
    }));
  }, [propItemTypes]);

  const collections: SidebarNavCollection[] = propCollections ?? mockCollections;

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
              isDashboardActive
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-zinc-300 hover:text-white hover:bg-muted/50"
            )}
          >
            <LayoutDashboard className="size-4 text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors" />
            <span className="truncate">Dashboard</span>
          </Link>

          {/* Types Section */}
          <SidebarNavTypes
            itemTypes={itemTypes}
            onItemClick={handleLinkClick}
          />

          {/* Separator between Types and Collections */}
          <div className="mx-1 my-2 h-px bg-border/60" role="separator" />

          {/* Collections Section */}
          <SidebarNavCollections
            collections={collections}
            onItemClick={handleLinkClick}
          />
        </div>
      </div>

      {/* User Profile Area at the bottom */}
      <SidebarUserProfile user={propUser ?? mockUser} />
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
        <React.Suspense fallback={null}>
          <SidebarContent
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
        </React.Suspense>
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
          <React.Suspense fallback={null}>
            <SidebarContent
              isMobile
              itemTypes={itemTypes}
              collections={collections}
              user={user}
            />
          </React.Suspense>
        </SheetContent>
      </Sheet>
    </>
  );
}
