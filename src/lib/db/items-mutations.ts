import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";
import { deleteFileFromB2 } from "@/lib/storage";
import { mapToItemDetail, type ItemDetail } from "@/lib/db/items";

export interface UpdateItemData {
  title: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags?: string[];
}

export interface CreateItemData {
  title: string;
  type: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | bigint | null;
  mimeType?: string | null;
  storageKey?: string | null;
  tags?: string[];
  collectionId?: string | null;
}

/**
 * Efficiently reconciles and links tags to an item inside a transaction.
 * Uses batched findMany and createMany operations instead of sequential N-query loops.
 */
export async function reconcileItemTags(
  tx: Prisma.TransactionClient,
  itemId: string,
  targetUserId: string,
  tags: string[]
): Promise<void> {
  const uniqueTagNames = Array.from(
    new Set(
      tags
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    )
  );

  if (uniqueTagNames.length === 0) {
    return;
  }

  // 1. Fetch any tags that already exist for this user
  const existingTags = await tx.tag.findMany({
    where: {
      userId: targetUserId,
      name: { in: uniqueTagNames },
    },
    select: { id: true, name: true },
  });

  const existingNames = new Set(existingTags.map((t) => t.name));
  const missingNames = uniqueTagNames.filter((name) => !existingNames.has(name));

  // 2. Batch-create missing tags
  if (missingNames.length > 0) {
    await tx.tag.createMany({
      data: missingNames.map((name) => ({
        name,
        userId: targetUserId,
      })),
      skipDuplicates: true,
    });
  }

  // 3. Fetch all tag IDs for linking
  const allTags =
    missingNames.length > 0
      ? await tx.tag.findMany({
          where: {
            userId: targetUserId,
            name: { in: uniqueTagNames },
          },
          select: { id: true },
        })
      : existingTags;

  // 4. Batch-create item-tag join records
  if (allTags.length > 0) {
    await tx.itemTag.createMany({
      data: allTags.map((tag) => ({
        itemId,
        tagId: tag.id,
      })),
      skipDuplicates: true,
    });
  }
}

/**
 * Updates an item's editable fields and reconciles its tags.
 * Reconciles tags by disconnecting existing ones and connecting/creating new ones.
 * Returns the fresh ItemDetail.
 */
export async function updateItem(
  itemId: string,
  userId: string | undefined,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return null;

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: targetUserId },
  });

  if (!existing) return null;

  return await prisma.$transaction(
    async (tx) => {
      // 1. Reconcile tags if tags array is provided
      if (Array.isArray(data.tags)) {
        await tx.itemTag.deleteMany({
          where: { itemId },
        });

        await reconcileItemTags(tx, itemId, targetUserId, data.tags);
      }

      // 2. Update core item properties
      const updated = await tx.item.update({
        where: { id: itemId },
        data: {
          title: data.title.trim(),
          description:
            data.description !== undefined ? data.description : undefined,
          content: data.content !== undefined ? data.content : undefined,
          url: data.url !== undefined ? data.url : undefined,
          language: data.language !== undefined ? data.language : undefined,
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

      return mapToItemDetail(updated);
    },
    {
      timeout: 15000,
      maxWait: 10000,
    }
  );
}

/**
 * Deletes an item belonging to the specified user.
 * Returns true if successfully deleted, false if not found or unauthorized.
 * Also cleans up attached file from Backblaze B2 storage if present.
 */
export async function deleteItem(
  itemId: string,
  userId?: string | null
): Promise<boolean> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId || !itemId || typeof itemId !== "string" || !itemId.trim()) {
    return false;
  }

  const cleanItemId = itemId.trim();

  const existing = await prisma.item.findFirst({
    where: { id: cleanItemId, userId: targetUserId },
    select: { id: true, storageKey: true },
  });

  if (!existing) return false;

  await prisma.item.delete({
    where: { id: cleanItemId },
  });

  if (existing.storageKey) {
    try {
      await deleteFileFromB2(existing.storageKey);
    } catch (storageErr) {
      console.warn("Failed to delete file from B2 storage:", storageErr);
    }
  }

  return true;
}

/**
 * Creates a new item in the database for the specified user.
 * Resolves system item type, creates tags and links atomically via transaction,
 * and returns the full ItemDetail.
 */
export async function createItem(
  userId: string | null | undefined,
  data: CreateItemData
): Promise<ItemDetail | null> {
  const targetUserId = userId ?? (await getDefaultUserId());
  if (!targetUserId) return null;

  const typeLower = data.type.toLowerCase().trim();
  const itemType = await prisma.itemType.findFirst({
    where: {
      name: typeLower,
      OR: [{ userId: targetUserId }, { userId: null }],
    },
  });

  if (!itemType) return null;

  const isFileType = typeLower === "file" || typeLower === "image";
  const contentType = isFileType ? "FILE" : typeLower === "link" ? "URL" : "TEXT";

  return await prisma.$transaction(
    async (tx) => {
      const created = await tx.item.create({
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          contentType,
          content: data.content !== undefined ? data.content : null,
          url: data.url?.trim() || null,
          language: data.language?.trim() || null,
          fileUrl: data.fileUrl?.trim() || null,
          fileName: data.fileName?.trim() || null,
          fileSize:
            data.fileSize !== undefined && data.fileSize !== null
              ? BigInt(data.fileSize)
              : null,
          mimeType: data.mimeType?.trim() || null,
          storageKey: data.storageKey?.trim() || null,
          userId: targetUserId,
          itemTypeId: itemType.id,
          ...(data.collectionId
            ? {
                collections: {
                  create: [{ collectionId: data.collectionId }],
                },
              }
            : {}),
        },
      });

      if (Array.isArray(data.tags)) {
        await reconcileItemTags(tx, created.id, targetUserId, data.tags);
      }

      const fullItem = await tx.item.findUnique({
        where: { id: created.id },
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

      return fullItem ? mapToItemDetail(fullItem) : null;
    },
    {
      timeout: 15000,
      maxWait: 10000,
    }
  );
}
