import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { executePasswordReset } from "../src/lib/auth-core";

async function runTests() {
  console.log("=== Testing Password Length Constraint (Max 72 characters) ===\n");
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

  // Test 1: Register API with 73-character password
  const longPass = "A".repeat(73);
  const regReq = new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test-longpass@example.com",
      password: longPass,
      confirmPassword: longPass,
    }),
  });

  const regRes = await registerHandler(regReq);
  const regData = await regRes.json();
  assert(
    regRes.status === 400 && regData.error === "Password cannot exceed 72 characters",
    `Register route rejects 73-character password with 400 (got ${regRes.status}: ${regData.error})`
  );

  // Test 2: executePasswordReset with 73-character password
  const resetResult = await executePasswordReset("dummy-token", longPass, longPass);
  assert(
    resetResult.success === false && resetResult.error === "Password cannot exceed 72 characters.",
    `executePasswordReset rejects 73-character password (got: ${resetResult.error})`
  );

  // Test 3: Register API with valid 72-character password format check (not rejected by length check)
  const valid72Pass = "A".repeat(71) + "!";
  const regReq72 = new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test-longpass@example.com",
      password: valid72Pass,
      confirmPassword: valid72Pass + "mismatch",
    }),
  });
  const regRes72 = await registerHandler(regReq72);
  const regData72 = await regRes72.json();
  assert(
    regData72.error === "Passwords do not match",
    `Register route accepts 72-character password (failed at match check, not length check: ${regData72.error})`
  );

  // Test 4: executePasswordReset accepts 72-character password (reaches token lookup instead of length check)
  const reset72Result = await executePasswordReset("dummy-token", valid72Pass, valid72Pass);
  assert(
    reset72Result.error !== "Password cannot exceed 72 characters.",
    `executePasswordReset accepts 72-character password (proceeds to token check: ${reset72Result.error})`
  );

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
