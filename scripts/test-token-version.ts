import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { jwtCallback } from "../src/auth";
import { generatePasswordResetToken, consumePasswordResetToken } from "../src/lib/tokens";

async function runTests() {
  console.log("=== Testing Session Invalidation & tokenVersion [HIGH-1] ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
    }
  }

  const timestamp = Date.now();
  const testEmail = `token_version_${timestamp}@devstash.io`;
  const initialPassword = "initialPassword123!";
  const resetPassword = "resetPassword456!";
  let testUserId = "";

  try {
    // 1. Create a test user
    console.log("1. Creating test user in database...");
    const hashedPassword = await bcrypt.hash(initialPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: "Token Version Tester",
        email: testEmail,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;

    assert(user.tokenVersion === 0, `User initialized with tokenVersion === 0 (got: ${user.tokenVersion})`);

    // 2. Simulate user login and JWT issuance
    console.log("\n2. Testing JWT callback on initial sign-in...");
    const initialToken: { id?: string; tokenVersion?: number } = {};
    const issuedToken = await jwtCallback({
      token: initialToken,
      user: { id: user.id, tokenVersion: user.tokenVersion },
    });

    assert(
      issuedToken !== null && issuedToken.tokenVersion === 0,
      `Issued JWT contains tokenVersion === 0 (got: ${issuedToken?.tokenVersion})`
    );

    // Verify subsequent request with matching tokenVersion succeeds
    const validSession = await jwtCallback({ token: { id: user.id, tokenVersion: 0 } });
    assert(validSession !== null, "Session is valid when tokenVersion matches database");

    // 3. Password reset consumption increments tokenVersion
    console.log("\n3. Testing password reset token consumption increments tokenVersion...");
    const resetTokenRecord = await generatePasswordResetToken(testEmail);
    const newResetHash = await bcrypt.hash(resetPassword, 12);
    const consumeRes = await consumePasswordResetToken(resetTokenRecord.token, newResetHash);
    assert(consumeRes.success === true, "Password reset token consumed successfully");

    const userAfterReset = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { tokenVersion: true },
    });
    assert(
      userAfterReset?.tokenVersion === 1,
      `User tokenVersion incremented to 1 after password reset (got: ${userAfterReset?.tokenVersion})`
    );

    // Old JWT with tokenVersion: 0 MUST be invalidated
    const oldSessionAfterReset = await jwtCallback({ token: { id: testUserId, tokenVersion: 0 } });
    assert(
      oldSessionAfterReset === null,
      "Old session (tokenVersion: 0) is INVALIDATED (returns null) after password reset"
    );

    // New JWT with tokenVersion: 1 is valid
    const newSessionAfterReset = await jwtCallback({ token: { id: testUserId, tokenVersion: 1 } });
    assert(
      newSessionAfterReset !== null && newSessionAfterReset.tokenVersion === 1,
      "New session (tokenVersion: 1) is VALID after password reset"
    );

    // 4. Password change increments tokenVersion
    console.log("\n4. Testing password change increments tokenVersion...");
    const changedPasswordHash = await bcrypt.hash("changedPassword789!", 12);
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        password: changedPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });

    const userAfterChange = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { tokenVersion: true },
    });
    assert(
      userAfterChange?.tokenVersion === 2,
      `User tokenVersion incremented to 2 after password change (got: ${userAfterChange?.tokenVersion})`
    );

    // Previous JWT with tokenVersion: 1 MUST be invalidated
    const prevSessionAfterChange = await jwtCallback({ token: { id: testUserId, tokenVersion: 1 } });
    assert(
      prevSessionAfterChange === null,
      "Previous session (tokenVersion: 1) is INVALIDATED after password change"
    );

    // New JWT with tokenVersion: 2 is valid
    const newSessionAfterChange = await jwtCallback({ token: { id: testUserId, tokenVersion: 2 } });
    assert(
      newSessionAfterChange !== null && newSessionAfterChange.tokenVersion === 2,
      "New session (tokenVersion: 2) is VALID after password change"
    );

    // 5. Deleted user invalidation
    console.log("\n5. Testing deleted user session invalidation...");
    await prisma.user.delete({ where: { id: testUserId } });
    const sessionAfterDelete = await jwtCallback({ token: { id: testUserId, tokenVersion: 2 } });
    assert(
      sessionAfterDelete === null,
      "Session for deleted user is INVALIDATED (returns null)"
    );

  } finally {
    // Cleanup
    if (testUserId) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: `password-reset:${testEmail}` },
      }).catch(() => null);
      await prisma.user.deleteMany({
        where: { id: testUserId },
      }).catch(() => null);
    }
  }

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
