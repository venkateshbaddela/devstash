import { z } from "zod";

/**
 * Zod validation schema for creating a new collection.
 */
export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collection name cannot be empty.")
    .max(100, "Collection name cannot exceed 100 characters."),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
