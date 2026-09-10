import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { getUserProfile } from "../src/lib/db/profile";
import { generateVerificationToken } from "../src/lib/tokens";

async function main() {
  console.log("👤 Starting Profile Actions & Stats Integration Tests...\n");

  const testEmail = `profile_test_${Date.now()}@devstash.io`;
  const initialPassword = "initialPassword123!";
  const newPassword = "newPassword456!";
  let testUserId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // 1. Setup: Create temporary test user with items and collections
    // -------------------------------------------------------------------------
    console.log("1. Creating temporary test user and test knowledge items...");
    const hashedPassword = await bcrypt.hash(initialPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: "Profile Tester",
        email: testEmail,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;

    // Get a system item type (e.g. snippet)
    const snippetType = await prisma.itemType.findFirst({
      where: { name: "snippet" },
    });

    if (snippetType) {
      // Create a test collection and item for this user
      const collection = await prisma.collection.create({
        data: {
          name: "Test Profile Collection",
          userId: testUserId,
        },
      });

      await prisma.item.create({
        data: {
          title: "Test Profile Snippet",
          contentType: "TEXT",
          content: "console.log('profile test');",
          userId: testUserId,
          itemTypeId: snippetType.id,
          collections: {
            create: {
              collectionId: collection.id,
            },
          },
        },
      });
    }

    console.log(`   ✅ Test user and mock stats created for: ${user.email} (ID: ${user.id})`);

    // -------------------------------------------------------------------------
    // 2. Test getUserProfile query
    // -------------------------------------------------------------------------
    console.log("\n2. Testing getUserProfile query...");
    const profile = await getUserProfile(testUserId);
    if (!profile) {
      throw new Error("Failed to fetch user profile via getUserProfile");
    }

    console.log(`   Name: ${profile.name}, Email: ${profile.email}`);
    console.log(`   Has password: ${profile.hasPassword}, Auth Method: ${profile.authMethod}`);
    console.log(`   Total Items: ${profile.stats.totalItems}, Total Collections: ${profile.stats.totalCollections}`);
    console.log(`   Active item types returned: ${profile.stats.itemTypes.length}`);

    if (profile.stats.totalItems < 1 || profile.stats.totalCollections < 1) {
      throw new Error(`Expected at least 1 item and 1 collection, got ${profile.stats.totalItems} items, ${profile.stats.totalCollections} collections`);
    }

    if (!profile.hasPassword || profile.authMethod !== "credentials") {
      throw new Error(`Expected credentials auth method, got: ${profile.authMethod}`);
    }
    console.log("   ✅ getUserProfile returned accurate user details and counts.");

    // -------------------------------------------------------------------------
    // 3. Test Profile Details Update (Name & Email with Option B verification)
    // -------------------------------------------------------------------------
    console.log("\n3. Testing display name and email update...");
    const updatedName = "Updated Profile Tester";
    const newEmailCandidate = `updated_${Date.now()}@devstash.io`;

    // 3a. Update name only
    await prisma.user.update({
      where: { id: testUserId },
      data: { name: updatedName },
    });
    const verifyNameUpdate = await prisma.user.findUnique({ where: { id: testUserId } });
    if (verifyNameUpdate?.name !== updatedName) {
      throw new Error("Failed to update user name");
    }
    console.log("   ✅ Display name updated successfully.");

    // 3b. Update email (Option B: set emailVerified: null and generate token)
    const verificationToken = await generateVerificationToken(newEmailCandidate);
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        email: newEmailCandidate,
        emailVerified: null,
      },
    });

    const verifyEmailUpdate = await prisma.user.findUnique({ where: { id: testUserId } });
    if (verifyEmailUpdate?.email !== newEmailCandidate || verifyEmailUpdate?.emailVerified !== null) {
      throw new Error("Failed to update user email or emailVerified was not reset to null");
    }

    const tokenInDb = await prisma.verificationToken.findFirst({
      where: { identifier: newEmailCandidate },
    });
    if (!tokenInDb || tokenInDb.token !== verificationToken.token) {
      throw new Error("Verification token was not created in database for new email");
    }
    console.log("   ✅ Email updated and verification token generated (Option B).");

    // -------------------------------------------------------------------------
    // 4. Test Avatar Update and Removal directly via Prisma
    // -------------------------------------------------------------------------
    console.log("\n4. Testing avatar image update and removal...");
    const mockAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const updatedWithAvatar = await prisma.user.update({
      where: { id: testUserId },
      data: { image: mockAvatar },
      select: { image: true },
    });
    if (updatedWithAvatar.image !== mockAvatar) {
      throw new Error("Failed to update avatar image");
    }
    console.log("   ✅ User avatar updated with base64 data URL.");

    const updatedWithoutAvatar = await prisma.user.update({
      where: { id: testUserId },
      data: { image: null },
      select: { image: true },
    });
    if (updatedWithoutAvatar.image !== null) {
      throw new Error("Failed to clear avatar image");
    }
    console.log("   ✅ User avatar removed successfully.");

    // -------------------------------------------------------------------------
    // 5. Test Password Change Logic
    // -------------------------------------------------------------------------
    console.log("\n5. Testing password change logic and bcrypt verification...");
    // 5a. Check wrong current password
    const userToChange = await prisma.user.findUnique({ where: { id: testUserId } });
    if (!userToChange || !userToChange.password) {
      throw new Error("Test user not found");
    }

    const wrongPasswordMatches = await bcrypt.compare("wrongPassword!", userToChange.password);
    if (wrongPasswordMatches) {
      throw new Error("Security flaw: wrong current password was accepted");
    }
    console.log("   ✅ Wrong current password correctly rejected.");

    // 5b. Check valid current password and update to new password
    const currentMatches = await bcrypt.compare(initialPassword, userToChange.password);
    if (!currentMatches) {
      throw new Error("Valid current password failed bcrypt comparison");
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: testUserId },
      data: { password: newHashedPassword },
    });

    const verifyUpdatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
    if (!verifyUpdatedUser?.password) {
      throw new Error("Updated user missing password");
    }

    const isNewValid = await bcrypt.compare(newPassword, verifyUpdatedUser.password);
    if (!isNewValid) {
      throw new Error("New password failed verification after update");
    }
    console.log("   ✅ Password successfully changed and verified with bcrypt.");

    // -------------------------------------------------------------------------
    // 6. Test Account Deletion & Cascade
    // -------------------------------------------------------------------------
    console.log("\n6. Testing cascading account deletion...");
    // Delete user
    await prisma.user.delete({
      where: { id: testUserId },
    });

    // Verify user is gone
    const deletedUserCheck = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    if (deletedUserCheck !== null) {
      throw new Error("User was not deleted");
    }

    // Verify cascading deletion of user items and collections
    const orphanedItems = await prisma.item.count({
      where: { userId: testUserId },
    });
    const orphanedCollections = await prisma.collection.count({
      where: { userId: testUserId },
    });

    if (orphanedItems !== 0 || orphanedCollections !== 0) {
      throw new Error(`Cascading deletion failed! Orphaned items: ${orphanedItems}, collections: ${orphanedCollections}`);
    }
    console.log("   ✅ User and all associated items/collections cleanly deleted via cascade.");

    testUserId = null; // Mark as deleted so cleanup block doesn't fail

    console.log("\n🎉 All Profile Page & Actions tests passed successfully!\n");
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Remove test user if still exists
    // -------------------------------------------------------------------------
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => null);
    }
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Profile Test Failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
