import "dotenv/config";
import {
  getDashboardCollections,
  getCollectionStats,
  getCollectionById,
  getCollectionItems,
  getDefaultUserId,
} from "../src/lib/db/collections";

async function runTests() {
  console.log("=== Testing Collections & Detail Pages Database Queries ===\n");
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
    if (!demoUserId) {
      console.error("Demo user ID could not be resolved.");
      process.exit(1);
    }

    // 1. Test getDashboardCollections
    console.log("\n1. Testing getDashboardCollections...");
    const collections = await getDashboardCollections(demoUserId, 100);
    assert(Array.isArray(collections), "Collections returned as array");
    assert(collections.length > 0, `Found ${collections.length} collections for demo user`);

    const firstCol = collections[0];
    assert(Boolean(firstCol.id), "First collection has an id");
    assert(Boolean(firstCol.name), `First collection name is "${firstCol.name}"`);
    assert(typeof firstCol.itemCount === "number", `Item count is number (${firstCol.itemCount})`);
    assert(Boolean(firstCol.accentColor), `Accent color is derived: ${firstCol.accentColor}`);
    assert(Array.isArray(firstCol.types), "Collection has types breakdown array");

    // 2. Test getCollectionStats
    console.log("\n2. Testing getCollectionStats...");
    const stats = await getCollectionStats(demoUserId);
    assert(typeof stats.totalCollections === "number", `Total collections: ${stats.totalCollections}`);
    assert(typeof stats.favoriteCollections === "number", `Favorite collections: ${stats.favoriteCollections}`);

    // 3. Test getCollectionById
    console.log("\n3. Testing getCollectionById...");
    const colByIdWithUser = await getCollectionById(firstCol.id, demoUserId);
    assert(colByIdWithUser !== null, `Found collection by ID with explicit userId`);
    assert(colByIdWithUser?.id === firstCol.id, `ID matches: ${colByIdWithUser?.id}`);
    assert(colByIdWithUser?.name === firstCol.name, `Name matches: ${colByIdWithUser?.name}`);

    // Fallback to demo user
    const colByIdFallback = await getCollectionById(firstCol.id);
    assert(colByIdFallback !== null, `Found collection by ID with default demo user fallback`);
    assert(colByIdFallback?.id === firstCol.id, `ID matches under fallback`);

    // Non-existent collection
    const missingCol = await getCollectionById("cuid-non-existent-collection-id-999");
    assert(missingCol === null, "Returns null for non-existent collection ID");

    // 4. Test getCollectionItems
    console.log("\n4. Testing getCollectionItems...");
    const items = await getCollectionItems(firstCol.id, demoUserId);
    assert(Array.isArray(items), "Collection items returned as array");
    assert(items.length === firstCol.itemCount, `Items length (${items.length}) matches collection itemCount (${firstCol.itemCount})`);

    if (items.length > 0) {
      const firstItem = items[0];
      assert(Boolean(firstItem.id), "Collection item has id");
      assert(Boolean(firstItem.title), `Item title: "${firstItem.title}"`);
      assert(Boolean(firstItem.type), `Item type: "${firstItem.type}"`);
      assert(Boolean(firstItem.typeIcon), `Item typeIcon: "${firstItem.typeIcon}"`);
      assert(Boolean(firstItem.typeColor), `Item typeColor: "${firstItem.typeColor}"`);
      assert(Array.isArray(firstItem.tags), "Item tags is an array");
      assert(Boolean(firstItem.date), `Item formatted date: "${firstItem.date}"`);
      assert(firstItem.createdAt instanceof Date, "Item createdAt is a Date instance");
    }

    // Fallback to demo user for items
    const itemsFallback = await getCollectionItems(firstCol.id);
    assert(itemsFallback.length === items.length, "getCollectionItems resolves demo user when userId is omitted");

    // Non-existent collection items
    const missingItems = await getCollectionItems("cuid-non-existent-collection-id-999");
    assert(Array.isArray(missingItems) && missingItems.length === 0, "Returns empty array for non-existent collection ID");

    console.log(`\n========================================`);
    console.log(`All assertions complete: ${passed}/${total} passed`);
    console.log(`========================================`);

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with exception:", error);
    process.exit(1);
  }
}

runTests();
