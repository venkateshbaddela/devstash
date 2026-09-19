"use client";

import * as React from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { CreateCollectionItemButton } from "@/components/collections/create-collection-item-button";
import type { DashboardCollection } from "@/lib/db/collections";

interface CollectionDetailHeaderActionsProps {
  collection: {
    id: string;
    name: string;
    description?: string | null;
    isFavorite?: boolean;
  };
  onCollectionUpdated?: (collection: DashboardCollection) => void;
}

export function CollectionDetailHeaderActions({
  collection,
  onCollectionUpdated,
}: CollectionDetailHeaderActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0 flex-wrap">
        {/* Favorite Button (Placeholder per requirements: icon/button only) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-amber-400 hover:border-amber-400/40 cursor-pointer transition-colors"
          title={collection.isFavorite ? "Favorited" : "Favorite"}
          aria-label="Favorite collection"
          onClick={(e) => {
            e.preventDefault();
            // Favourites persistence will be implemented in a future update
          }}
        >
          <Star
            className={cn(
              "size-3.5 shrink-0",
              collection.isFavorite && "fill-amber-400 text-amber-400"
            )}
          />
          <span className="hidden sm:inline">Favorite</span>
        </Button>

        {/* Edit Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          aria-label="Edit collection metadata"
        >
          <Pencil className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">Edit</span>
        </Button>

        {/* Delete Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 cursor-pointer transition-colors"
          aria-label="Delete collection"
        >
          <Trash2 className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">Delete</span>
        </Button>

        {/* Create Item in Collection */}
        <CreateCollectionItemButton collectionId={collection.id} />
      </div>

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collection}
        onSuccess={onCollectionUpdated}
      />

      {/* Delete Collection Dialog */}
      <DeleteCollectionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        collection={collection}
        redirectToCollections={true}
      />
    </>
  );
}
