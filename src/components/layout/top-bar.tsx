"use client";

import { useState } from "react";
import { Search, Plus, FolderPlus, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/layout/sidebar-context";
import { CreateItemDialog } from "@/components/items/create-item-dialog";

export function TopBar() {
  const { toggle } = useSidebar();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 sm:gap-4 border-b border-border/80 bg-background/95 px-3 sm:px-4 md:px-6 backdrop-blur-sm">
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0 max-w-xs sm:max-w-sm md:max-w-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Toggle Sidebar"
            type="button"
          >
            <PanelLeft className="size-4" />
          </Button>

          <div className="relative w-full min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              aria-label="Search items"
              className="h-8 pl-8 pr-3 sm:pr-12 text-sm bg-muted/20 border-border/60 focus-visible:bg-background"
              readOnly
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px] text-muted-foreground">
                ⌘ K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="h-8 px-2 sm:px-2.5 text-xs font-medium cursor-pointer"
          >
            <FolderPlus className="size-3.5" />
            <span className="hidden md:inline">New Collection</span>
            <span className="hidden sm:inline md:hidden">Collection</span>
          </Button>

          <Button
            size="sm"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-2.5 sm:px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>New Item</span>
          </Button>
        </div>
      </header>

      <CreateItemDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}

