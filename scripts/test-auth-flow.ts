import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting Auth Flow & Email Verification tests...\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Providers endpoint
  console.log("1. Checking /api/auth/providers...");
  const providersRes = await fetch(`${baseUrl}/api/auth/providers`);
  const providers = await providersRes.json();
  console.log("   Configured providers:", Object.keys(providers));
  if (!providers.github || !providers.credentials) {
    throw new Error("Missing expected providers (github or credentials)");
  }
  console.log("   ✅ Both github and credentials providers are active.");

  // Test 2: Unauthenticated access to /dashboard should redirect
  console.log("\n2. Testing unauthenticated access to /dashboard...");
  const unauthRes = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  console.log(`   Response status: ${unauthRes.status}`);
  const location = unauthRes.headers.get("location");
  console.log(`   Redirect location: ${location}`);
  if (unauthRes.status !== 307 && unauthRes.status !== 302 && unauthRes.status !== 308) {
    throw new Error(`Expected redirect status (307/302), got: ${unauthRes.status}`);
  }
  if (!location?.includes("/sign-in") && !location?.includes("/api/auth/signin")) {
    throw new Error(`Expected redirect to /sign-in, got: ${location}`);
  }
  console.log("   ✅ Protected route correctly redirects unauthenticated user.");

  // Test 3: Registration endpoint validation & token generation
  console.log("\n3. Testing Registration validation & email token creation...");
  const testEmail = `verify_${Date.now()}@devstash.io`;
  const testPassword = "testPassword123!";

  // 3a. Passwords mismatch
  const mismatchRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Verification Test User",
      email: testEmail,
      password: testPassword,
      confirmPassword: "differentPassword",
    }),
  });
  if (mismatchRes.status !== 400) {
    throw new Error(`Expected 400 for password mismatch, got: ${mismatchRes.status}`);
  }
  console.log("   ✅ Password mismatch properly rejected with 400.");

  // 3b. Register valid user
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Verification Test User",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  if (regRes.status !== 201) {
    const err = await regRes.text();
    throw new Error(`Expected 201 for registration, got ${regRes.status}: ${err}`);
  }
  const regData = await regRes.json();
  console.log("   Registered user:", regData.user);
  if (!regData.user?.id || regData.user.email !== testEmail) {
    throw new Error("Registration response missing user id or email");
  }
  if (!regData.requiresVerification) {
    throw new Error("Registration response should indicate requiresVerification: true");
  }
  console.log("   ✅ Valid registration succeeded with 201 and requiresVerification.");

  // Verify token exists in database and user is not verified
  const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (dbUser?.emailVerified !== null) {
    throw new Error("Newly registered user should have null emailVerified");
  }
  const initialToken = await prisma.verificationToken.findFirst({
    where: { identifier: testEmail },
  });
  if (!initialToken || !initialToken.token) {
    throw new Error("Verification token was not created in the database");
  }
  console.log("   ✅ Verification token stored in database:", initialToken.token);

  // 3c. Duplicate registration
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Verification Test User",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 for duplicate registration, got: ${dupRes.status}`);
  }
  console.log("   ✅ Duplicate registration properly rejected with 409.");

  // Test 4: Sign-in rejection for unverified user
  console.log("\n4. Testing credentials sign-in for UNVERIFIED user...");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie();
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  const unverifiedSignInRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: testEmail,
      password: testPassword,
      callbackUrl: `${baseUrl}/dashboard`,
      redirect: "false",
    }),
    redirect: "manual",
  });
  const unverifiedLocation = unverifiedSignInRes.headers.get("location");
  console.log("   Unverified sign-in location:", unverifiedLocation);
  if (!unverifiedLocation?.includes("error=CredentialsSignin") || !unverifiedLocation?.includes("code=email_not_verified")) {
    throw new Error(`Expected redirect with error=CredentialsSignin&code=email_not_verified, got: ${unverifiedLocation}`);
  }
  console.log("   ✅ Unverified user sign-in correctly rejected with email_not_verified code.");

  // Test 5: Resend verification email
  console.log("\n5. Testing /api/auth/resend-verification endpoint...");
  const resendRes = await fetch(`${baseUrl}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  if (resendRes.status !== 200) {
    const err = await resendRes.text();
    throw new Error(`Expected 200 for resend verification, got ${resendRes.status}: ${err}`);
  }
  const resendData = await resendRes.json();
  console.log("   Resend response:", resendData.message);

  const updatedToken = await prisma.verificationToken.findFirst({
    where: { identifier: testEmail },
  });
  if (!updatedToken) {
    throw new Error("Expected renewed verification token in database");
  }
  console.log("   ✅ Resend verification generated renewed token:", updatedToken.token);

  // Test 6: Invalid token verification
  console.log("\n6. Testing invalid token verification...");
  const invalidVerifyRes = await fetch(`${baseUrl}/api/auth/verify-email?token=invalid-token-12345`);
  if (invalidVerifyRes.status !== 400) {
    throw new Error(`Expected 400 for invalid token, got: ${invalidVerifyRes.status}`);
  }
  console.log("   ✅ Invalid verification token rejected with 400.");

  // Test 7: Valid token verification
  console.log("\n7. Testing valid token verification...");
  const validVerifyRes = await fetch(`${baseUrl}/api/auth/verify-email?token=${updatedToken.token}`);
  if (validVerifyRes.status !== 200) {
    const err = await validVerifyRes.text();
    throw new Error(`Expected 200 for valid token verification, got ${validVerifyRes.status}: ${err}`);
  }
  const verifyData = await validVerifyRes.json();
  console.log("   Verification response:", verifyData.message);

  // Check database user is verified
  const verifiedUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!verifiedUser?.emailVerified) {
    throw new Error("User emailVerified was not set in the database");
  }
  const consumedToken = await prisma.verificationToken.findUnique({
    where: { token: updatedToken.token },
  });
  if (consumedToken) {
    throw new Error("Verification token was not deleted after consumption");
  }
  console.log("   ✅ User marked emailVerified in database, token cleanly consumed.");

  // Test 8: Successful sign-in for VERIFIED user
  console.log("\n8. Testing credentials sign-in for VERIFIED user...");
  const successSignInRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: testEmail,
      password: testPassword,
      callbackUrl: `${baseUrl}/dashboard`,
      redirect: "false",
    }),
    redirect: "manual",
  });

  const sessionCookies = successSignInRes.headers.getSetCookie();
  console.log(`   Success sign-in response status: ${successSignInRes.status}`);
  const hasSessionToken = sessionCookies.some(
    (c) => c.includes("authjs.session-token") || c.includes("next-auth.session-token")
  );

  if (!hasSessionToken) {
    throw new Error("No session token cookie received on successful credentials sign-in");
  }
  console.log("   ✅ Successfully authenticated verified user and received session token cookie.");

  // Test 9: Access protected route with session cookie
  console.log("\n9. Testing access to /dashboard with authenticated session token...");
  const authDashRes = await fetch(`${baseUrl}/dashboard`, {
    headers: {
      Cookie: sessionCookies.join("; "),
    },
    redirect: "manual",
  });
  console.log(`   Dashboard response status: ${authDashRes.status}`);
  if (authDashRes.status !== 200) {
    throw new Error(`Expected 200 OK for authenticated access to /dashboard, got: ${authDashRes.status}`);
  }
  console.log("   ✅ Authenticated user successfully accessed protected /dashboard route.");

  // Cleanup test user
  console.log("\n10. Cleaning up test user...");
  await prisma.user.delete({ where: { email: testEmail } });
  console.log("   Cleaned up test user record from database.");

  console.log("\n🎉 All Auth & Email Verification integration tests PASSED!\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Verification test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
