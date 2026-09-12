import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getItemById, deleteItem } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { deleteItemAction } from "../src/actions/items";

async function runTests() {
  console.log("=== Testing Item Deletion Database Queries & Server Action ===\n");
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
    if (!demoUserId) throw new Error("Demo user not found");

    // 1. Fetch an existing system item type and collection for creating test item
    console.log("\n1. Setting up temporary test item...");
    const snippetType = await prisma.itemType.findFirst({
      where: { name: "snippet" },
    });
    assert(Boolean(snippetType), "Found system item type 'snippet'");
    if (!snippetType) throw new Error("Snippet item type not found");

    const collection = await prisma.collection.findFirst({
      where: { userId: demoUserId },
    });

    // Create tag
    const testTag = await prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUserId,
          name: "temp-delete-tag",
        },
      },
      create: {
        name: "temp-delete-tag",
        userId: demoUserId,
      },
      update: {},
    });

    // Create temporary test item
    const createdItem = await prisma.item.create({
      data: {
        title: "[DELETE-TEST] Temporary Item For Deletion Test",
        description: "This item will be deleted during the test",
        contentType: "TEXT",
        content: "console.log('to be deleted');",
        language: "javascript",
        userId: demoUserId,
        itemTypeId: snippetType.id,
        tags: {
          create: [{ tagId: testTag.id }],
        },
        ...(collection
          ? {
              collections: {
                create: [{ collectionId: collection.id }],
              },
            }
          : {}),
      },
      include: {
        tags: true,
        collections: true,
      },
    });

    assert(Boolean(createdItem.id), `Temporary item created with ID: ${createdItem.id}`);
    assert(createdItem.tags.length > 0, "Item has attached tag");

    // 2. Test ownership protection: deleting with different user ID must fail
    console.log("\n2. Testing ownership protection...");
    const unauthorizedDelete = await deleteItem(createdItem.id, "unauthorized-user-id-9999");
    assert(unauthorizedDelete === false, "deleteItem with unauthorized user returns false");

    const itemStillExists = await getItemById(createdItem.id, demoUserId);
    assert(itemStillExists !== null, "Item still exists after unauthorized delete attempt");

    // 3. Test validation in deleteItemAction
    console.log("\n3. Testing deleteItemAction validation...");
    const emptyIdResult = await deleteItemAction("");
    assert(emptyIdResult.success === false, "deleteItemAction with empty ID returns error");
    assert(
      Boolean(emptyIdResult.error?.includes("Item ID is required")),
      `Error message indicates required ID: "${emptyIdResult.error}"`
    );

    const whitespaceIdResult = await deleteItemAction("   ");
    assert(whitespaceIdResult.success === false, "deleteItemAction with whitespace ID returns error");

    // 4. Test deleteItemAction with valid item ID
    console.log("\n4. Executing deleteItemAction on test item...");
    const deleteResult = await deleteItemAction(createdItem.id);
    assert(deleteResult.success === true, "deleteItemAction returned success: true");
    assert(
      deleteResult.data?.id === createdItem.id,
      `Returned deleted item ID matches: ${deleteResult.data?.id}`
    );
    assert(
      deleteResult.message === "Item deleted successfully.",
      `Success message: "${deleteResult.message}"`
    );

    // 5. Verify database records are deleted and cascaded
    console.log("\n5. Verifying database cascade and record cleanup...");
    const lookupAfterDelete = await getItemById(createdItem.id, demoUserId);
    assert(lookupAfterDelete === null, "getItemById returns null for deleted item");

    const rawItemLookup = await prisma.item.findUnique({
      where: { id: createdItem.id },
    });
    assert(rawItemLookup === null, "Item row deleted from database");

    const tagsLookup = await prisma.itemTag.findMany({
      where: { itemId: createdItem.id },
    });
    assert(tagsLookup.length === 0, "item_tags join table records cascaded and removed");

    if (collection) {
      const collectionsLookup = await prisma.itemCollection.findMany({
        where: { itemId: createdItem.id },
      });
      assert(
        collectionsLookup.length === 0,
        "item_collections join table records cascaded and removed"
      );
    }

    // Verify tag itself still exists in tags table
    const preservedTag = await prisma.tag.findUnique({
      where: { id: testTag.id },
    });
    assert(preservedTag !== null, "Tag record itself is preserved (not deleted)");

    // 6. Test deleting already deleted item fails cleanly
    console.log("\n6. Testing re-deletion of non-existent item...");
    const reDeleteResult = await deleteItemAction(createdItem.id);
    assert(reDeleteResult.success === false, "Deleting non-existent item returns success: false");
    assert(
      Boolean(reDeleteResult.error?.includes("Item not found or you do not have permission")),
      `Appropriate error message returned: "${reDeleteResult.error}"`
    );

    // Cleanup the test tag
    await prisma.tag.delete({ where: { id: testTag.id } }).catch(() => {});

    console.log(`\n=== All tests completed: ${passed}/${total} passed ===`);
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTests();
