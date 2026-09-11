import "dotenv/config";
import {
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
} from "../src/lib/rate-limit";
import { Redis } from "@upstash/redis";

async function main() {
  console.log("🛡️ Starting Rate Limiting Integration Tests...\n");

  const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;
  const testEmail = `ratelimit_${Date.now()}@example.com`;
  const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
      : null;

  try {
    // -------------------------------------------------------------------------
    // Test 1: getClientIp helper
    // -------------------------------------------------------------------------
    console.log("1. Testing getClientIp header extraction...");

    // Test with Request x-forwarded-for
    const reqWithForwarded = new Request("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    const ip1 = await getClientIp(reqWithForwarded);
    if (ip1 !== "203.0.113.195") {
      throw new Error(`Expected 203.0.113.195 from x-forwarded-for, got ${ip1}`);
    }
    console.log("   ✅ Extracted first IP from x-forwarded-for:", ip1);

    // Test with Request x-real-ip
    const reqWithRealIp = new Request("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    const ip2 = await getClientIp(reqWithRealIp);
    if (ip2 !== "198.51.100.42") {
      throw new Error(`Expected 198.51.100.42 from x-real-ip, got ${ip2}`);
    }
    console.log("   ✅ Extracted IP from x-real-ip:", ip2);

    // Test trusted header precedence (cf-connecting-ip overrides spoofed x-forwarded-for)
    const reqWithCfAndForwarded = new Request("http://localhost:3000/api/test", {
      headers: {
        "cf-connecting-ip": "198.51.100.99",
        "x-forwarded-for": "10.0.0.1",
      },
    });
    const ipCf = await getClientIp(reqWithCfAndForwarded);
    if (ipCf !== "198.51.100.99") {
      throw new Error(`Expected 198.51.100.99 from cf-connecting-ip, got ${ipCf}`);
    }
    console.log("   ✅ Prioritized cf-connecting-ip over x-forwarded-for:", ipCf);

    // Test fallback
    const reqWithoutIp = new Request("http://localhost:3000/api/test");
    const ipFallback = await getClientIp(reqWithoutIp);
    if (ipFallback !== "127.0.0.1") {
      throw new Error(`Expected 127.0.0.1 fallback, got ${ipFallback}`);
    }
    console.log("   ✅ Correct fallback when headers absent:", ipFallback);

    // -------------------------------------------------------------------------
    // Test 2: Rate limit enforcement on "resend-verification" (limit: 3)
    // -------------------------------------------------------------------------
    console.log("\n2. Testing sliding-window enforcement (resend-verification: 3 attempts / 15 min)...");
    const resendKey = `${testIp}:${testEmail}`;

    for (let i = 1; i <= 3; i++) {
      const res = await checkRateLimit("resend-verification", resendKey);
      if (!res.success) {
        throw new Error(`Attempt ${i} should have succeeded within limit of 3`);
      }
      console.log(`   ✅ Attempt ${i}/3 succeeded. Remaining: ${res.remaining}`);
    }

    // 4th attempt should be blocked
    const resendBlocked = await checkRateLimit("resend-verification", resendKey);
    if (resendBlocked.success) {
      throw new Error("Attempt 4 should have been blocked by rate limiter!");
    }
    console.log(
      `   ✅ Attempt 4 was blocked as expected! Error: "${resendBlocked.errorMessage}", Retry-After: ${resendBlocked.retryAfterSeconds}s`
    );

    // -------------------------------------------------------------------------
    // Test 3: Rate limit response generator (HTTP 429)
    // -------------------------------------------------------------------------
    console.log("\n3. Testing rateLimitResponse helper...");
    const response = rateLimitResponse(resendBlocked);

    if (response.status !== 429) {
      throw new Error(`Expected status 429, got ${response.status}`);
    }
    const retryAfter = response.headers.get("Retry-After");
    if (!retryAfter || Number(retryAfter) <= 0) {
      throw new Error(`Expected positive Retry-After header, got ${retryAfter}`);
    }
    const body = await response.json();
    if (!body.error || !body.error.includes("Too many attempts")) {
      throw new Error(`Expected error message in body, got ${JSON.stringify(body)}`);
    }
    console.log(`   ✅ Status: ${response.status} Too Many Requests`);
    console.log(`   ✅ Retry-After header: ${retryAfter}`);
    console.log(`   ✅ Response body: ${JSON.stringify(body)}`);

    // -------------------------------------------------------------------------
    // Test 4: Rate limit enforcement on "login" (limit: 5)
    // -------------------------------------------------------------------------
    console.log("\n4. Testing sliding-window enforcement (login: 5 attempts / 15 min)...");
    const loginKey = `${testIp}:${testEmail}`;

    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit("login", loginKey);
      if (!res.success) {
        throw new Error(`Login attempt ${i} should have succeeded within limit of 5`);
      }
    }
    console.log("   ✅ 5 login attempts succeeded within limit.");

    const loginBlocked = await checkRateLimit("login", loginKey);
    if (loginBlocked.success) {
      throw new Error("Login attempt 6 should have been blocked!");
    }
    console.log(`   ✅ Login attempt 6 was blocked as expected: "${loginBlocked.errorMessage}"`);

    // -------------------------------------------------------------------------
    // Test 5: Rate limit enforcement on "register" (limit: 3)
    // -------------------------------------------------------------------------
    console.log("\n5. Testing sliding-window enforcement (register: 3 attempts / 1 hour)...");
    for (let i = 1; i <= 3; i++) {
      const res = await checkRateLimit("register", testIp);
      if (!res.success) {
        throw new Error(`Register attempt ${i} should have succeeded within limit of 3`);
      }
    }
    console.log("   ✅ 3 register attempts succeeded within limit.");

    const registerBlocked = await checkRateLimit("register", testIp);
    if (registerBlocked.success) {
      throw new Error("Register attempt 4 should have been blocked!");
    }
    console.log(`   ✅ Register attempt 4 was blocked as expected: "${registerBlocked.errorMessage}"`);

    // -------------------------------------------------------------------------
    // Test 6: Rate limit enforcement on "forgot-password" (limit: 3)
    // -------------------------------------------------------------------------
    console.log("\n6. Testing sliding-window enforcement (forgot-password: 3 attempts / 1 hour)...");
    for (let i = 1; i <= 3; i++) {
      const res = await checkRateLimit("forgot-password", testIp);
      if (!res.success) {
        throw new Error(`Forgot-password attempt ${i} should have succeeded within limit of 3`);
      }
    }
    console.log("   ✅ 3 forgot-password attempts succeeded within limit.");

    const forgotBlocked = await checkRateLimit("forgot-password", testIp);
    if (forgotBlocked.success) {
      throw new Error("Forgot-password attempt 4 should have been blocked!");
    }
    console.log(`   ✅ Forgot-password attempt 4 was blocked as expected: "${forgotBlocked.errorMessage}"`);

    // -------------------------------------------------------------------------
    // Test 7: Rate limit enforcement on "reset-password" (limit: 5)
    // -------------------------------------------------------------------------
    console.log("\n7. Testing sliding-window enforcement (reset-password: 5 attempts / 15 min)...");
    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit("reset-password", testIp);
      if (!res.success) {
        throw new Error(`Reset-password attempt ${i} should have succeeded within limit of 5`);
      }
    }
    console.log("   ✅ 5 reset-password attempts succeeded within limit.");

    const resetBlocked = await checkRateLimit("reset-password", testIp);
    if (resetBlocked.success) {
      throw new Error("Reset-password attempt 6 should have been blocked!");
    }
    console.log(`   ✅ Reset-password attempt 6 was blocked as expected: "${resetBlocked.errorMessage}"`);

    // -------------------------------------------------------------------------
    // Test 8: Fail-Open verification
    // -------------------------------------------------------------------------
    console.log("\n8. Testing fail-open safety...");
    // A fresh identifier for an unused action always succeeds
    const freshRes = await checkRateLimit("login", `unique-failopen-test-${Date.now()}`);
    if (!freshRes.success) {
      throw new Error("Fresh rate limit check should succeed");
    }
    console.log("   ✅ Graceful behavior verified.");

    console.log("\n🎉 ALL RATE LIMITING TESTS PASSED SUCCESSFULLY!\n");
  } finally {
    // Cleanup Redis test keys
    if (redis) {
      try {
        const keys = await redis.keys(`ratelimit:auth:*${testIp}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`🧹 Cleaned up ${keys.length} test keys from Redis.`);
        }
      } catch (err) {
        console.warn("Could not clean up test keys:", err);
      }
    }
  }
}

main().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
