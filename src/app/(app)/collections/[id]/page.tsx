import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Folder, Star, Layers } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionById, getCollectionItems } from "@/lib/db/collections";
import { ItemCard } from "@/components/dashboard/item-card";
import { ImageCard } from "@/components/items/image-card";
import { ItemTypeIcon } from "@/lib/icons";
import { CollectionDetailHeaderActions } from "@/components/collections/collection-detail-header-actions";
import { CreateCollectionItemButton } from "@/components/collections/create-collection-item-button";

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const collection = await getCollectionById(id, userId);

  if (!collection) {
    return {
      title: "Collection Not Found — DevStash",
    };
  }

  return {
    title: `${collection.name} — DevStash`,
    description:
      collection.description ||
      `Explore items inside the ${collection.name} collection on DevStash.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const [collection, items] = await Promise.all([
    getCollectionById(id, userId),
    getCollectionItems(id, userId),
  ]);

  if (!collection) {
    notFound();
  }

  // Derive accurate type breakdown and dominant accent color directly from items
  const typeMap = new Map<
    string,
    { count: number; icon: string; color: string }
  >();
  for (const item of items) {
    const existing = typeMap.get(item.type);
    if (existing) {
      existing.count++;
    } else {
      typeMap.set(item.type, {
        count: 1,
        icon: item.typeIcon,
        color: item.typeColor,
      });
    }
  }

  const collectionTypes = Array.from(typeMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    icon: data.icon,
    color: data.color,
  }));

  const dominantType = [...collectionTypes].sort((a, b) => b.count - a.count)[0];
  const accentColor = dominantType?.color || collection.accentColor || "#3b82f6";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3"
          >
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
            <Link
              href="/collections"
              className="hover:text-foreground transition-colors"
            >
              Collections
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
              {collection.name}
            </span>
          </nav>

          {/* Title & Accent */}
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-lg shrink-0"
              style={{
                backgroundColor: `${accentColor}18`,
                border: `1px solid ${accentColor}40`,
              }}
            >
              <Folder
                className="size-5"
                style={{ color: accentColor }}
              />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
                {collection.name}
              </h1>
              {collection.isFavorite && (
                <Star
                  className="size-4.5 fill-amber-400 text-amber-400 shrink-0"
                  aria-label="Favorite Collection"
                />
              )}
            </div>
          </div>

          {/* Description */}
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1.5 pl-12 max-w-2xl">
              {collection.description}
            </p>
          )}

          {/* Count and Type Breakdown */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pl-12">
            <span className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>

            {collectionTypes.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground/40">•</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {collectionTypes.map((typeInfo) => (
                    <span
                      key={typeInfo.name}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-border/60 bg-muted/30 text-muted-foreground font-medium"
                    >
                      <ItemTypeIcon
                        name={typeInfo.icon || typeInfo.name}
                        className="size-3 shrink-0"
                        style={{ color: typeInfo.color }}
                      />
                      <span>{typeInfo.name}</span>
                      <span className="text-muted-foreground/70 text-[10px]">
                        ({typeInfo.count})
                      </span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <CollectionDetailHeaderActions collection={collection} />
      </div>

      {/* Collection Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {items.map((item) =>
            item.type.toLowerCase() === "image" ? (
              <ImageCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            )
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/20 space-y-4">
          <div className="flex size-12 mx-auto items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
            <Layers className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              No items in this collection yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add snippets, commands, notes, prompts, links, or files to organize
              them in this collection.
            </p>
          </div>
          <div className="pt-2">
            <CreateCollectionItemButton
              collectionId={collection.id}
              customLabel="Add your first item"
            />
          </div>
        </div>
      )}
    </div>
  );
}
