import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testDatabase() {
  console.log("🔍 Testing Neon PostgreSQL connection via Prisma 7...\n");

  try {
    // 1. Raw query connection check
    const rawResult = await prisma.$queryRaw<Array<{ now: Date; current_database: string }>>`
      SELECT NOW() as now, current_database() as current_database;
    `;
    console.log("✅ Database connection established successfully!");
    console.log(`   Database Name : ${rawResult[0]?.current_database}`);
    console.log(`   Server Time   : ${rawResult[0]?.now.toISOString()}\n`);

    // 2. Count records across all models (plural tables)
    const [userCount, typeCount, collectionCount, itemCount, tagCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.itemType.count(),
        prisma.collection.count(),
        prisma.item.count(),
        prisma.tag.count(),
      ]);

    console.log("📊 Database Record Counts:");
    console.log(`   👤 Users          : ${userCount}`);
    console.log(`   🏷️  Item Types     : ${typeCount}`);
    console.log(`   📁 Collections    : ${collectionCount}`);
    console.log(`   📦 Items          : ${itemCount}`);
    console.log(`   🔖 Tags           : ${tagCount}\n`);

    // 3. Test relational query (Item with its ItemType, Collections, and Tags)
    const sampleItem = await prisma.item.findFirst({
      where: { isPinned: true },
      include: {
        itemType: true,
        collections: {
          include: {
            collection: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (sampleItem) {
      console.log("🔗 Relational Query Test:");
      console.log(`   Title      : "${sampleItem.title}"`);
      console.log(`   Type       : ${sampleItem.itemType.name} (${sampleItem.itemType.icon})`);
      console.log(
        `   Collections: ${sampleItem.collections.map((c) => c.collection.name).join(", ") || "None"}`
      );
      console.log(
        `   Tags       : ${sampleItem.tags.map((t) => t.tag.name).join(", ") || "None"}\n`
      );
    }

    console.log("🎉 All database tests passed successfully!");
  } catch (error) {
    console.error("❌ Database connection or query failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
