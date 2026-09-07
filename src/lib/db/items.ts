import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  type: string;
  typeIcon: string;
  typeColor: string;
  tags: string[];
  date: string;
  createdAt: Date;
}

export interface ItemStats {
  totalItems: number;
  favoriteItems: number;
}

interface PrismaItemWithRelations {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  contentType: string;
  url?: string | null;
  language?: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
}

const DASHBOARD_ITEM_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  itemType: {
    select: {
      name: true,
      icon: true,
      color: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
} as const;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function mapToDashboardItem(item: PrismaItemWithRelations): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content ?? null,
    contentType: item.contentType,
    url: item.url ?? null,
    language: item.language ?? null,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    type: item.itemType.name,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    tags: item.tags.map((t) => t.tag.name),
    date: formatDate(item.createdAt),
    createdAt: item.createdAt,
  };
}

/**
 * Fetches pinned items for the demo user or specified user.
 * Bounded with a take limit and explicit field selection to avoid loading large payloads.
 */
export async function getPinnedItems(
  userId?: string,
  limit = 12
): Promise<DashboardItem[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return [];

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
      isPinned: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: DASHBOARD_ITEM_SELECT,
  });

  return items.map(mapToDashboardItem);
}

/**
 * Fetches recent items for the demo user or specified user.
 * Bounded with a take limit and explicit field selection to avoid loading large payloads.
 */
export async function getRecentItems(
  userId?: string,
  limit = 12
): Promise<DashboardItem[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return [];

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: DASHBOARD_ITEM_SELECT,
  });

  return items.map(mapToDashboardItem);
}

/**
 * Fetches item statistics (total items and favorite items).
 */
export async function getItemStats(userId?: string): Promise<ItemStats> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return { totalItems: 0, favoriteItems: 0 };
  }

  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({
      where: { userId: targetUserId },
    }),
    prisma.item.count({
      where: {
        userId: targetUserId,
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalItems,
    favoriteItems,
  };
}

export interface SidebarItemType {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  count: number;
  href: string;
  isPro?: boolean;
}

const SYSTEM_ORDER: Record<string, number> = {
  snippet: 1,
  prompt: 2,
  command: 3,
  note: 4,
  file: 5,
  image: 6,
  link: 7,
};

const DISPLAY_NAMES: Record<string, string> = {
  snippet: "Snippets",
  prompt: "Prompts",
  command: "Commands",
  note: "Notes",
  file: "Files",
  image: "Images",
  link: "Links",
};

/**
 * Fetches system item types with live item counts for the sidebar navigation.
 */
export async function getSidebarItemTypes(
  userId?: string
): Promise<SidebarItemType[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return [];

  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: {
        isSystem: true,
        OR: [
          { userId: targetUserId },
          { userId: null },
        ],
      },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId: targetUserId },
      _count: { id: true },
    }),
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(c.itemTypeId, c._count.id);
  }

  return types
    .sort((a, b) => {
      const orderA = SYSTEM_ORDER[a.name.toLowerCase()] ?? 99;
      const orderB = SYSTEM_ORDER[b.name.toLowerCase()] ?? 99;
      return orderA - orderB;
    })
    .map((type) => {
      const lower = type.name.toLowerCase();
      const displayName =
        DISPLAY_NAMES[lower] ||
        type.name.charAt(0).toUpperCase() + type.name.slice(1);
      const isPro = lower === "file" || lower === "image";

      return {
        id: type.id,
        name: type.name,
        displayName,
        icon: type.icon,
        color: type.color,
        count: countMap.get(type.id) ?? 0,
        href: `/items/${type.name}`,
        isPro,
      };
    });
}

