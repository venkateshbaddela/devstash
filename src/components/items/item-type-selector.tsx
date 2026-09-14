"use client";

import React from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CreationItemType,
  CREATION_ITEM_TYPES,
} from "@/lib/validations/items";
import { TYPE_CONFIG } from "@/lib/constants/item-types";
import { cn } from "cn";

export interface ItemTypeSelectorProps {
  selectedType: CreationItemType;
  onSelectType: (type: CreationItemType) => void;
  disabled?: boolean;
}

export function ItemTypeSelector({
  selectedType,
  onSelectType,
  disabled = false,
}: ItemTypeSelectorProps) {
  const activeConfig = TYPE_CONFIG[selectedType];

  return (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1.5">
        Item Type
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          disabled={disabled}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 hover:bg-muted/40 transition-colors cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="size-6 rounded-md flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `color-mix(in srgb, ${activeConfig.color} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${activeConfig.color} 35%, transparent)`,
                color: activeConfig.color,
              }}
            >
              <activeConfig.icon
                className="size-3.5"
                style={{ color: activeConfig.color }}
              />
            </div>
            <span className="font-semibold text-xs sm:text-sm text-foreground">
              {activeConfig.name}
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
              — {activeConfig.description}
            </span>
          </div>
          <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-1.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-(--anchor-width) min-w-[280px] max-h-72 overflow-y-auto p-1.5 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xl"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Select Item Type
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border/60" />

          {CREATION_ITEM_TYPES.map((typeKey) => {
            const config = TYPE_CONFIG[typeKey];
            const Icon = config.icon;
            const isSelected = selectedType === typeKey;

            return (
              <DropdownMenuItem
                key={typeKey}
                onClick={() => onSelectType(typeKey)}
                className={cn(
                  "flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs",
                  isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-7 rounded-md flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                      borderColor: `color-mix(in srgb, ${config.color} 35%, transparent)`,
                      color: config.color,
                    }}
                  >
                    <Icon
                      className="size-3.5"
                      style={{ color: config.color }}
                    />
                  </div>
                  <div className="min-w-0 flex flex-col text-left">
                    <span className="font-semibold text-xs text-foreground">
                      {config.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {config.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="size-4 text-primary shrink-0 ml-2" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
