import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { DashboardItem } from "@/lib/db/items";

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
        take: 100,
        select: {
          item: {
            select: {
              itemType: {
                select: {
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
 * Fetches collections for a user with a bounded default limit.
 */
export async function getCollections(
  userId?: string,
  limit = 50
): Promise<DashboardCollection[]> {
  return getDashboardCollections(userId, limit);
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

export interface CreateCollectionData {
  name: string;
  description?: string | null;
  color?: string | null;
}

/**
 * Creates a new collection for a user.
 */
export async function createCollection(
  userId: string,
  data: CreateCollectionData
): Promise<DashboardCollection> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color?.trim() || null,
      userId,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    accentColor: collection.color || "#3b82f6",
    types: [],
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

export interface UpdateCollectionData {
  name?: string;
  description?: string | null;
  color?: string | null;
}

/**
 * Updates an existing collection for a user.
 * Ensures the collection belongs to the target user.
 */
export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<DashboardCollection> {
  const existing = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    include: {
      items: {
        take: 100,
        select: {
          item: {
            select: {
              itemType: {
                select: {
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

  if (!existing) {
    throw new Error("Collection not found or unauthorized.");
  }

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.color !== undefined ? { color: data.color?.trim() || null } : {}),
    },
    include: {
      items: {
        take: 100,
        select: {
          item: {
            select: {
              itemType: {
                select: {
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

  const typeMap = new Map<string, CollectionTypeInfo>();
  for (const relation of updated.items) {
    const it = relation.item.itemType;
    if (!it) continue;
    const existingType = typeMap.get(it.name);
    if (existingType) {
      existingType.count += 1;
    } else {
      typeMap.set(it.name, {
        name: it.name,
        icon: it.icon,
        color: it.color,
        count: 1,
      });
    }
  }

  const types = Array.from(typeMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });

  const mostUsedType = types[0];
  const accentColor = mostUsedType?.color || updated.color || "#3b82f6";

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    isFavorite: updated.isFavorite,
    itemCount: updated._count.items,
    accentColor,
    types,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Deletes a collection for a user.
 * Items in this collection are NOT deleted; only the collection record
 * and its junction links in item_collections are removed.
 */
export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<{ success: boolean; id: string }> {
  const existing = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Collection not found or unauthorized.");
  }

  // Deleting the collection cascades to delete item_collections records
  // Items themselves remain completely intact in items table
  await prisma.collection.delete({
    where: { id: collectionId },
  });

  return { success: true, id: collectionId };
}

/**
 * Fetches a single collection by ID scoped to a user (defaults to demo user).
 */
export const getCollectionById = cache(async function getCollectionById(
  id: string,
  userId?: string
): Promise<DashboardCollection | null> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return null;
  }

  const col = await prisma.collection.findFirst({
    where: {
      id,
      userId: targetUserId,
    },
    include: {
      items: {
        take: 100,
        select: {
          item: {
            select: {
              itemType: {
                select: {
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

  if (!col) {
    return null;
  }

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

  const types = Array.from(typeMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });

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

/**
 * Fetches items belonging to a collection, scoped to the user, formatted for DashboardItem.
 */
export const getCollectionItems = cache(async function getCollectionItems(
  collectionId: string,
  userId?: string
): Promise<DashboardItem[]> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) {
    return [];
  }

  const itemCollections = await prisma.itemCollection.findMany({
    where: {
      collectionId,
      collection: {
        userId: targetUserId,
      },
    },
    orderBy: {
      addedAt: "desc",
    },
    select: {
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          contentType: true,
          url: true,
          language: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
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
        },
      },
    },
  });

  return itemCollections.map(({ item }) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    content: null,
    contentType: item.contentType,
    url: item.url ?? null,
    language: item.language ?? null,
    fileUrl: item.fileUrl ?? null,
    fileName: item.fileName ?? null,
    fileSize: item.fileSize ? Number(item.fileSize) : null,
    mimeType: item.mimeType ?? null,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    type: item.itemType.name,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    tags: item.tags.map((t) => t.tag.name),
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(item.createdAt),
    createdAt: item.createdAt,
  }));
});
