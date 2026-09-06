import { Pin } from "lucide-react";
import { items } from "@/lib/mock-data";
import { ItemCard } from "@/components/dashboard/item-card";

export function PinnedItems() {
  const pinnedItems = items.filter((item) => item.isPinned);

  if (pinnedItems.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3.5" aria-label="Pinned Items">
      <div className="flex items-center gap-2">
        <Pin className="size-4 text-muted-foreground rotate-45" />
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
          Pinned
        </h2>
      </div>

      <div className="space-y-3">
        {pinnedItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
