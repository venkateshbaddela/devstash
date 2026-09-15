"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2, AlertCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOptionalItemDrawer } from "@/components/items/item-drawer-context";
import type { DashboardCollection } from "@/lib/db/collections";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collection: DashboardCollection) => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const router = useRouter();
  const drawerContext = useOptionalItemDrawer();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setDescription("");
    setError(null);
    setIsSubmitting(false);
  }, []);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      resetForm();
    }
  }

  const isFormValid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errorMsg = data.error || "Failed to create collection.";
        setError(errorMsg);
        if (drawerContext?.showToast) {
          drawerContext.showToast("error", errorMsg);
        }
        setIsSubmitting(false);
        return;
      }

      onOpenChange(false);
      resetForm();

      if (drawerContext?.showToast) {
        drawerContext.showToast(
          "success",
          data.message || "Collection created successfully."
        );
      }

      onSuccess?.(data.collection);
      router.refresh();
    } catch {
      const errorMsg = "An unexpected network error occurred. Please try again.";
      setError(errorMsg);
      if (drawerContext?.showToast) {
        drawerContext.showToast("error", errorMsg);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
          if (!nextOpen) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-muted/30">
              <FolderPlus className="size-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Create Collection
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Organize your items into a named collection.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Collection Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="collection-name"
                  className="text-xs font-medium text-foreground"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {name.length}/100
                </span>
              </div>
              <Input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. React Architecture, DevOps Tools..."
                maxLength={100}
                required
                autoFocus
                className="h-9 text-xs sm:text-sm bg-background/60 border-border/70 rounded-lg"
              />
            </div>

            {/* Description (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="collection-description"
                  className="text-xs font-medium text-foreground"
                >
                  Description
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {description.length}/1000
                </span>
              </div>
              <textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or context about this collection..."
                rows={3}
                maxLength={1000}
                className="w-full min-h-[80px] rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 resize-y transition-colors"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="leading-tight">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 shrink-0 gap-2 sm:gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="text-xs h-8 px-3 cursor-pointer"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="text-xs h-8 px-3 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Create Collection</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
