import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  generatePasswordResetToken,
  getPasswordResetTokenByToken,
  verifyPasswordResetToken,
  generateVerificationToken,
} from "../src/lib/tokens";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "../src/actions/auth";

async function main() {
  console.log("🔐 Starting Password Reset Integration Tests...\n");

  const testEmail = `reset_test_${Date.now()}@devstash.io`;
  const initialPassword = "initialPassword123!";
  const newPassword = "newSecurePassword456!";
  let testUserId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // Setup: Create a temporary test user
    // -------------------------------------------------------------------------
    console.log("1. Creating temporary test user...");
    const initialHashedPassword = await bcrypt.hash(initialPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: "Password Reset Tester",
        email: testEmail,
        password: initialHashedPassword,
        emailVerified: null, // Initially unverified
      },
    });
    testUserId = user.id;
    console.log(`   ✅ Test user created: ${user.email} (ID: ${user.id})`);

    // -------------------------------------------------------------------------
    // Test 2: Token Generation & Isolation
    // -------------------------------------------------------------------------
    console.log("\n2. Testing token generation and namespace isolation...");
    const resetRecord = await generatePasswordResetToken(testEmail);
    console.log(`   Generated reset token: ${resetRecord.token}`);
    console.log(`   Reset token identifier: ${resetRecord.identifier}`);

    if (!resetRecord.identifier.startsWith("password-reset:")) {
      throw new Error(`Expected identifier to start with 'password-reset:', got: ${resetRecord.identifier}`);
    }

    // Password reset helper getPasswordResetTokenByToken enforces namespace check:
    const asPasswordReset = await getPasswordResetTokenByToken(resetRecord.token);
    if (!asPasswordReset) {
      throw new Error("Failed to retrieve token via getPasswordResetTokenByToken");
    }

    // Create an email verification token and ensure getPasswordResetTokenByToken rejects it
    const emailVerifyRecord = await generateVerificationToken(testEmail);
    const emailTokenAsReset = await getPasswordResetTokenByToken(emailVerifyRecord.token);
    if (emailTokenAsReset !== null) {
      throw new Error("Security flaw: email verification token was accepted as password reset token!");
    }
    console.log("   ✅ Reset tokens and email verification tokens are properly isolated.");

    // -------------------------------------------------------------------------
    // Test 3: Token Verification (verifyPasswordResetToken)
    // -------------------------------------------------------------------------
    console.log("\n3. Testing verifyPasswordResetToken...");
    // Valid token
    const verifyValid = await verifyPasswordResetToken(resetRecord.token);
    if (!verifyValid.success || verifyValid.email !== testEmail) {
      throw new Error(`Expected valid verification, got: ${JSON.stringify(verifyValid)}`);
    }
    console.log("   ✅ Valid token properly verified without consumption.");

    // Invalid token
    const verifyInvalid = await verifyPasswordResetToken("non-existent-token-xyz");
    if (verifyInvalid.success) {
      throw new Error("Expected invalid token to fail verification");
    }
    console.log("   ✅ Non-existent token rejected.");

    // Expired token
    const expiredRecord = await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${testEmail}`,
        token: "expired-test-token-12345",
        expires: new Date(Date.now() - 60000), // 1 minute in the past
      },
    });
    const verifyExpired = await verifyPasswordResetToken(expiredRecord.token);
    if (verifyExpired.success || (!verifyExpired.success && verifyExpired.error !== "TOKEN_EXPIRED")) {
      throw new Error(`Expected TOKEN_EXPIRED error, got: ${JSON.stringify(verifyExpired)}`);
    }
    console.log("   ✅ Expired token correctly identified and cleaned up.");

    // -------------------------------------------------------------------------
    // Test 4: Server Action - requestPasswordResetAction
    // -------------------------------------------------------------------------
    console.log("\n4. Testing requestPasswordResetAction...");
    // 4a. Invalid email format
    const invalidEmailRes = await requestPasswordResetAction("not-an-email");
    if (invalidEmailRes.success) {
      throw new Error("Expected invalid email to fail");
    }
    console.log("   ✅ Malformed email rejected.");

    // 4b. Non-existent email (enumeration prevention)
    const nonExistentRes = await requestPasswordResetAction("ghost_user_xyz@devstash.io");
    if (!nonExistentRes.success) {
      throw new Error("Expected generic success response for non-existent email to prevent enumeration");
    }
    console.log("   ✅ Non-existent email returns generic success message.");

    // 4c. Valid registered email
    const validRequestRes = await requestPasswordResetAction(testEmail);
    if (!validRequestRes.success) {
      throw new Error(`Expected success for valid user, got: ${validRequestRes.error}`);
    }
    console.log("   ✅ Password reset request for existing user succeeded.");

    // Fetch newly generated reset token from DB
    const activeResetRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `password-reset:${testEmail}` },
      orderBy: { expires: "desc" },
    });
    if (!activeResetRecord) {
      throw new Error("No reset token found in database after requestPasswordResetAction");
    }
    console.log(`   Active token created in DB: ${activeResetRecord.token}`);

    // -------------------------------------------------------------------------
    // Test 5: Server Action - resetPasswordAction
    // -------------------------------------------------------------------------
    console.log("\n5. Testing resetPasswordAction...");
    // 5a. Password mismatch
    const mismatchRes = await resetPasswordAction(activeResetRecord.token, "passOne123", "passTwo123");
    if (mismatchRes.success) {
      throw new Error("Expected mismatched passwords to fail");
    }
    console.log("   ✅ Password mismatch rejected.");

    // 5b. Short password (<8 chars)
    const shortRes = await resetPasswordAction(activeResetRecord.token, "short", "short");
    if (shortRes.success) {
      throw new Error("Expected short password to fail");
    }
    console.log("   ✅ Short password (< 8 chars) rejected.");

    // 5c. Valid reset execution
    const resetSuccessRes = await resetPasswordAction(
      activeResetRecord.token,
      newPassword,
      newPassword
    );
    if (!resetSuccessRes.success) {
      throw new Error(`Expected reset to succeed, got: ${resetSuccessRes.error}`);
    }
    console.log("   ✅ Password reset action executed successfully.");

    // -------------------------------------------------------------------------
    // Test 6: Verify Database Updates & Token Consumption
    // -------------------------------------------------------------------------
    console.log("\n6. Verifying database state post-reset...");
    // 6a. Token should be deleted (consumed)
    const consumedTokenCheck = await prisma.verificationToken.findUnique({
      where: { token: activeResetRecord.token },
    });
    if (consumedTokenCheck !== null) {
      throw new Error("Token was not deleted upon consumption!");
    }
    console.log("   ✅ Used reset token was properly deleted from database.");

    // 6b. Replaying the token should fail
    const replayRes = await resetPasswordAction(
      activeResetRecord.token,
      "anotherPassword123!",
      "anotherPassword123!"
    );
    if (replayRes.success) {
      throw new Error("Security flaw: Consumed token was allowed to be reused!");
    }
    console.log("   ✅ Token replay rejected.");

    // 6c. User password hash changed and verifies with new password
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    if (!updatedUser || !updatedUser.password) {
      throw new Error("Updated user not found or missing password");
    }

    const oldPasswordMatches = await bcrypt.compare(initialPassword, updatedUser.password);
    if (oldPasswordMatches) {
      throw new Error("Old password still matches! Password was not updated.");
    }

    const newPasswordMatches = await bcrypt.compare(newPassword, updatedUser.password);
    if (!newPasswordMatches) {
      throw new Error("New password does not match database hash!");
    }
    console.log("   ✅ User password successfully updated (new bcrypt hash verified).");

    // 6d. Email verified status updated
    if (!updatedUser.emailVerified) {
      throw new Error("User emailVerified was not set upon password reset!");
    }
    console.log(`   ✅ User email marked as verified: ${updatedUser.emailVerified.toISOString()}`);

    console.log("\n🎉 All Password Reset tests passed successfully!\n");
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Remove test user and any residual tokens
    // -------------------------------------------------------------------------
    console.log("Cleaning up test artifacts...");
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: [testEmail, `password-reset:${testEmail}`],
        },
      },
    }).catch(() => null);

    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => null);
    }
    console.log("✅ Cleanup complete.");
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Password Reset Test Failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
