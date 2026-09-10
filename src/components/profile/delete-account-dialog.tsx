"use client";

import * as React from "react";
import { Trash2, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccountAction } from "@/actions/profile";

interface DeleteAccountDialogProps {
  userEmail: string;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isDemoUser = userEmail.toLowerCase() === "demo@devstash.io";
  const isConfirmed = confirmText.trim().toLowerCase() === userEmail.toLowerCase();

  const resetForm = () => {
    setConfirmText("");
    setError(null);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDemoUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await deleteAccountAction(confirmText.trim());
      if (!res.success) {
        setError(res.error || "Failed to delete account.");
        setIsLoading(false);
      } else {
        router.push("/sign-in");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger
        disabled={isDemoUser}
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isDemoUser}
            title={isDemoUser ? "Demo account cannot be deleted" : undefined}
            className="gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        }
      >
        <Trash2 className="size-3.5" />
        <span>Delete Account</span>
      </DialogTrigger>

      <DialogContent className="max-w-sm sm:max-w-md border-destructive/30">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-destructive mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. All your saved items, collections, tags,
            and personal settings will be permanently erased.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="my-2 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4 py-2">
          <div className="space-y-2 text-left">
            <label
              htmlFor="confirm-delete-email"
              className="text-xs text-muted-foreground block leading-relaxed"
            >
              Please type <span className="font-semibold text-foreground select-all">{userEmail}</span> to confirm deletion:
            </label>
            <Input
              id="confirm-delete-email"
              type="email"
              placeholder={userEmail}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              className="h-9 bg-background/50 border-border/70 text-xs"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="cursor-pointer text-xs"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || !isConfirmed || isDemoUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium text-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Permanently Delete</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
