import { prisma } from "../src/lib/prisma";

async function testGitHubOAuth() {
  console.log("==================================================");
  console.log("🧪 Testing GitHub OAuth Configuration & State");
  console.log("==================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Check provider availability
  console.log("1. Checking Auth.js providers...");
  const providersRes = await fetch(`${baseUrl}/api/auth/providers`);
  const providers = await providersRes.json();
  console.log("   Configured providers:", Object.keys(providers));
  if (!providers.github) {
    throw new Error("GitHub provider is NOT enabled!");
  }
  console.log("   ✅ GitHub provider is registered and active.");

  // 2. Fetch CSRF token
  console.log("\n2. Getting CSRF token...");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie();
  const csrfData = await csrfRes.json();
  console.log("   CSRF Token:", csrfData.csrfToken ? "Acquired ✓" : "Missing ✗");

  // 3. Test initiating GitHub Sign-in (clean, unauthenticated session)
  console.log("\n3. Testing GitHub sign-in initiation (clean session)...");
  const signinRes = await fetch(`${baseUrl}/api/auth/signin/github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${baseUrl}/dashboard`,
    }),
    redirect: "manual",
  });

  console.log(`   Response status: ${signinRes.status}`);
  const location = signinRes.headers.get("location");
  console.log(`   Redirect URL: ${location?.split("?")[0]}`);

  if (signinRes.status !== 302 || !location?.startsWith("https://github.com/login/oauth/authorize")) {
    throw new Error(`Expected 302 redirect to GitHub OAuth, got ${signinRes.status} -> ${location}`);
  }

  const url = new URL(location);
  console.log("   Client ID present:", !!url.searchParams.get("client_id"));
  console.log("   Redirect URI:", url.searchParams.get("redirect_uri"));
  console.log("   Scope:", url.searchParams.get("scope"));
  console.log("   PKCE Code Challenge present:", !!url.searchParams.get("code_challenge"));
  console.log("   ✅ GitHub OAuth handshake initiates correctly.");

  // 4. Inspect GitHub account in database
  console.log("\n4. Checking GitHub Accounts linked in database...");
  const githubAccounts = await prisma.account.findMany({
    where: { provider: "github" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });

  console.log(`   Found ${githubAccounts.length} linked GitHub account(s):`);
  for (const acc of githubAccounts) {
    console.log(`   - GitHub Provider Account ID: ${acc.providerAccountId}`);
    console.log(`     Linked User: ${acc.user.name} (${acc.user.email}) [ID: ${acc.user.id}]`);
    console.log(`     User Avatar: ${acc.user.image}`);
  }

  console.log("\n==================================================");
  console.log("🎉 GitHub OAuth verification complete!");
  console.log("==================================================");
}

testGitHubOAuth()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
