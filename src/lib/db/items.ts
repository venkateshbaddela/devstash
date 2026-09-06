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
  content: string | null;
  contentType: string;
  url: string | null;
  language: string | null;
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
    content: item.content,
    contentType: item.contentType,
    url: item.url,
    language: item.language,
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
 */
export async function getPinnedItems(
  userId?: string
): Promise<DashboardItem[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return [];

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
      isPinned: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
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
    },
  });

  return items.map(mapToDashboardItem);
}

/**
 * Fetches recent items for the demo user or specified user.
 */
export async function getRecentItems(
  userId?: string,
  limit = 10
): Promise<DashboardItem[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return [];

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
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
    },
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
