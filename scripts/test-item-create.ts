import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getItemById, deleteItem } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { createItemAction } from "../src/actions/items";

async function runTests() {
  console.log("=== Testing Item Create Database Queries & Server Action ===\n");
  let passed = 0;
  let total = 0;
  const createdItemIds: string[] = [];

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

    // 1. Test creating a Snippet
    console.log("\n1. Testing createItemAction for Snippet...");
    const snippetRes = await createItemAction({
      type: "snippet",
      title: "[E2E-CREATE] React Custom Hook Snippet",
      description: "Reusable hook for window resize events",
      content: "export function useResize() { return window.innerWidth; }",
      language: "typescript",
      tags: ["e2e-create-tag", "react", "hooks"],
    });

    assert(snippetRes.success === true, "Snippet creation returned success: true");
    assert(Boolean(snippetRes.data?.id), `Snippet created with ID: ${snippetRes.data?.id}`);
    assert(snippetRes.data?.type === "snippet", `Item type is snippet: ${snippetRes.data?.type}`);
    assert(snippetRes.data?.language === "typescript", "Language is typescript");
    assert(
      snippetRes.data?.tags.includes("e2e-create-tag") === true,
      "Tag 'e2e-create-tag' is attached"
    );
    if (snippetRes.data?.id) createdItemIds.push(snippetRes.data.id);

    // 2. Test creating a Command
    console.log("\n2. Testing createItemAction for Command...");
    const commandRes = await createItemAction({
      type: "command",
      title: "[E2E-CREATE] Docker Production Build Command",
      content: "docker build -t devstash:prod --target runner .",
      language: "bash",
      tags: ["docker", "e2e-create-tag"],
    });

    assert(commandRes.success === true, "Command creation returned success: true");
    assert(commandRes.data?.type === "command", "Item type is command");
    if (commandRes.data?.id) createdItemIds.push(commandRes.data.id);

    // 3. Test creating a Prompt
    console.log("\n3. Testing createItemAction for Prompt...");
    const promptRes = await createItemAction({
      type: "prompt",
      title: "[E2E-CREATE] Code Auditor System Prompt",
      content: "You are an expert security auditor reviewing Next.js App Router applications.",
      tags: ["ai", "prompt"],
    });

    assert(promptRes.success === true, "Prompt creation returned success: true");
    assert(promptRes.data?.type === "prompt", "Item type is prompt");
    if (promptRes.data?.id) createdItemIds.push(promptRes.data.id);

    // 4. Test creating a Note
    console.log("\n4. Testing createItemAction for Note...");
    const noteRes = await createItemAction({
      type: "note",
      title: "[E2E-CREATE] Polymorphic CRUD Architecture Notes",
      content: "Unified server actions provide polymorphic handling for all 7 item types.",
    });

    assert(noteRes.success === true, "Note creation returned success: true");
    assert(noteRes.data?.type === "note", "Item type is note");
    if (noteRes.data?.id) createdItemIds.push(noteRes.data.id);

    // 5. Test creating a Link
    console.log("\n5. Testing createItemAction for Link...");
    const linkRes = await createItemAction({
      type: "link",
      title: "[E2E-CREATE] Official ShadCN UI Documentation",
      url: "https://ui.shadcn.com/docs/components/dialog",
      description: "Accessible component library for React and Tailwind CSS",
      tags: ["docs", "shadcn"],
    });

    assert(linkRes.success === true, "Link creation returned success: true");
    assert(linkRes.data?.type === "link", "Item type is link");
    assert(linkRes.data?.contentType === "URL", "Content type is URL");
    assert(
      linkRes.data?.url === "https://ui.shadcn.com/docs/components/dialog",
      "URL matches input"
    );
    if (linkRes.data?.id) createdItemIds.push(linkRes.data.id);

    // 6. Test DB persistence verification via getItemById
    console.log("\n6. Verifying DB persistence...");
    if (snippetRes.data?.id) {
      const persistedSnippet = await getItemById(snippetRes.data.id, demoUserId);
      assert(persistedSnippet !== null, "Created snippet fetched via getItemById");
      assert(
        persistedSnippet?.title === "[E2E-CREATE] React Custom Hook Snippet",
        "Title matches persisted value"
      );
    }

    // 7. Test validation failure cases
    console.log("\n7. Testing validation error cases...");
    const emptyTitleRes = await createItemAction({
      type: "snippet",
      title: "   ",
    });
    assert(emptyTitleRes.success === false, "Missing title is rejected");

    const linkMissingUrlRes = await createItemAction({
      type: "link",
      title: "Link Without URL",
    });
    assert(linkMissingUrlRes.success === false, "Link without URL is rejected");
    assert(
      Boolean(linkMissingUrlRes.error?.includes("URL is required for links")),
      `Error indicates URL is required: "${linkMissingUrlRes.error}"`
    );

    const linkInvalidUrlRes = await createItemAction({
      type: "link",
      title: "Invalid URL Link",
      url: "ftp://invalid-protocol",
    });
    assert(linkInvalidUrlRes.success === false, "Link with invalid URL is rejected");

    const invalidTypeRes = await createItemAction({
      type: "unsupported-item-type",
      title: "Bad Type Item",
    });
    assert(invalidTypeRes.success === false, "Unsupported item type is rejected");

    // 8. Cleanup test items
    console.log("\n8. Cleaning up test items...");
    for (const id of createdItemIds) {
      await deleteItem(id, demoUserId);
    }
    // Cleanup the test tag
    const testTag = await prisma.tag.findFirst({
      where: { name: "e2e-create-tag", userId: demoUserId },
    });
    if (testTag) {
      await prisma.tag.delete({ where: { id: testTag.id } }).catch(() => {});
    }
    assert(true, `Cleaned up ${createdItemIds.length} test items`);

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
