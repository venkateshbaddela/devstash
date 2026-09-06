import { Layers, Folder, Star, Bookmark } from "lucide-react";
import { items, collections } from "@/lib/mock-data";

export function StatsCards() {
  const totalItems = items.length;
  const totalCollections = collections.length;
  const favoriteItems = items.filter((item) => item.isFavorite).length;
  const favoriteCollections = collections.filter((col) => col.isFavorite).length;

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Layers,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Collections",
      value: totalCollections,
      icon: Folder,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Favorite Items",
      value: favoriteItems,
      icon: Star,
      iconColor: "text-yellow-400 fill-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Favorite Collections",
      value: favoriteCollections,
      icon: Bookmark,
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <section aria-label="Dashboard Overview Stats">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:bg-card/70 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <Icon className={`size-3.5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
