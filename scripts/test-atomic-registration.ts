import "dotenv/config";
import { Redis } from "@upstash/redis";
import { prisma } from "../src/lib/prisma";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { generateVerificationToken } from "../src/lib/tokens";

async function clearRateLimitKeys() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const keys = await redis.keys("ratelimit:auth:*127.0.0.1*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Ignore cleanup error
    }
  }
}

async function runTests() {
  console.log("=== Testing Atomic Registration & Token Creation [LOW-1] ===\n");
  await clearRateLimitKeys();

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
  const testEmail = `atomic_test_${timestamp}@devstash.io`;
  const rollbackEmail = `atomic_rollback_${timestamp}@devstash.io`;

  try {
    // Test 1: Atomic Rollback Behavior Verification
    console.log("1. Testing transaction rollback when token generation / transaction fails...");
    let rollbackThrew = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: "Rollback Test User",
            email: rollbackEmail,
            password: "hashedPassword123",
          },
        });
        // Intentionally simulate a failure after user creation
        throw new Error("Simulated token generation failure inside transaction");
      });
    } catch {
      rollbackThrew = true;
    }

    assert(rollbackThrew, "Transaction threw error upon simulated failure");
    const checkRollbackUser = await prisma.user.findUnique({
      where: { email: rollbackEmail },
    });
    assert(
      checkRollbackUser === null,
      "User creation rolled back cleanly: user does NOT exist in database"
    );

    // Test 2: generateVerificationToken with transaction client
    console.log("\n2. Testing generateVerificationToken with explicit tx parameter...");
    const txUserEmail = `atomic_tx_${timestamp}@devstash.io`;
    const txResult = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: "Tx User",
          email: txUserEmail,
          password: "hashedPassword123",
        },
      });
      const t = await generateVerificationToken(txUserEmail, tx);
      return { u, t };
    });

    const txUserRecord = await prisma.user.findUnique({
      where: { email: txUserEmail },
    });
    const txTokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: txUserEmail },
    });
    assert(
      txUserRecord !== null && txTokenRecord !== null && txTokenRecord.token === txResult.t.token,
      "generateVerificationToken succeeded inside transaction client"
    );

    // Clean up tx test user
    await prisma.verificationToken.deleteMany({ where: { identifier: txUserEmail } });
    await prisma.user.delete({ where: { email: txUserEmail } });

    // Test 3: Full API route POST /api/auth/register
    console.log("\n3. Testing full POST /api/auth/register handler with atomic transaction...");
    const regReq = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        name: "Atomic Register User",
        email: testEmail,
        password: "securePassword123!",
        confirmPassword: "securePassword123!",
      }),
    });

    const regRes = await registerHandler(regReq);
    const regData = await regRes.json();

    assert(regRes.status === 201, `Register returned HTTP 201 (got ${regRes.status})`);
    assert(regData.requiresVerification === true, "Response includes requiresVerification: true");

    // Verify DB state
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(createdUser !== null, "User was successfully created in database");
    assert(createdUser?.emailVerified === null, "User emailVerified is null as expected");

    const createdToken = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    });
    assert(createdToken !== null, "Verification token was created in verification_tokens table");

  } finally {
    // Cleanup
    await prisma.verificationToken.deleteMany({
      where: { identifier: testEmail },
    }).catch(() => null);
    await prisma.user.deleteMany({
      where: { email: testEmail },
    }).catch(() => null);
    await prisma.user.deleteMany({
      where: { email: rollbackEmail },
    }).catch(() => null);
    await clearRateLimitKeys();
  }

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
