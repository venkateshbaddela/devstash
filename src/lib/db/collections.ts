import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CollectionTypeInfo {
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  accentColor: string;
  types: CollectionTypeInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionStats {
  totalCollections: number;
  favoriteCollections: number;
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  color: string | null;
  itemCount: number;
}

/**
 * Resolves the default user ID (demo user for development/demo mode).
 * Memoized per server request using React cache().
 */
export const getDefaultUserId = cache(async (): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  return user?.id ?? null;
});

/**
 * Fetches collections for the dashboard view.
 * Derives card accent border color from the most-used content type in that collection,
 * and extracts all distinct item types present in the collection.
 */
export async function getDashboardCollections(
  userId?: string,
  limit = 6
): Promise<DashboardCollection[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              contentType: true,
              itemType: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return collections.map((col) => {
    // Tally item types for this collection
    const typeMap = new Map<string, CollectionTypeInfo>();

    for (const relation of col.items) {
      const it = relation.item.itemType;
      if (!it) continue;

      const existing = typeMap.get(it.name);
      if (existing) {
        existing.count += 1;
      } else {
        typeMap.set(it.name, {
          name: it.name,
          icon: it.icon,
          color: it.color,
          count: 1,
        });
      }
    }

    // Sort types by count desc, then name asc
    const types = Array.from(typeMap.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

    // Derive collection card border color from most-used content type in that collection
    const mostUsedType = types[0];
    const accentColor = mostUsedType?.color || col.color || "#3b82f6";

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      accentColor,
      types,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    };
  });
}

/**
 * Fetches all collections for a user.
 */
export async function getCollections(
  userId?: string
): Promise<DashboardCollection[]> {
  return getDashboardCollections(userId, undefined);
}

/**
 * Fetches lightweight collection records specifically for the sidebar navigation.
 * Selects only necessary fields and item counts without loading full item rows or types.
 */
export async function getSidebarCollections(
  userId?: string
): Promise<SidebarCollection[]> {
  const targetUserId = userId ?? (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId: targetUserId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      isFavorite: true,
      color: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return collections.map((col) => ({
    id: col.id,
    name: col.name,
    isFavorite: col.isFavorite,
    color: col.color,
    itemCount: col._count.items,
  }));
}

/**
 * Fetches collection statistics for the dashboard stats overview cards.
 */
export async function getCollectionStats(
  userId?: string
): Promise<CollectionStats> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return {
      totalCollections: 0,
      favoriteCollections: 0,
    };
  }

  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({
      where: { userId: targetUserId },
    }),
    prisma.collection.count({
      where: {
        userId: targetUserId,
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalCollections,
    favoriteCollections,
  };
}
