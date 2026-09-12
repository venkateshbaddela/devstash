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

/**
 * Valid item types allowed for user creation.
 */
export const CREATION_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
] as const;

export type CreationItemType = (typeof CREATION_ITEM_TYPES)[number];

/**
 * Zod validation schema for creating a new item.
 * Validates polymorphic requirements based on the selected item type.
 */
export const createItemSchema = z
  .object({
    type: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (val) =>
          CREATION_ITEM_TYPES.includes(val as CreationItemType),
        {
          message:
            "Invalid item type. Must be snippet, prompt, command, note, or link.",
        }
      ),
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
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
      }),
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
    collectionId: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  })
  .superRefine((data, ctx) => {
    if (data.type === "link") {
      if (!data.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL is required for links.",
          path: ["url"],
        });
      } else {
        try {
          const parsed = new URL(data.url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please enter a valid URL starting with http:// or https://",
              path: ["url"],
            });
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid URL starting with http:// or https://",
            path: ["url"],
          });
        }
      }
    }
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

