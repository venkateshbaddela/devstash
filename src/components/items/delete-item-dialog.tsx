"use client";

import * as React from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteItemAction } from "@/actions/items";

interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    title: string;
  } | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
  onError,
}: DeleteItemDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetState = () => {
    setIsDeleting(false);
    setError(null);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item?.id || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteItemAction(item.id);
      if (!res.success) {
        const errorMsg = res.error || "Failed to delete item.";
        setError(errorMsg);
        onError?.(errorMsg);
        setIsDeleting(false);
        return;
      }

      onOpenChange(false);
      resetState();
      onSuccess?.();
    } catch {
      const errorMsg = "An unexpected error occurred while deleting the item.";
      setError(errorMsg);
      onError?.(errorMsg);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) {
          onOpenChange(nextOpen);
          if (!nextOpen) resetState();
        }
      }}
    >
      <AlertDialogContent className="max-w-md p-6 bg-card border-border/80 shadow-2xl">
        <AlertDialogHeader className="gap-3 sm:gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
              <Trash2 className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base sm:text-lg font-semibold text-foreground">
                Delete Item
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{item?.title || "this item"}&rdquo;
            </span>
            ? This will permanently remove it from your stash, along with any
            associated tag links and collection placements.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2 pt-5 border-t border-border/50 mt-4">
          <AlertDialogCancel
            disabled={isDeleting}
            className="text-xs h-8 px-3 cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !item}
            className="text-xs h-8 px-3 gap-1.5 cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Delete Item</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
