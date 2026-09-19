"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateItemDialog } from "@/components/items/create-item-dialog";
import { cn } from "@/lib/utils";

export interface CreateCollectionItemButtonProps {
  collectionId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "xs";
  customLabel?: string;
}

export function CreateCollectionItemButton({
  collectionId,
  className,
  variant = "default",
  size = "sm",
  customLabel = "Add Item",
}: CreateCollectionItemButtonProps) {
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
        <Plus className="size-3.5" />
        <span>{customLabel}</span>
      </Button>

      <CreateItemDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        initialCollectionId={collectionId}
      />
    </>
  );
}
