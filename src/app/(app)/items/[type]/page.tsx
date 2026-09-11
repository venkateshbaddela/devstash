import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { getItemsByType, resolveItemTypeBySlug } from "@/lib/db/items";
import { ItemCard } from "@/components/dashboard/item-card";
import { ItemTypeIcon } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";

interface ItemTypePageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({
  params,
}: ItemTypePageProps): Promise<Metadata> {
  const { type } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const itemType = await resolveItemTypeBySlug(type, userId);

  if (!itemType) {
    return {
      title: "Not Found — DevStash",
    };
  }

  return {
    title: `${itemType.displayName} — DevStash`,
    description: `Manage your ${itemType.displayName.toLowerCase()} in DevStash.`,
  };
}

export default async function ItemTypePage({ params }: ItemTypePageProps) {
  const { type } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const { itemType, items } = await getItemsByType(type, userId);

  if (!itemType) {
    notFound();
  }

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
          <span className="text-foreground font-medium">
            {itemType.displayName}
          </span>
        </nav>

        {/* Header with Type Icon, Title, and Pro Badge */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted/40 shrink-0">
            <ItemTypeIcon
              name={itemType.icon || itemType.name}
              className="size-5"
              style={{ color: itemType.color }}
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {itemType.displayName}
            </h1>
            {itemType.isPro && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[9px] font-semibold uppercase tracking-normal leading-none rounded-lg border border-border/80 bg-muted/60 text-muted-foreground"
              >
                PRO
              </Badge>
            )}
          </div>
        </div>

        {/* Subtitle / Counter */}
        <p className="text-sm text-muted-foreground mt-1.5 pl-12">
          {items.length} {items.length === 1 ? "item" : "items"} stored in your
          library
        </p>
      </div>

      {/* Responsive Grid: 1 column on mobile, 2 columns on tablet, 3 columns on larger screens */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
            <ItemTypeIcon
              name={itemType.icon || itemType.name}
              className="size-5"
              style={{ color: itemType.color }}
            />
          </div>
          <p className="font-medium text-foreground">
            No {itemType.displayName.toLowerCase()} found yet
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Items saved under this type will show up here. Click &quot;+ New
            Item&quot; to add your first {itemType.name}.
          </p>
        </div>
      )}
    </div>
  );
}

