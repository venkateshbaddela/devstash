"use client";

import React from "react";
import { Folder, ChevronDown, Check, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export interface CollectionOption {
  id: string;
  name: string;
  color?: string | null;
  accentColor?: string | null;
  itemCount?: number;
}

export interface ItemCollectionSelectorProps {
  selectedCollectionIds: string[];
  onChange: (selectedIds: string[]) => void;
  collections?: CollectionOption[];
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function ItemCollectionSelector({
  selectedCollectionIds,
  onChange,
  collections: externalCollections,
  disabled = false,
  label = "Collections",
  placeholder = "Select collections...",
}: ItemCollectionSelectorProps) {
  const [internalCollections, setInternalCollections] = React.useState<
    CollectionOption[]
  >([]);
  const [internalLoading, setInternalLoading] = React.useState(!externalCollections);

  // Fetch available collections if not provided from parent
  React.useEffect(() => {
    if (externalCollections) {
      return;
    }

    let isMounted = true;
    const fetchCollections = async () => {
      try {
        setInternalLoading(true);
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.collections)) {
            setInternalCollections(data.collections);
          }
        }
      } catch (err) {
        console.error("Failed to fetch collections for selector:", err);
      } finally {
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    };

    fetchCollections();
    return () => {
      isMounted = false;
    };
  }, [externalCollections]);

  const availableCollections = externalCollections ?? internalCollections;
  const isLoading = externalCollections ? false : internalLoading;

  const collectionMap = React.useMemo(() => {
    const map = new Map<string, CollectionOption>();
    for (const col of availableCollections) {
      map.set(col.id, col);
    }
    return map;
  }, [availableCollections]);

  const selectedCollections = React.useMemo(() => {
    return selectedCollectionIds.map((id) => {
      return (
        collectionMap.get(id) || {
          id,
          name: "Collection",
          accentColor: "#3b82f6",
        }
      );
    });
  }, [selectedCollectionIds, collectionMap]);

  const handleToggle = React.useCallback(
    (collectionId: string) => {
      if (selectedCollectionIds.includes(collectionId)) {
        onChange(selectedCollectionIds.filter((id) => id !== collectionId));
      } else {
        onChange([...selectedCollectionIds, collectionId]);
      }
    },
    [selectedCollectionIds, onChange]
  );

  const handleRemove = React.useCallback(
    (collectionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(selectedCollectionIds.filter((id) => id !== collectionId));
    },
    [selectedCollectionIds, onChange]
  );

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Folder className="size-3.5 text-muted-foreground" />
            <span>{label}</span>
          </label>
          <span className="text-[11px] text-muted-foreground font-normal">
            Optional • Multiple
          </span>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 hover:bg-muted/40 transition-colors cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-9 text-xs sm:text-sm"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            <Folder className="size-3.5 text-muted-foreground shrink-0" />
            {selectedCollections.length === 0 ? (
              <span className="text-muted-foreground font-normal">
                {placeholder}
              </span>
            ) : selectedCollections.length === 1 ? (
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      selectedCollections[0].accentColor ||
                      selectedCollections[0].color ||
                      "#3b82f6",
                  }}
                />
                <span className="font-medium text-foreground truncate">
                  {selectedCollections[0].name}
                </span>
              </div>
            ) : (
              <span className="font-medium text-foreground">
                {selectedCollections.length} collections selected
              </span>
            )}
          </div>
          <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-1.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-(--anchor-width) min-w-[240px] max-h-64 overflow-y-auto p-1.5 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xl"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Assign to Collections
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border/60" />

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Loading collections...</span>
            </div>
          ) : availableCollections.length === 0 ? (
            <div className="py-3 px-2 text-center text-xs text-muted-foreground">
              No collections available.
            </div>
          ) : (
            availableCollections.map((col) => {
              const isSelected = selectedCollectionIds.includes(col.id);
              const color = col.accentColor || col.color || "#3b82f6";

              return (
                <DropdownMenuItem
                  key={col.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(col.id);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs select-none",
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{col.name}</span>
                    {col.itemCount !== undefined && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({col.itemCount})
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "size-4 rounded flex items-center justify-center border shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-background/50"
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[2.5]" />}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected collection badges with quick removal */}
      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedCollections.map((col) => {
            const color = col.accentColor || col.color || "#3b82f6";
            return (
              <span
                key={col.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-muted/50 border border-border/70 text-foreground transition-colors hover:bg-muted/70"
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate max-w-[160px]">{col.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(col.id, e)}
                    className="size-3.5 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title={`Remove from ${col.name}`}
                    aria-label={`Remove from ${col.name}`}
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
