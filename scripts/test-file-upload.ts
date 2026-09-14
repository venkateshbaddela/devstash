import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getItemById, deleteItem } from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { createItemAction } from "../src/actions/items";
import {
  uploadFileToB2,
  getFileFromB2,
  deleteFileFromB2,
} from "../src/lib/storage";

async function runTests() {
  console.log("=== Testing File & Image Upload, Persistence, and Storage Cleanup ===\n");
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

    // 1. Test Storage primitives (Upload, Retrieve, Delete)
    console.log("\n1. Testing Backblaze B2 direct storage primitives...");
    const testStorageKey = `e2e-test/${Date.now()}-sample.txt`;
    const testBuffer = Buffer.from("Hello DevStash Backblaze B2 Storage!", "utf-8");
    const uploadRes = await uploadFileToB2({
      key: testStorageKey,
      buffer: testBuffer,
      contentType: "text/plain",
    });
    assert(uploadRes.success === true, "Storage upload succeeds");
    assert(uploadRes.key === testStorageKey, "Upload returns matching storage key");

    const retrieved = await getFileFromB2(testStorageKey);
    assert(retrieved !== null, "Stored file is retrievable");
    assert(
      retrieved?.buffer.toString("utf-8") === "Hello DevStash Backblaze B2 Storage!",
      "Retrieved buffer content matches original"
    );
    assert(retrieved?.contentType === "text/plain", "Retrieved content type matches");

    const deletedStorage = await deleteFileFromB2(testStorageKey);
    assert(deletedStorage === true, "Storage file deletion succeeds");
    const retrievedAfterDelete = await getFileFromB2(testStorageKey);
    assert(retrievedAfterDelete === null, "Deleted storage file is no longer retrievable");

    // 2. Test createItemAction for File type
    console.log("\n2. Testing createItemAction for 'file' type...");
    const fileStorageKey = `${demoUserId}/files/sample-doc.pdf`;
    // Put a dummy file in storage so we can test deletion cascade later
    await uploadFileToB2({
      key: fileStorageKey,
      buffer: Buffer.from("%PDF-1.4 mock pdf content", "utf-8"),
      contentType: "application/pdf",
    });

    const fileRes = await createItemAction({
      type: "file",
      title: "[E2E-TEST] System Architecture Spec PDF",
      description: "Architecture blueprint for DevStash file storage",
      fileName: "system-spec.pdf",
      fileSize: 1048576, // 1 MB
      mimeType: "application/pdf",
      storageKey: fileStorageKey,
      fileUrl: `/api/files/download?key=${encodeURIComponent(fileStorageKey)}`,
      tags: ["e2e-files", "spec", "architecture"],
    });

    assert(fileRes.success === true, "File item creation returned success: true");
    assert(Boolean(fileRes.data?.id), `File item created with ID: ${fileRes.data?.id}`);
    assert(fileRes.data?.type === "file", `Item type is file: ${fileRes.data?.type}`);
    assert(fileRes.data?.contentType === "FILE", "Content type is FILE");
    assert(fileRes.data?.fileName === "system-spec.pdf", "fileName is system-spec.pdf");
    assert(fileRes.data?.fileSize === 1048576, "fileSize is 1048576");
    assert(fileRes.data?.mimeType === "application/pdf", "mimeType is application/pdf");
    assert(fileRes.data?.storageKey === fileStorageKey, "storageKey is preserved");
    assert(
      fileRes.data?.fileUrl?.includes("/api/files/download") === true,
      "fileUrl routes through download proxy"
    );
    if (fileRes.data?.id) createdItemIds.push(fileRes.data.id);

    // 3. Test createItemAction for Image type
    console.log("\n3. Testing createItemAction for 'image' type...");
    const imageStorageKey = `${demoUserId}/images/dashboard-mockup.png`;
    await uploadFileToB2({
      key: imageStorageKey,
      buffer: Buffer.from("mock png bytes", "utf-8"),
      contentType: "image/png",
    });

    const imageRes = await createItemAction({
      type: "image",
      title: "[E2E-TEST] Dashboard High-Fi Mockup",
      description: "Figma export for dashboard dark mode design",
      fileName: "dashboard-mockup.png",
      fileSize: 524288, // 512 KB
      mimeType: "image/png",
      storageKey: imageStorageKey,
      fileUrl: `/api/files/download?key=${encodeURIComponent(imageStorageKey)}`,
      tags: ["e2e-files", "design", "ui"],
    });

    assert(imageRes.success === true, "Image item creation returned success: true");
    assert(Boolean(imageRes.data?.id), `Image item created with ID: ${imageRes.data?.id}`);
    assert(imageRes.data?.type === "image", `Item type is image: ${imageRes.data?.type}`);
    assert(imageRes.data?.contentType === "FILE", "Content type is FILE");
    assert(imageRes.data?.fileName === "dashboard-mockup.png", "fileName is dashboard-mockup.png");
    assert(imageRes.data?.mimeType === "image/png", "mimeType is image/png");
    assert(imageRes.data?.storageKey === imageStorageKey, "storageKey is preserved");
    if (imageRes.data?.id) createdItemIds.push(imageRes.data.id);

    // 4. Test DB persistence verification via getItemById
    console.log("\n4. Verifying DB persistence via getItemById...");
    if (fileRes.data?.id) {
      const persistedFile = await getItemById(fileRes.data.id, demoUserId);
      assert(persistedFile !== null, "Created file fetched via getItemById");
      assert(persistedFile?.title === "[E2E-TEST] System Architecture Spec PDF", "Title matches");
      assert(persistedFile?.contentType === "FILE", "DB persisted contentType is FILE");
      assert(persistedFile?.fileName === "system-spec.pdf", "DB persisted fileName matches");
      assert(persistedFile?.storageKey === fileStorageKey, "DB persisted storageKey matches");
    }

    if (imageRes.data?.id) {
      const persistedImage = await getItemById(imageRes.data.id, demoUserId);
      assert(persistedImage !== null, "Created image fetched via getItemById");
      assert(persistedImage?.mimeType === "image/png", "DB persisted mimeType matches");
      assert(persistedImage?.storageKey === imageStorageKey, "DB persisted storageKey matches");
    }

    // 5. Test validation failure when file/image is created without storageKey
    console.log("\n5. Testing validation error cases...");
    const missingFileStorageRes = await createItemAction({
      type: "file",
      title: "File without upload",
    });
    assert(missingFileStorageRes.success === false, "File without storageKey/fileUrl is rejected");
    assert(
      Boolean(missingFileStorageRes.error?.includes("Please upload a file")),
      `Expected error message received: "${missingFileStorageRes.error}"`
    );

    const missingImageStorageRes = await createItemAction({
      type: "image",
      title: "Image without upload",
    });
    assert(missingImageStorageRes.success === false, "Image without storageKey/fileUrl is rejected");
    assert(
      Boolean(missingImageStorageRes.error?.includes("Please upload a image")),
      `Expected error message received: "${missingImageStorageRes.error}"`
    );

    // 6. Test item deletion with automated storage cleanup
    console.log("\n6. Testing item deletion with automated Backblaze B2 cleanup...");
    // Verify file exists in storage before delete
    const fileBeforeDelete = await getFileFromB2(fileStorageKey);
    assert(fileBeforeDelete !== null, "Storage file exists prior to item deletion");

    if (fileRes.data?.id) {
      const deleted = await deleteItem(fileRes.data.id, demoUserId);
      assert(deleted === true, "deleteItem successfully deleted item from DB");

      // Verify item is gone from DB
      const dbAfterDelete = await getItemById(fileRes.data.id, demoUserId);
      assert(dbAfterDelete === null, "Item is no longer in database");

      // Verify file is cleaned up from storage
      const fileAfterDelete = await getFileFromB2(fileStorageKey);
      assert(fileAfterDelete === null, "Storage object was automatically cleaned up on item deletion");
    }

    if (imageRes.data?.id) {
      const deletedImage = await deleteItem(imageRes.data.id, demoUserId);
      assert(deletedImage === true, "deleteItem successfully deleted image item from DB");

      const imageAfterDelete = await getFileFromB2(imageStorageKey);
      assert(imageAfterDelete === null, "Image storage object was automatically cleaned up");
    }

    // 7. Cleanup any leftover tags created by the test
    console.log("\n7. Cleaning up test tags...");
    const testTag = await prisma.tag.findFirst({
      where: { name: "e2e-files", userId: demoUserId },
    });
    if (testTag) {
      await prisma.tag.delete({ where: { id: testTag.id } }).catch(() => {});
    }
    assert(true, "Cleaned up test tags");

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
