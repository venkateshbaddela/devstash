import { cache } from "react";
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
 * Memoized per server request using React cache().
 */
export const getSidebarItemTypes = cache(async function getSidebarItemTypes(
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
});

export interface ResolvedItemType {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  isSystem: boolean;
  isPro?: boolean;
}

/**
 * Resolves an ItemType by slug (supports singular/plural, system or user-defined).
 * Memoized per server request using React cache().
 */
export const resolveItemTypeBySlug = cache(async function resolveItemTypeBySlug(
  slug: string,
  userId?: string
): Promise<ResolvedItemType | null> {
  const targetUserId = userId ?? (await getDefaultUserId());
  const normalized = slug.trim().toLowerCase();
  const singular = normalized.replace(/s$/, "");

  const itemTypes = await prisma.itemType.findMany({
    where: {
      OR: [
        { isSystem: true },
        ...(targetUserId ? [{ userId: targetUserId }] : []),
      ],
    },
  });

  const matchedType = itemTypes.find((t) => {
    const tName = t.name.toLowerCase();
    const tSingular = tName.replace(/s$/, "");
    return (
      tName === normalized ||
      tSingular === normalized ||
      tName === singular ||
      tSingular === singular ||
      t.id === slug
    );
  });

  if (!matchedType) return null;

  const lower = matchedType.name.toLowerCase();
  const displayName =
    DISPLAY_NAMES[lower] ||
    matchedType.name.charAt(0).toUpperCase() + matchedType.name.slice(1);
  const isPro = lower === "file" || lower === "image";

  return {
    id: matchedType.id,
    name: matchedType.name,
    displayName,
    icon: matchedType.icon,
    color: matchedType.color,
    isSystem: matchedType.isSystem,
    isPro,
  };
});

/**
 * Fetches items belonging to a specific item type slug or ID.
 * Scoped to the authenticated user or default demo user.
 * Memoized per server request using React cache().
 */
export const getItemsByType = cache(async function getItemsByType(
  slugOrId: string,
  userId?: string,
  limit?: number
): Promise<{ itemType: ResolvedItemType | null; items: DashboardItem[] }> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return { itemType: null, items: [] };
  }

  const itemType = await resolveItemTypeBySlug(slugOrId, targetUserId);
  if (!itemType) {
    return { itemType: null, items: [] };
  }

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
      itemTypeId: itemType.id,
    },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
    select: DASHBOARD_ITEM_SELECT,
  });

  return {
    itemType,
    items: items.map(mapToDashboardItem),
  };
});

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  type: string;
  typeDisplayName: string;
  typeIcon: string;
  typeColor: string;
  isPro?: boolean;
  tags: string[];
  collections: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

function formatDetailDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Fetches full item details by ID scoped to the authenticated user or default demo user.
 * Memoized per server request using React cache().
 */
export const getItemById = cache(async function getItemById(
  itemId: string,
  userId?: string
): Promise<ItemDetail | null> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return null;

  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId: targetUserId,
    },
    include: {
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      collections: {
        include: {
          collection: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  const lower = item.itemType.name.toLowerCase();
  const typeDisplayName =
    DISPLAY_NAMES[lower] ||
    item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1);
  const isPro = lower === "file" || lower === "image";

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    url: item.url,
    language: item.language,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize ? Number(item.fileSize) : null,
    mimeType: item.mimeType,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    type: item.itemType.name,
    typeDisplayName,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    isPro,
    tags: item.tags.map((t) => t.tag.name),
    collections: item.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: c.collection.color,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    formattedCreatedAt: formatDetailDate(item.createdAt),
    formattedUpdatedAt: formatDetailDate(item.updatedAt),
  };
});


