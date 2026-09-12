"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateItemDialog } from "@/components/items/create-item-dialog";
import {
  CreationItemType,
  CREATION_ITEM_TYPES,
  TYPE_SINGULAR_LABELS,
} from "@/lib/validations/items";
import { cn } from "cn";
import type { ItemDetail } from "@/lib/db/items";

export { TYPE_SINGULAR_LABELS };

export interface CreateTypeItemButtonProps {
  type: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "xs";
  customLabel?: string;
  onSuccess?: (item: ItemDetail) => void;
}

export function CreateTypeItemButton({
  type,
  className,
  variant = "default",
  size = "sm",
  customLabel,
  onSuccess,
}: CreateTypeItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const normalized = (type || "").toLowerCase().trim().replace(/s$/, "");
  const creationType: CreationItemType = CREATION_ITEM_TYPES.includes(
    normalized as CreationItemType
  )
    ? (normalized as CreationItemType)
    : "snippet";

  const label =
    customLabel || `New ${TYPE_SINGULAR_LABELS[creationType] || "Item"}`;

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
        <span>{label}</span>
      </Button>

      <CreateItemDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultType={creationType}
        onSuccess={onSuccess}
      />
    </>
  );
}
