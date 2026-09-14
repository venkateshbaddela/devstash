"use client";

import React from "react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ItemTypeIcon } from "@/lib/icons";

export interface ItemDrawerHeaderProps {
  displayTitle: string;
  activeHeaderTitle: string;
  displayDescription: string | null;
  displayTypeIcon: string;
  displayTypeColor: string;
  displayTypeDisplayName: string;
  activeLanguage: string | null;
  isLoading: boolean;
  displayType: string;
}

export function ItemDrawerHeader({
  displayTitle,
  activeHeaderTitle,
  displayDescription,
  displayTypeIcon,
  displayTypeColor,
  displayTypeDisplayName,
  activeLanguage,
  isLoading,
  displayType,
}: ItemDrawerHeaderProps) {
  return (
    <SheetHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 shrink-0">
      <div className="flex items-start gap-3.5 pr-8">
        {/* Type Icon Container */}
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted/40 shrink-0 mt-0.5">
          <ItemTypeIcon
            name={displayTypeIcon}
            className="size-5"
            style={{ color: displayTypeColor }}
          />
        </div>

        {/* Title & Badges */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {isLoading && !displayTitle ? (
            <div className="h-6 w-3/4 bg-muted/60 animate-pulse rounded" />
          ) : (
            <SheetTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">
              {activeHeaderTitle}
            </SheetTitle>
          )}

          <SheetDescription className="sr-only">
            {displayDescription || `Item detail view for ${displayTitle}`}
          </SheetDescription>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {isLoading && !displayType ? (
              <div className="h-4.5 w-16 bg-muted/60 animate-pulse rounded" />
            ) : (
              <Badge
                variant="secondary"
                className="h-5 px-2 text-[11px] font-medium rounded-md border transition-colors"
                style={{
                  backgroundColor: `color-mix(in srgb, ${displayTypeColor} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${displayTypeColor} 30%, transparent)`,
                  color: displayTypeColor,
                }}
              >
                {displayTypeDisplayName}
              </Badge>
            )}

            {activeLanguage && (
              <Badge
                variant="outline"
                className="h-5 px-2 text-[11px] font-mono font-medium rounded-md border border-border/70 text-muted-foreground bg-muted/40"
              >
                {activeLanguage}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </SheetHeader>
  );
}
