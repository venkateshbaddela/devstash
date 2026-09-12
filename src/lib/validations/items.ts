import { z } from "zod";

/**
 * Zod validation schema for updating an existing item.
 */
export const updateItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty.")
    .max(255, "Title cannot exceed 255 characters."),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters.")
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
  content: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return null;
      return val.length > 0 ? val : null;
    }),
  url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL starting with http:// or https://" }
    ),
  language: z
    .string()
    .trim()
    .max(50, "Language cannot exceed 50 characters.")
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tag cannot be empty.")
    )
    .optional()
    .default([]),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
