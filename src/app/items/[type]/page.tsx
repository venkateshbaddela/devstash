import { itemTypes, items } from "@/lib/mock-data";
import { notFound } from "next/navigation";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {itemType.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {itemType.count} {itemType.count === 1 ? "item" : "items"} stored in your library
        </p>
      </div>

      <div className="space-y-3">
        {matchingItems.length > 0 ? (
          matchingItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/70 bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No {itemType.name.toLowerCase()} found yet.
          </div>
        )}
      </div>
    </div>
  );
}
