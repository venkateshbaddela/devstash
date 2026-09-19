"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { cn } from "@/lib/utils";
import type { DashboardCollection } from "@/lib/db/collections";

export interface CreateCollectionButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "xs";
  customLabel?: string;
  onSuccess?: (collection: DashboardCollection) => void;
}

export function CreateCollectionButton({
  className,
  variant = "default",
  size = "sm",
  customLabel = "New Collection",
  onSuccess,
}: CreateCollectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn(
          "cursor-pointer shadow-xs gap-1.5 font-medium",
          variant === "default" &&
            "bg-foreground text-background hover:bg-foreground/90",
          className
        )}
      >
        <FolderPlus className="size-3.5" />
        <span>{customLabel}</span>
      </Button>

      <CreateCollectionDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
