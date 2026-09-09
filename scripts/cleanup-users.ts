import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";

async function cleanupNonDemoUsers() {
  console.log("==================================================");
  console.log("🧹 DevStash Database User & Content Cleanup");
  console.log("==================================================\n");

  try {
    // 1. Verify Demo User exists
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: {
        _count: {
          select: {
            items: true,
            collections: true,
            tags: true,
            sessions: true,
            accounts: true,
          },
        },
      },
    });

    if (!demoUser) {
      console.error(
        `❌ Demo user (${DEMO_EMAIL}) was not found in the database!`
      );
      console.error("   Aborting to prevent accidental data loss.\n");
      process.exit(1);
    }

    console.log(`🛡️  Demo User Safeguard: Active`);
    console.log(`   ID:          ${demoUser.id}`);
    console.log(`   Email:       ${demoUser.email}`);
    console.log(
      `   Protected:   ${demoUser._count.items} items, ${demoUser._count.collections} collections, ${demoUser._count.tags} tags\n`
    );

    // 2. Identify all non-demo users
    const nonDemoUsers = await prisma.user.findMany({
      where: {
        id: { not: demoUser.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
            collections: true,
            tags: true,
            accounts: true,
            sessions: true,
          },
        },
      },
    });

    if (nonDemoUsers.length === 0) {
      console.log("✅ No non-demo users found. The database is already clean!\n");
      return;
    }

    console.log(`📋 Found ${nonDemoUsers.length} non-demo user(s) to remove:`);
    console.log("--------------------------------------------------");
    for (const [index, user] of nonDemoUsers.entries()) {
      console.log(
        `   ${index + 1}. ${user.name || "Unnamed"} (${user.email || "No email"}) [ID: ${user.id}]`
      );
      console.log(
        `      Created: ${user.createdAt.toISOString()} | Items: ${user._count.items} | Collections: ${user._count.collections} | Tags: ${user._count.tags}`
      );
    }
    console.log("");

    const nonDemoUserIds = nonDemoUsers.map((u) => u.id);
    const nonDemoEmails = nonDemoUsers
      .map((u) => u.email)
      .filter((email): email is string => Boolean(email));

    // 3. Perform cleanup in dependency order
    console.log("🗑️  Executing deletion...");

    const deleteResults = await prisma.$transaction(async (tx) => {
      // a. Verification tokens for non-demo emails
      const deletedTokens = await tx.verificationToken.deleteMany({
        where: {
          identifier: { in: nonDemoEmails },
        },
      });

      // b. Junction tables: ItemCollection & ItemTag
      const deletedItemCollections = await tx.itemCollection.deleteMany({
        where: {
          OR: [
            { item: { userId: { in: nonDemoUserIds } } },
            { collection: { userId: { in: nonDemoUserIds } } },
          ],
        },
      });

      const deletedItemTags = await tx.itemTag.deleteMany({
        where: {
          OR: [
            { item: { userId: { in: nonDemoUserIds } } },
            { tag: { userId: { in: nonDemoUserIds } } },
          ],
        },
      });

      // c. Items
      const deletedItems = await tx.item.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      // d. Collections
      const deletedCollections = await tx.collection.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      // e. Tags
      const deletedTags = await tx.tag.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      // f. Custom User ItemTypes (preserve system types where userId is null or belongs to demo user)
      const deletedItemTypes = await tx.itemType.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      // g. Sessions & Accounts
      const deletedSessions = await tx.session.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      const deletedAccounts = await tx.account.deleteMany({
        where: {
          userId: { in: nonDemoUserIds },
        },
      });

      // h. Users
      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: { in: nonDemoUserIds },
        },
      });

      return {
        users: deletedUsers.count,
        items: deletedItems.count,
        collections: deletedCollections.count,
        tags: deletedTags.count,
        itemTypes: deletedItemTypes.count,
        itemCollections: deletedItemCollections.count,
        itemTags: deletedItemTags.count,
        accounts: deletedAccounts.count,
        sessions: deletedSessions.count,
        verificationTokens: deletedTokens.count,
      };
    });

    console.log("--------------------------------------------------");
    console.log("📊 Deletion Summary:");
    console.log(`   👤 Users deleted:               ${deleteResults.users}`);
    console.log(`   📦 Items deleted:               ${deleteResults.items}`);
    console.log(`   📁 Collections deleted:         ${deleteResults.collections}`);
    console.log(`   🏷️  Tags deleted:                ${deleteResults.tags}`);
    console.log(`   🧩 Custom ItemTypes deleted:    ${deleteResults.itemTypes}`);
    console.log(`   🔗 ItemCollections unlinked:    ${deleteResults.itemCollections}`);
    console.log(`   🏷️  ItemTags unlinked:           ${deleteResults.itemTags}`);
    console.log(`   🔑 Accounts deleted:            ${deleteResults.accounts}`);
    console.log(`   🎫 Sessions deleted:            ${deleteResults.sessions}`);
    console.log(`   ✉️  Verification tokens deleted: ${deleteResults.verificationTokens}\n`);

    // 4. Verify Demo User and system state remain intact
    const demoUserPost = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
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

    const totalRemainingUsers = await prisma.user.count();
    const totalRemainingItems = await prisma.item.count();
    const systemTypesCount = await prisma.itemType.count({
      where: { userId: null },
    });

    console.log("🔍 Integrity Check:");
    console.log(`   Total Users Remaining:         ${totalRemainingUsers} (Expected: 1)`);
    console.log(`   Total Items Remaining:         ${totalRemainingItems} (Expected: ${demoUser._count.items})`);
    console.log(`   Demo User Present:             ${demoUserPost ? "✅ Yes" : "❌ No"}`);
    console.log(`   Demo Items Intact:             ${demoUserPost?._count.items} / ${demoUser._count.items}`);
    console.log(`   Demo Collections Intact:       ${demoUserPost?._count.collections} / ${demoUser._count.collections}`);
    console.log(`   Demo Tags Intact:              ${demoUserPost?._count.tags} / ${demoUser._count.tags}`);
    console.log(`   System Item Types Intact:      ${systemTypesCount} global types\n`);

    console.log("==================================================");
    console.log("🎉 Cleanup completed successfully!");
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ Cleanup failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNonDemoUsers();
