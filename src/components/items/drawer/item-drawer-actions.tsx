"use client";

import React from "react";
import {
  Star,
  Pin,
  Copy,
  Check,
  Pencil,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ItemDetail, DashboardItem } from "@/lib/db/items";
import { cn } from "cn";

export interface ItemDrawerActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
  // View mode action handlers
  isFavorite: boolean;
  isPinned: boolean;
  copied: boolean;
  isLoading: boolean;
  item: ItemDetail | null;
  previewItem: DashboardItem | null;
  lowerType: string;
  onToggleFavorite: () => void;
  onTogglePin: () => void;
  onCopy: () => void;
  onEnterEdit: () => void;
  onOpenDelete: () => void;
}

export function ItemDrawerActions({
  isEditing,
  isSaving,
  canSave,
  onCancel,
  onSave,
  isFavorite,
  isPinned,
  copied,
  isLoading,
  item,
  previewItem,
  lowerType,
  onToggleFavorite,
  onTogglePin,
  onCopy,
  onEnterEdit,
  onOpenDelete,
}: ItemDrawerActionsProps) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-between px-5 sm:px-6 py-2 border-b border-border/60 bg-muted/20 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Pencil className="size-3.5 text-primary" />
          <span>Editing item</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="h-8 px-3 text-xs gap-1.5 font-medium shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 sm:px-6 py-2 border-b border-border/60 bg-muted/20 text-xs shrink-0">
      {/* Left Action Buttons: Favorite, Pin, Copy */}
      <div className="flex items-center gap-1">
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFavorite}
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
          onClick={onTogglePin}
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
          onClick={onCopy}
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

        {/* Download Button */}
        {(item?.fileUrl || item?.storageKey || lowerType === "file" || lowerType === "image") &&
          (item?.fileUrl || item?.storageKey ? (
            <a
              href={
                item.fileUrl ||
                `/api/files/download?key=${encodeURIComponent(
                  item.storageKey || ""
                )}&filename=${encodeURIComponent(item.fileName || "download")}`
              }
              download={item.fileName || "download"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              )}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground opacity-40 cursor-not-allowed"
              )}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </button>
          ))}
      </div>

      {/* Right Action Buttons: Edit, Delete */}
      <div className="flex items-center gap-1">
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEnterEdit}
          disabled={isLoading || !item}
          className="h-8 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Pencil className="size-3.5" />
          <span>Edit</span>
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenDelete}
          disabled={isLoading || !item}
          className="size-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Delete item"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
