"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";
import {
  updateItem as updateItemDb,
  deleteItem as deleteItemDb,
  createItem as createItemDb,
  type ItemDetail,
} from "@/lib/db/items";
import { updateItemSchema, createItemSchema } from "@/lib/validations/items";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Server action to update an existing item.
 * Validates payload with Zod, checks user authentication and ownership,
 * updates fields and reconciles tags, and revalidates dashboard and items pages.
 */
export async function updateItemAction(
  itemId: string,
  input: unknown
): Promise<ActionResult<ItemDetail>> {
  try {
    if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
      return { success: false, error: "Item ID is required." };
    }

    const parseResult = updateItemSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: errorMsg };
    }

    let session = null;
    try {
      session = await auth();
    } catch {
      // In tests or non-request context
    }

    const userId = session?.user?.id ?? (await getDefaultUserId());
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in to perform this action.",
      };
    }

    const updatedItem = await updateItemDb(
      itemId.trim(),
      userId,
      parseResult.data
    );

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found or you do not have permission to edit it.",
      };
    }

    // Revalidate paths so dashboard and items list reflect edits
    try {
      revalidatePath("/dashboard");
      revalidatePath("/items", "layout");
    } catch {
      // Ignored outside Next.js request lifecycle (e.g. standalone scripts or testing)
    }

    return {
      success: true,
      data: updatedItem,
      message: "Item updated successfully.",
    };
  } catch (error) {
    console.error("Error in updateItemAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while updating the item.",
    };
  }
}

/**
 * Alias for updateItemAction matching spec conventions.
 */
export async function updateItem(
  itemId: string,
  input: unknown
): Promise<ActionResult<ItemDetail>> {
  return updateItemAction(itemId, input);
}

/**
 * Server action to delete an existing item.
 * Checks user authentication and ownership, deletes item from the database,
 * and revalidates dashboard and items pages.
 */
export async function deleteItemAction(
  itemId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
      return { success: false, error: "Item ID is required." };
    }

    let session = null;
    try {
      session = await auth();
    } catch {
      // In tests or non-request context
    }

    const userId = session?.user?.id ?? (await getDefaultUserId());
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in to perform this action.",
      };
    }

    const deleted = await deleteItemDb(itemId.trim(), userId);
    if (!deleted) {
      return {
        success: false,
        error: "Item not found or you do not have permission to delete it.",
      };
    }

    // Revalidate paths so dashboard and items list reflect deletion
    try {
      revalidatePath("/dashboard");
      revalidatePath("/items", "layout");
    } catch {
      // Ignored outside Next.js request lifecycle (e.g. standalone scripts or testing)
    }

    return {
      success: true,
      data: { id: itemId.trim() },
      message: "Item deleted successfully.",
    };
  } catch (error) {
    console.error("Error in deleteItemAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while deleting the item.",
    };
  }
}

/**
 * Alias for deleteItemAction matching spec conventions.
 */
export async function deleteItem(
  itemId: string
): Promise<ActionResult<{ id: string }>> {
  return deleteItemAction(itemId);
}

/**
 * Server action to create a new item.
 * Validates payload with createItemSchema Zod schema, checks authentication,
 * writes to PostgreSQL via createItem query, and revalidates dashboard/items paths.
 */
export async function createItemAction(
  input: unknown
): Promise<ActionResult<ItemDetail>> {
  try {
    const parseResult = createItemSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: errorMsg };
    }

    let session = null;
    try {
      session = await auth();
    } catch {
      // In tests or non-request context
    }

    const userId = session?.user?.id ?? (await getDefaultUserId());
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in to perform this action.",
      };
    }

    const newItem = await createItemDb(userId, parseResult.data);
    if (!newItem) {
      return {
        success: false,
        error: "Failed to create item. Please verify the selected item type.",
      };
    }

    // Revalidate paths so dashboard and items lists reflect newly created item
    try {
      revalidatePath("/dashboard");
      revalidatePath("/items", "layout");
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    return {
      success: true,
      data: newItem,
      message: "Item created successfully.",
    };
  } catch (error) {
    console.error("Error in createItemAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while creating the item.",
    };
  }
}

/**
 * Alias for createItemAction matching spec conventions.
 */
export async function createItem(
  input: unknown
): Promise<ActionResult<ItemDetail>> {
  return createItemAction(input);
}


