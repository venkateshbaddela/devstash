import "dotenv/config";
import { resolveItemTypeBySlug, getItemsByType } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";

async function runTests() {
  console.log("=== Testing Items List View Database Queries & Slug Resolution ===\n");
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

    // 1. Test slug resolution for all 7 types (both singular and plural)
    const systemTypes = [
      { singular: "snippet", plural: "snippets", display: "Snippets", pro: false },
      { singular: "prompt", plural: "prompts", display: "Prompts", pro: false },
      { singular: "command", plural: "commands", display: "Commands", pro: false },
      { singular: "note", plural: "notes", display: "Notes", pro: false },
      { singular: "file", plural: "files", display: "Files", pro: true },
      { singular: "image", plural: "images", display: "Images", pro: true },
      { singular: "link", plural: "links", display: "Links", pro: false },
    ];

    console.log("\n1. Testing resolveItemTypeBySlug for singular and plural slugs...");
    for (const st of systemTypes) {
      const bySingular = await resolveItemTypeBySlug(st.singular);
      assert(
        bySingular !== null && bySingular.name.toLowerCase() === st.singular,
        `Resolves singular slug "${st.singular}" -> name "${st.singular}"`
      );
      assert(
        bySingular?.displayName === st.display,
        `Singular slug "${st.singular}" has displayName "${st.display}"`
      );
      assert(
        bySingular?.isPro === st.pro,
        `Slug "${st.singular}" has isPro === ${st.pro}`
      );

      const byPlural = await resolveItemTypeBySlug(st.plural);
      assert(
        byPlural !== null && byPlural.id === bySingular?.id,
        `Resolves plural slug "${st.plural}" -> same type id as singular`
      );
    }

    // 2. Test invalid slug resolution
    console.log("\n2. Testing invalid slug resolution...");
    const invalidType = await resolveItemTypeBySlug("non-existent-type-xyz");
    assert(invalidType === null, "Invalid slug returns null");

    // 3. Test getItemsByType for populated types
    console.log("\n3. Testing getItemsByType for populated types...");
    const snippetsResult = await getItemsByType("snippets");
    assert(snippetsResult.itemType !== null, "getItemsByType('snippets') returns valid itemType");
    assert(snippetsResult.items.length > 0, `getItemsByType('snippets') returns ${snippetsResult.items.length} items (> 0)`);

    // Check first item structure
    const sampleSnippet = snippetsResult.items[0];
    assert(Boolean(sampleSnippet.id), "Snippet has valid id");
    assert(Boolean(sampleSnippet.title), "Snippet has title");
    assert(Boolean(sampleSnippet.typeColor), "Snippet has typeColor");
    assert(sampleSnippet.type.toLowerCase() === "snippet", "Snippet item type is 'snippet'");
    assert(Array.isArray(sampleSnippet.tags), "Snippet tags is an array");
    assert(typeof sampleSnippet.isPinned === "boolean", "Snippet isPinned is boolean");
    assert(typeof sampleSnippet.isFavorite === "boolean", "Snippet isFavorite is boolean");

    // Test getItemsByType for prompts
    const promptsResult = await getItemsByType("prompt");
    assert(promptsResult.itemType?.displayName === "Prompts", "getItemsByType('prompt') resolves Prompts");
    assert(promptsResult.items.length > 0, `getItemsByType('prompt') returns ${promptsResult.items.length} items`);

    // Test getItemsByType for commands
    const commandsResult = await getItemsByType("commands");
    assert(commandsResult.items.length > 0, `getItemsByType('commands') returns ${commandsResult.items.length} items`);

    // Test getItemsByType for links
    const linksResult = await getItemsByType("links");
    assert(linksResult.items.length > 0, `getItemsByType('links') returns ${linksResult.items.length} items`);

    // 4. Test getItemsByType for empty types
    console.log("\n4. Testing getItemsByType for empty types (empty state behavior)...");
    const notesResult = await getItemsByType("notes");
    assert(notesResult.itemType !== null, "getItemsByType('notes') resolves valid itemType");
    assert(Array.isArray(notesResult.items), "getItemsByType('notes') returns an array");

    // 5. Test getItemsByType for non-existent type
    const unknownResult = await getItemsByType("unknown-type");
    assert(unknownResult.itemType === null, "getItemsByType('unknown-type') returns itemType: null");
    assert(unknownResult.items.length === 0, "getItemsByType('unknown-type') returns empty items array");

    console.log(`\n================================`);
    console.log(`Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`================================\n`);

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  }
}

runTests();
