"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { DashboardCollection } from "@/lib/db/collections";
import { ItemTypeIcon } from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";

export interface CollectionCardProps {
  collection: DashboardCollection;
}

export function CollectionCard({ collection: col }: CollectionCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <div
        className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 transition-all hover:bg-card/70 hover:border-border cursor-pointer"
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: col.accentColor || "#3b82f6",
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/collections/${col.id}`}
                className="font-medium text-sm sm:text-base text-foreground hover:underline truncate"
              >
                <span
                  className="absolute inset-0 rounded-xl"
                  aria-hidden="true"
                />
                {col.name}
              </Link>
              {col.isFavorite && (
                <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>

            {/* 3-dots Dropdown Menu */}
            <div
              className="relative z-10"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  data-slot="collection-card-trigger"
                  aria-label={`Options for ${col.name}`}
                  className="size-6 -mr-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-popover/95 backdrop-blur-sm"
                >
                  {/* Favorite (Placeholder icon/button per requirements) */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      // Favourites persistence will be implemented in a future update
                    }}
                    className="cursor-pointer gap-2"
                  >
                    <Star
                      className={`size-3.5 ${
                        col.isFavorite ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                    <span>{col.isFavorite ? "Favorited" : "Favorite"}</span>
                  </DropdownMenuItem>

                  {/* Edit */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditDialogOpen(true);
                    }}
                    className="cursor-pointer gap-2"
                  >
                    <Pencil className="size-3.5" />
                    <span>Edit</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Delete */}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-0.5">
            {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
          </div>

          {col.description && (
            <p className="text-xs sm:text-sm text-muted-foreground/90 mt-2.5 line-clamp-2">
              {col.description}
            </p>
          )}
        </div>

        {/* Small icons of all types in this collection */}
        <div className="flex items-center gap-2 pt-3.5 mt-2 min-h-[1.875rem]">
          {col.types.map((typeInfo) => (
            <ItemTypeIcon
              key={typeInfo.name}
              name={typeInfo.icon || typeInfo.name}
              className="size-3.5 shrink-0"
              style={{ color: typeInfo.color }}
            />
          ))}
        </div>
      </div>

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={col}
      />

      {/* Delete Collection Dialog */}
      <DeleteCollectionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        collection={col}
        redirectToCollections={false}
      />
    </>
  );
}
