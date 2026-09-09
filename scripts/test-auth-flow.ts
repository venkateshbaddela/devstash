import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting Auth Phase 2 verification tests...\n");

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
  if (!location?.includes("/api/auth/signin")) {
    throw new Error(`Expected redirect to /api/auth/signin, got: ${location}`);
  }
  console.log("   ✅ Protected route correctly redirects unauthenticated user.");

  // Test 3: Registration endpoint validation
  console.log("\n3. Testing Registration validation...");
  const testEmail = `phase2_${Date.now()}@devstash.io`;
  const testPassword = "testPassword123!";

  // 3a. Passwords mismatch
  const mismatchRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Phase 2 User",
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
      name: "Phase 2 User",
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
  console.log("   ✅ Valid registration succeeded with 201.");

  // 3c. Duplicate registration
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Phase 2 User",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 for duplicate registration, got: ${dupRes.status}`);
  }
  console.log("   ✅ Duplicate registration properly rejected with 409.");

  // Test 4: Sign in with credentials callback
  console.log("\n4. Testing credentials sign-in...");
  
  // Get CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie();
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  console.log("   Acquired CSRF token:", csrfToken ? "✓" : "✗");

  // 4a. Wrong password
  const failSignInRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: testEmail,
      password: "wrongPassword!",
      callbackUrl: `${baseUrl}/dashboard`,
      redirect: "false",
    }),
    redirect: "manual",
  });
  console.log(`   Failed sign-in response status: ${failSignInRes.status}`);
  const failLocation = failSignInRes.headers.get("location");
  if (failLocation && failLocation.includes("error=CredentialsSignin")) {
    console.log("   ✅ Invalid credentials rejected with error redirect.");
  }

  // 4b. Successful sign-in
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
  console.log("   Session cookies received:", sessionCookies.map((c) => c.split(";")[0]));

  const hasSessionToken = sessionCookies.some(
    (c) => c.includes("authjs.session-token") || c.includes("next-auth.session-token")
  );

  if (!hasSessionToken) {
    throw new Error("No session token cookie received on successful credentials sign-in");
  }
  console.log("   ✅ Successfully authenticated and received session token cookie.");

  // Test 5: Access protected route with session cookie
  console.log("\n5. Testing access to /dashboard with authenticated session token...");
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
  console.log("\n6. Cleaning up test user...");
  await prisma.user.delete({ where: { email: testEmail } });
  console.log("   Cleaned up test user record from database.");

  console.log("\n🎉 All Auth Credentials verification tests PASSED!\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Verification test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
