import { Clock } from "lucide-react";
import { items } from "@/lib/mock-data";
import { ItemCard } from "@/components/dashboard/item-card";

export function RecentItems() {
  const recentItems = items.slice(0, 10);

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3.5" aria-label="Recent Items">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
          Recent Items
        </h2>
      </div>

      <div className="space-y-3">
        {recentItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
