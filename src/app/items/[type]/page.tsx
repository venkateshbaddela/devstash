import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { itemTypes, items } from "@/lib/mock-data";
import { ItemCard } from "@/components/dashboard/item-card";

export default async function ItemTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const itemType = itemTypes.find(
    (t) => t.id.toLowerCase() === type.toLowerCase()
  );

  if (!itemType) {
    notFound();
  }

  const matchingItems = items.filter(
    (item) => item.type.toLowerCase() === itemType.name.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
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
          <span className="text-foreground font-medium">{itemType.name}</span>
        </nav>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {itemType.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {matchingItems.length} {matchingItems.length === 1 ? "item" : "items"}{" "}
          stored in your library
        </p>
      </div>

      <div className="space-y-3">
        {matchingItems.length > 0 ? (
          matchingItems.map((item) => <ItemCard key={item.id} item={item} />)
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            No {itemType.name.toLowerCase()} found yet.
          </div>
        )}
      </div>
    </div>
  );
}

