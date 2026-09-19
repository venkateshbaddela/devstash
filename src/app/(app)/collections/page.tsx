import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardCollections } from "@/lib/db/collections";
import { CollectionCard } from "@/components/collections/collection-card";
import { CreateCollectionButton } from "@/components/collections/create-collection-button";

export const metadata: Metadata = {
  title: "Collections — DevStash",
  description: "Browse and organize your collections in DevStash.",
};

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const collections = await getDashboardCollections(userId, 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
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
            <span className="text-foreground font-medium">Collections</span>
          </nav>

          {/* Title & Count */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted/40 shrink-0">
              <Folder className="size-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Collections
            </h1>
          </div>

          <p className="text-sm text-muted-foreground mt-1.5 pl-12">
            {collections.length} {collections.length === 1 ? "collection" : "collections"} in your workspace
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pl-12 sm:pl-0">
          <CreateCollectionButton />
        </div>
      </div>

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/20 space-y-4">
          <div className="flex size-12 mx-auto items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
            <Folder className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              No collections yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Collections help you group and organize related snippets, notes, prompts, commands, and links.
            </p>
          </div>
          <div className="pt-2">
            <CreateCollectionButton customLabel="Create your first collection" />
          </div>
        </div>
      )}
    </div>
  );
}
