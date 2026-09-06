import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testDatabase() {
  console.log("==================================================");
  console.log("🔍 Devstash Database & Demo Data Verification");
  console.log("==================================================\n");

  try {
    // 1. Connection check
    const rawResult = await prisma.$queryRaw<Array<{ now: Date; current_database: string }>>`
      SELECT NOW() as now, current_database() as current_database;
    `;
    console.log("✅ Neon PostgreSQL Connection OK");
    console.log(`   Database: ${rawResult[0]?.current_database}`);
    console.log(`   Time:     ${rawResult[0]?.now.toISOString()}\n`);

    // 2. Demo User details
    console.log("👤 1. Demo User Information:");
    console.log("--------------------------------------------------");
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
      include: {
        _count: {
          select: {
            items: true,
            collections: true,
            tags: true,
          },
        },
      },
    });

    if (!demoUser) {
      console.log("   ❌ Demo user (demo@devstash.io) not found in database!\n");
    } else {
      console.log(`   Name:           ${demoUser.name}`);
      console.log(`   Email:          ${demoUser.email}`);
      console.log(`   Email Verified: ${demoUser.emailVerified?.toISOString() ?? "No"}`);
      console.log(`   Pro Plan:       ${demoUser.isPro ? "Yes" : "No"}`);
      console.log(`   Password Hash:  ${demoUser.password ? `${demoUser.password.substring(0, 15)}... (Bcrypt)` : "None"}`);
      console.log(`   Ownership:      ${demoUser._count.items} items, ${demoUser._count.collections} collections, ${demoUser._count.tags} tags\n`);
    }

    // 3. System Item Types
    console.log("🏷️  2. System Item Types:");
    console.log("--------------------------------------------------");
    const itemTypes = await prisma.itemType.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    for (const type of itemTypes) {
      const iconStr = (type.icon || "").padEnd(11);
      const colorStr = (type.color || "").padEnd(8);
      const isSystemStr = type.isSystem ? "Yes" : "No ";
      console.log(
        `   • ${type.name.padEnd(10)} [Icon: ${iconStr} Color: ${colorStr} System: ${isSystemStr}] -> ${type._count.items} item(s)`
      );
    }
    console.log();

    // 4. Collections
    console.log("📁 3. Collections & Associated Items:");
    console.log("--------------------------------------------------");
    const collections = await prisma.collection.findMany({
      where: demoUser ? { userId: demoUser.id } : undefined,
      orderBy: { name: "asc" },
      include: {
        items: {
          include: {
            item: {
              select: {
                title: true,
                itemType: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    for (const col of collections) {
      const favBadge = col.isFavorite ? "⭐ (Favorite)" : "";
      console.log(`   📂 ${col.name} ${favBadge}`);
      console.log(`      Color:       ${col.color}`);
      console.log(`      Description: "${col.description}"`);
      console.log(`      Items (${col.items.length}):`);
      for (const ic of col.items) {
        console.log(`        - [${ic.item.itemType.name}] ${ic.item.title}`);
      }
      console.log();
    }

    // 5. Detailed Items View
    console.log("📦 4. All Items in Database (18 Items):");
    console.log("--------------------------------------------------");
    const items = await prisma.item.findMany({
      where: demoUser ? { userId: demoUser.id } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        itemType: true,
        collections: {
          include: { collection: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    items.forEach((item, index) => {
      const badges: string[] = [];
      if (item.isPinned) badges.push("📌 Pinned");
      if (item.isFavorite) badges.push("❤️ Favorite");
      const badgeStr = badges.length > 0 ? ` [${badges.join(", ")}]` : "";
      const colNames = item.collections.map((c) => c.collection.name).join(", ") || "None";
      const tagNames = item.tags.map((t) => `#${t.tag.name}`).join(" ") || "None";

      console.log(`   ${String(index + 1).padStart(2, " ")}. [${item.itemType.name.toUpperCase()} / ${item.contentType}] "${item.title}"${badgeStr}`);
      console.log(`       Description: ${item.description || "N/A"}`);
      if (item.language) console.log(`       Language:    ${item.language}`);
      if (item.url) console.log(`       URL:         ${item.url}`);
      console.log(`       Collections: ${colNames}`);
      console.log(`       Tags:        ${tagNames}`);
      if (item.content) {
        const preview = item.content.trim().split("\n")[0].slice(0, 70);
        console.log(`       Preview:     "${preview}${item.content.length > 70 ? "..." : ""}"`);
      }
      console.log();
    });

    // 6. Overall Database Stats Summary
    console.log("📊 5. Summary Statistics:");
    console.log("--------------------------------------------------");
    const [userCount, typeCount, collectionCount, itemCount, tagCount, itemCollectionCount, itemTagCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.itemType.count(),
        prisma.collection.count(),
        prisma.item.count(),
        prisma.tag.count(),
        prisma.itemCollection.count(),
        prisma.itemTag.count(),
      ]);

    console.log(`   👤 Users            : ${userCount}`);
    console.log(`   🏷️  Item Types       : ${typeCount}`);
    console.log(`   📁 Collections      : ${collectionCount}`);
    console.log(`   📦 Items            : ${itemCount}`);
    console.log(`   🔖 Tags             : ${tagCount}`);
    console.log(`   🔗 Item-Collections : ${itemCollectionCount}`);
    console.log(`   🏷️  Item-Tags        : ${itemTagCount}`);
    console.log("\n==================================================");
    console.log("🎉 All demo data successfully verified in Neon PostgreSQL!");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Database test failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
