"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/auth-guards";
import {
  updateCollection as updateCollectionDb,
  deleteCollection as deleteCollectionDb,
  type DashboardCollection,
} from "@/lib/db/collections";
import { updateCollectionSchema } from "@/lib/validations/collections";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Server action to update an existing collection.
 * Validates payload with Zod, verifies authentication and ownership,
 * updates fields, and revalidates collection and dashboard paths.
 */
export async function updateCollectionAction(
  collectionId: string,
  input: unknown
): Promise<ActionResult<DashboardCollection>> {
  try {
    if (!collectionId || typeof collectionId !== "string" || !collectionId.trim()) {
      return { success: false, error: "Collection ID is required." };
    }

    const parseResult = updateCollectionSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return { success: false, error: errorMsg };
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in to perform this action.",
      };
    }

    const updatedCollection = await updateCollectionDb(
      userId,
      collectionId.trim(),
      parseResult.data
    );

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId.trim()}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedCollection,
      message: "Collection updated successfully.",
    };
  } catch (error) {
    console.error("Error in updateCollectionAction:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update collection.";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete an existing collection.
 * Deleting a collection cascades to delete junction records in item_collections,
 * leaving all items in the user's stash intact.
 */
export async function deleteCollectionAction(
  collectionId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!collectionId || typeof collectionId !== "string" || !collectionId.trim()) {
      return { success: false, error: "Collection ID is required." };
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in to perform this action.",
      };
    }

    const result = await deleteCollectionDb(userId, collectionId.trim());

    revalidatePath("/collections");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
      message: "Collection deleted successfully.",
    };
  } catch (error) {
    console.error("Error in deleteCollectionAction:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete collection.";
    return { success: false, error: message };
  }
}
