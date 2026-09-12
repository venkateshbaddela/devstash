import "dotenv/config";
import { getItemById, getRecentItems, updateItem } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { updateItemAction } from "../src/actions/items";

async function runTests() {
  console.log("=== Testing Item Drawer Edit Mode Database Queries & Server Action ===\n");
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

  try {
    const demoUserId = await getDefaultUserId();
    assert(Boolean(demoUserId), "Default demo user ID is resolved");

    // 1. Fetch a snippet item for testing
    console.log("\n1. Fetching a recent item for testing...");
    const recentItems = await getRecentItems(demoUserId ?? undefined, 5);
    assert(recentItems.length > 0, "Found recent items in database");

    const testItem = recentItems[0];
    console.log(`Using test item: ${testItem.id} ("${testItem.title}")`);

    const originalDetail = await getItemById(testItem.id, demoUserId ?? undefined);
    assert(originalDetail !== null, "Fetched original item details");
    if (!originalDetail) throw new Error("Original item not found");

    // 2. Test direct updateItem query function with tag reconciliation
    console.log("\n2. Testing updateItem DB query function...");
    const updatedByQuery = await updateItem(testItem.id, demoUserId ?? undefined, {
      title: `${originalDetail.title} [E2E-TEST]`,
      description: "E2E testing description update",
      tags: ["e2e-test-tag", "devstash-verified"],
    });

    assert(updatedByQuery !== null, "updateItem returned updated ItemDetail");
    assert(
      updatedByQuery?.title === `${originalDetail.title} [E2E-TEST]`,
      `Title updated to "${updatedByQuery?.title}"`
    );
    assert(
      updatedByQuery?.description === "E2E testing description update",
      "Description updated"
    );
    assert(
      updatedByQuery?.tags.includes("e2e-test-tag") === true &&
        updatedByQuery?.tags.includes("devstash-verified") === true,
      `Tags reconciled: [${updatedByQuery?.tags.join(", ")}]`
    );

    // 3. Verify persistence by querying DB freshly
    console.log("\n3. Verifying persistence via getItemById...");
    const freshlyFetched = await getItemById(testItem.id, demoUserId ?? undefined);
    assert(
      freshlyFetched?.title === `${originalDetail.title} [E2E-TEST]`,
      "Database reflects updated title"
    );
    assert(
      freshlyFetched?.tags.includes("e2e-test-tag") === true,
      "Database reflects reconciled tags"
    );

    // 4. Test Server Action with valid payload
    console.log("\n4. Testing updateItemAction Server Action with valid payload...");
    const actionResult = await updateItemAction(testItem.id, {
      title: `${originalDetail.title} [ACTION-TEST]`,
      description: "Updated via Server Action",
      tags: ["action-tag-1", "action-tag-2"],
    });

    assert(actionResult.success === true, "updateItemAction succeeded");
    assert(
      actionResult.data?.title === `${originalDetail.title} [ACTION-TEST]`,
      `Action returned data with new title: "${actionResult.data?.title}"`
    );
    assert(
      actionResult.data?.tags.includes("action-tag-1") === true,
      "Action returned data with updated tags"
    );

    // 5. Test Server Action validation guards
    console.log("\n5. Testing Server Action validation guards...");
    const emptyTitleRes = await updateItemAction(testItem.id, {
      title: "   ",
    });
    assert(emptyTitleRes.success === false, "Action rejected empty title");

    const invalidUrlRes = await updateItemAction(testItem.id, {
      title: "Valid Title",
      url: "ftp://invalid-url",
    });
    assert(invalidUrlRes.success === false, "Action rejected invalid URL protocol");

    const nonExistentRes = await updateItemAction("non-existent-id-999", {
      title: "Valid Title",
    });
    assert(nonExistentRes.success === false, "Action rejected non-existent item");

    // 6. Restore item to original state (idempotent test cleanup)
    console.log("\n6. Restoring original item state (cleanup)...");
    const restored = await updateItem(testItem.id, demoUserId ?? undefined, {
      title: originalDetail.title,
      description: originalDetail.description,
      content: originalDetail.content,
      url: originalDetail.url,
      language: originalDetail.language,
      tags: originalDetail.tags,
    });
    assert(restored?.title === originalDetail.title, "Restored original title");
    assert(
      JSON.stringify(restored?.tags.sort()) ===
        JSON.stringify(originalDetail.tags.sort()),
      "Restored original tags"
    );

    console.log(`\n================================`);
    console.log(`Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`================================\n`);

    if (passed !== total) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
