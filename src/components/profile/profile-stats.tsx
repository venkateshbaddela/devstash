import Link from "next/link";
import { Layers, Folder, ArrowRight } from "lucide-react";
import { ItemTypeIcon } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import type { SidebarItemType } from "@/lib/db/items";

interface ProfileStatsProps {
  totalItems: number;
  totalCollections: number;
  itemTypes: SidebarItemType[];
}

export function ProfileStats({
  totalItems,
  totalCollections,
  itemTypes,
}: ProfileStatsProps) {
  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Items */}
        <div className="rounded-xl border border-border/70 bg-card p-5 backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Knowledge Items
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {totalItems}
            </p>
            <p className="text-xs text-muted-foreground">
              Across all categories & system types
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="size-6" />
          </div>
        </div>

        {/* Total Collections */}
        <div className="rounded-xl border border-border/70 bg-card p-5 backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Collections Created
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {totalCollections}
            </p>
            <p className="text-xs text-muted-foreground">
              Organized knowledge groups
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Folder className="size-6" />
          </div>
        </div>
      </div>

      {/* Item Type Breakdown */}
      <div className="rounded-xl border border-border/70 bg-card p-6 backdrop-blur-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Knowledge by Item Type
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Breakdown of your saved resources by content classification
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {itemTypes.length} Types Active
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itemTypes.map((type) => {
            const percentage =
              totalItems > 0 ? Math.round((type.count / totalItems) * 100) : 0;

            return (
              <Link
                key={type.id}
                href={type.href || `/items/${type.name}`}
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        backgroundColor: `${type.color}18`,
                        borderColor: `${type.color}40`,
                        color: type.color,
                      }}
                    >
                      <ItemTypeIcon name={type.icon || type.name} className="size-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {type.displayName}
                        </span>
                        {type.isPro && (
                          <Badge
                            variant="secondary"
                            className="rounded px-1 py-0 text-[8px] font-semibold uppercase tracking-wider text-amber-500 border-amber-500/20 bg-amber-500/10"
                          >
                            PRO
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {type.count}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground/50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percentage, type.count > 0 ? 5 : 0)}%`,
                      backgroundColor: type.color,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {percentage}% of total
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {type.count} {type.count === 1 ? "item" : "items"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
