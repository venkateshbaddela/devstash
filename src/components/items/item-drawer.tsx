"use client";

import React, { useState } from "react";
import {
  Star,
  Pin,
  Copy,
  Check,
  Pencil,
  Trash2,
  Tag,
  Folder,
  Calendar,
  ExternalLink,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemTypeIcon } from "@/lib/icons";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { cn } from "cn";

export function ItemDrawer() {
  const {
    isOpen,
    isLoading,
    item,
    previewItem,
    error,
    closeDrawer,
    toggleFavorite,
    togglePin,
    openItem,
  } = useItemDrawer();

  const [copied, setCopied] = useState(false);

  // Active display data: prefer full item, fallback to previewItem during initial loading
  const displayTitle = item?.title ?? previewItem?.title ?? "";
  const displayDescription = item?.description ?? previewItem?.description ?? null;
  const displayType = item?.type ?? previewItem?.type ?? "snippet";
  const displayTypeDisplayName =
    item?.typeDisplayName ??
    (displayType.charAt(0).toUpperCase() + displayType.slice(1));
  const displayTypeIcon = item?.typeIcon ?? previewItem?.typeIcon ?? displayType;
  const displayTypeColor =
    item?.typeColor ?? previewItem?.typeColor ?? "#3b82f6";
  const isFavorite = item ? item.isFavorite : previewItem?.isFavorite ?? false;
  const isPinned = item ? item.isPinned : previewItem?.isPinned ?? false;
  const displayTags = item?.tags ?? previewItem?.tags ?? [];
  const displayId = item?.id ?? previewItem?.id ?? "";

  const handleCopy = async () => {
    const textToCopy = item?.content ?? item?.url ?? previewItem?.content ?? "";
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleRetry = () => {
    if (displayId) {
      openItem(displayId, previewItem ?? undefined);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-xl md:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl",
          "p-0 gap-0 overflow-hidden bg-card text-foreground border-l border-border flex flex-col h-full"
        )}
      >
        {/* Accessible Dialog Header */}
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
                  {displayTitle || "Item Details"}
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
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-2 border-b border-border/60 bg-muted/20 text-xs shrink-0">
          {/* Left Action Buttons: Favorite, Pin, Copy */}
          <div className="flex items-center gap-1">
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className={cn(
                "h-8 px-2.5 gap-1.5 text-xs font-medium transition-colors",
                isFavorite
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star
                className={cn(
                  "size-3.5",
                  isFavorite
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                )}
              />
              <span>Favorite</span>
            </Button>

            {/* Pin Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePin}
              className={cn(
                "h-8 px-2.5 gap-1.5 text-xs font-medium transition-colors",
                isPinned
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Pin
                className={cn(
                  "size-3.5 rotate-45",
                  isPinned
                    ? "fill-muted-foreground text-foreground"
                    : "text-muted-foreground"
                )}
              />
              <span>Pin</span>
            </Button>

            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={isLoading || (!item?.content && !item?.url && !previewItem?.content)}
              className="h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Right Action Buttons: Edit, Delete */}
          <div className="flex items-center gap-1">
            {/* Edit Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="size-3.5" />
              <span>Edit</span>
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete item"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={handleRetry}
                className="shrink-0 gap-1 border-destructive/30 text-destructive hover:bg-destructive/20"
              >
                <RefreshCw className="size-3" />
                <span>Retry</span>
              </Button>
            </div>
          )}

          {/* Description */}
          {displayDescription ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">
                Description
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {displayDescription}
              </p>
            </div>
          ) : isLoading && !item ? (
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-muted/60 animate-pulse rounded" />
              <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
            </div>
          ) : null}

          {/* Content Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Content
            </h3>

            {isLoading && !item ? (
              <div className="rounded-xl border border-border/60 bg-zinc-950/80 p-4 space-y-2.5 animate-pulse">
                <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
                <div className="h-3.5 w-1/2 bg-zinc-800 rounded" />
                <div className="h-3.5 w-5/6 bg-zinc-800 rounded" />
                <div className="h-3.5 w-2/3 bg-zinc-800 rounded" />
                <div className="h-3.5 w-1/3 bg-zinc-800 rounded" />
              </div>
            ) : item?.content ? (
              <div className="rounded-xl border border-border/60 bg-zinc-950/90 p-3.5 sm:p-4 font-mono text-xs overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {item.content.split("\n").map((line, idx) => (
                      <tr key={idx} className="leading-relaxed group/line">
                        <td className="w-8 select-none pr-3 sm:pr-4 text-right text-zinc-500/60 align-top tabular-nums text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre text-zinc-200 font-mono align-top text-xs">
                          {line || " "}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : item?.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors text-xs sm:text-sm text-foreground group"
              >
                <ExternalLink className="size-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
                <span className="truncate text-primary hover:underline">
                  {item.url}
                </span>
              </a>
            ) : item?.fileName ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30 text-xs sm:text-sm">
                <FileText className="size-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {item.fileName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : "File"}{" "}
                    {item.mimeType ? `• ${item.mimeType}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                No content saved for this item.
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="size-3.5" />
              <span>Tags</span>
            </div>

            {displayTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No tags</p>
            )}
          </div>

          {/* Collections */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Folder className="size-3.5" />
              <span>Collections</span>
            </div>

            {isLoading && !item ? (
              <div className="h-6 w-28 bg-muted/40 animate-pulse rounded-md" />
            ) : item?.collections && item.collections.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {item.collections.map((col) => (
                  <span
                    key={col.id}
                    className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground flex items-center gap-1.5"
                  >
                    {col.color && (
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                    )}
                    <span>{col.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Not in any collections
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>Details</span>
            </div>

            {isLoading && !item ? (
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
                <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
              </div>
            ) : (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Created</span>
                  <span className="text-foreground font-medium">
                    {item?.formattedCreatedAt || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Updated</span>
                  <span className="text-foreground font-medium">
                    {item?.formattedUpdatedAt || "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
