import "dotenv/config";
import { getItemById, getRecentItems } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { GET } from "../src/app/api/items/[id]/route";

async function runTests() {
  console.log("=== Testing Item Drawer Database Queries & API Route ===\n");
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

    // 1. Fetch a recent item to get a valid ID
    console.log("\n1. Fetching a recent item for testing...");
    const recentItems = await getRecentItems(demoUserId ?? undefined, 1);
    assert(recentItems.length > 0, "Found at least one recent item in database");

    const testItem = recentItems[0];
    console.log(`Testing with item ID: ${testItem.id} (${testItem.title})`);

    // 2. Test getItemById query
    console.log("\n2. Testing getItemById query...");
    const itemDetail = await getItemById(testItem.id, demoUserId ?? undefined);
    assert(itemDetail !== null, "getItemById returned non-null item");
    assert(itemDetail?.id === testItem.id, "Returned item has matching ID");
    assert(Boolean(itemDetail?.title), `Item has title: "${itemDetail?.title}"`);
    assert(Boolean(itemDetail?.type), `Item has type: "${itemDetail?.type}"`);
    assert(Boolean(itemDetail?.typeDisplayName), `Item has typeDisplayName: "${itemDetail?.typeDisplayName}"`);
    assert(Boolean(itemDetail?.typeIcon), `Item has typeIcon: "${itemDetail?.typeIcon}"`);
    assert(Boolean(itemDetail?.typeColor), `Item has typeColor: "${itemDetail?.typeColor}"`);
    assert(Array.isArray(itemDetail?.tags), "Item tags is an array");
    assert(Array.isArray(itemDetail?.collections), "Item collections is an array");
    assert(Boolean(itemDetail?.formattedCreatedAt), `Item has formattedCreatedAt: "${itemDetail?.formattedCreatedAt}"`);
    assert(Boolean(itemDetail?.formattedUpdatedAt), `Item has formattedUpdatedAt: "${itemDetail?.formattedUpdatedAt}"`);

    // 3. Test getItemById with non-existent ID
    console.log("\n3. Testing getItemById with non-existent ID...");
    const nonExistent = await getItemById("non-existent-cuid-999", demoUserId ?? undefined);
    assert(nonExistent === null, "Non-existent item ID returns null");

    // 4. Test API Route GET /api/items/[id]
    console.log("\n4. Testing GET /api/items/[id] route handler...");
    const req = new Request(`http://localhost:3000/api/items/${testItem.id}`);
    const res = await GET(req, {
      params: Promise.resolve({ id: testItem.id }),
    });
    assert(res.status === 200, `API route returned HTTP 200 (got ${res.status})`);

    const json = await res.json();
    assert(Boolean(json.item), "API response contains item object");
    assert(json.item.id === testItem.id, "API item ID matches requested ID");
    assert(json.item.title === testItem.title, "API item title matches");

    // 5. Test API Route with non-existent ID (should return 404)
    console.log("\n5. Testing API Route with non-existent ID (404)...");
    const req404 = new Request("http://localhost:3000/api/items/non-existent-999");
    const res404 = await GET(req404, {
      params: Promise.resolve({ id: "non-existent-999" }),
    });
    assert(res404.status === 404, `Non-existent item returned HTTP 404 (got ${res404.status})`);

    // 6. Test API Route with empty ID (should return 400)
    console.log("\n6. Testing API Route with empty ID (400)...");
    const req400 = new Request("http://localhost:3000/api/items/");
    const res400 = await GET(req400, {
      params: Promise.resolve({ id: "   " }),
    });
    assert(res400.status === 400, `Empty item ID returned HTTP 400 (got ${res400.status})`);

    console.log(`\n================================`);
    console.log(`Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`================================\n`);

    if (passed !== total) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
