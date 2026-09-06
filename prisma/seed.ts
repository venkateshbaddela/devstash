import "dotenv/config";
import { ContentType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { currentUser, itemTypes, collections, items } from "../src/lib/mock-data";

const CONTENT_TYPE_MAP: Record<string, ContentType> = {
  Snippets: ContentType.TEXT,
  Prompts: ContentType.TEXT,
  Commands: ContentType.TEXT,
  Notes: ContentType.TEXT,
  Files: ContentType.FILE,
  Images: ContentType.FILE,
  Links: ContentType.URL,
};

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed or Upsert User
  const user = await prisma.user.upsert({
    where: { email: currentUser.email },
    update: {
      name: currentUser.name,
      image: currentUser.avatarUrl || null,
      isPro: currentUser.isPro,
    },
    create: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.avatarUrl || null,
      isPro: currentUser.isPro,
    },
  });

  console.log(`👤 User created/verified: ${user.email}`);

  // 2. Seed System & User ItemTypes
  const itemTypeMap = new Map<string, string>();

  for (const type of itemTypes) {
    const createdType = await prisma.itemType.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: type.name,
        },
      },
      update: {
        icon: type.icon,
        color: type.color,
        isSystem: true,
      },
      create: {
        name: type.name,
        icon: type.icon,
        color: type.color,
        isSystem: true,
        userId: user.id,
      },
    });
    itemTypeMap.set(type.name, createdType.id);
  }

  console.log(`🏷️ ${itemTypes.length} ItemTypes seeded`);

  // 3. Seed Collections
  const collectionMap = new Map<string, string>();

  for (const col of collections) {
    const createdCol = await prisma.collection.upsert({
      where: { id: col.id },
      update: {
        name: col.name,
        description: col.description,
        isFavorite: col.isFavorite,
        color: col.accentColor,
      },
      create: {
        id: col.id,
        name: col.name,
        description: col.description,
        isFavorite: col.isFavorite,
        color: col.accentColor,
        userId: user.id,
      },
    });
    collectionMap.set(col.name, createdCol.id);
  }

  console.log(`📁 ${collections.length} Collections seeded`);

  // 4. Seed Items, Tags, and Relations
  for (const item of items) {
    const itemTypeId = itemTypeMap.get(item.type);
    if (!itemTypeId) continue;

    const contentType = CONTENT_TYPE_MAP[item.type] || ContentType.TEXT;

    const createdItem = await prisma.item.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        contentType,
        content: contentType === ContentType.TEXT ? item.content : null,
        url: contentType === ContentType.URL ? item.content : null,
        fileUrl: contentType === ContentType.FILE ? item.content : null,
        description: item.description,
        language: item.language,
        isPinned: item.isPinned,
        isFavorite: item.isFavorite,
        itemTypeId,
      },
      create: {
        id: item.id,
        title: item.title,
        contentType,
        content: contentType === ContentType.TEXT ? item.content : null,
        url: contentType === ContentType.URL ? item.content : null,
        fileUrl: contentType === ContentType.FILE ? item.content : null,
        description: item.description,
        language: item.language,
        isPinned: item.isPinned,
        isFavorite: item.isFavorite,
        userId: user.id,
        itemTypeId,
      },
    });

    // Handle Item Collections
    for (const colName of item.collections) {
      const colId = collectionMap.get(colName);
      if (!colId) continue;

      await prisma.itemCollection.upsert({
        where: {
          itemId_collectionId: {
            itemId: createdItem.id,
            collectionId: colId,
          },
        },
        update: {},
        create: {
          itemId: createdItem.id,
          collectionId: colId,
        },
      });
    }

    // Handle Tags
    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: tagName,
          },
        },
        update: {},
        create: {
          name: tagName,
          userId: user.id,
        },
      });

      await prisma.itemTag.upsert({
        where: {
          itemId_tagId: {
            itemId: createdItem.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          itemId: createdItem.id,
          tagId: tag.id,
        },
      });
    }
  }

  console.log(`📦 ${items.length} Items seeded with tags and collection relations`);
  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
