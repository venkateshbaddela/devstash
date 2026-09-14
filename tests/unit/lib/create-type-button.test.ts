import { describe, it, expect } from "vitest";
import {
  CREATION_ITEM_TYPES,
  CreationItemType,
  TYPE_SINGULAR_LABELS,
} from "@/lib/validations/items";

describe("CreateTypeItemButton Configuration & Mapping", () => {
  it("defines singular labels for all valid creation item types", () => {
    for (const type of CREATION_ITEM_TYPES) {
      expect(TYPE_SINGULAR_LABELS[type]).toBeDefined();
      expect(typeof TYPE_SINGULAR_LABELS[type]).toBe("string");
      expect(TYPE_SINGULAR_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it("correctly maps singular labels for standard types", () => {
    expect(TYPE_SINGULAR_LABELS["snippet"]).toBe("Snippet");
    expect(TYPE_SINGULAR_LABELS["prompt"]).toBe("Prompt");
    expect(TYPE_SINGULAR_LABELS["command"]).toBe("Command");
    expect(TYPE_SINGULAR_LABELS["note"]).toBe("Note");
    expect(TYPE_SINGULAR_LABELS["link"]).toBe("Link");
    expect(TYPE_SINGULAR_LABELS["file"]).toBe("File");
    expect(TYPE_SINGULAR_LABELS["image"]).toBe("Image");
  });

  it("normalizes plural and mixed-case type slugs to valid CreationItemType", () => {
    const testCases: Array<{ input: string; expected: CreationItemType }> = [
      { input: "snippet", expected: "snippet" },
      { input: "snippets", expected: "snippet" },
      { input: "Snippet", expected: "snippet" },
      { input: "command", expected: "command" },
      { input: "commands", expected: "command" },
      { input: "prompt", expected: "prompt" },
      { input: "prompts", expected: "prompt" },
      { input: "note", expected: "note" },
      { input: "notes", expected: "note" },
      { input: "link", expected: "link" },
      { input: "links", expected: "link" },
      { input: "file", expected: "file" },
      { input: "files", expected: "file" },
      { input: "image", expected: "image" },
      { input: "images", expected: "image" },
    ];

    for (const { input, expected } of testCases) {
      const normalized = input.toLowerCase().trim().replace(/s$/, "");
      const isCreatable = CREATION_ITEM_TYPES.includes(
        normalized as CreationItemType
      );
      expect(isCreatable).toBe(true);
      expect(normalized).toBe(expected);
    }
  });

  it("identifies non-creatable types", () => {
    const nonCreatable = ["collection", "collections", "dashboard", "unknown", "item"];
    for (const slug of nonCreatable) {
      const normalized = slug.toLowerCase().trim().replace(/s$/, "");
      const isCreatable = CREATION_ITEM_TYPES.includes(
        normalized as CreationItemType
      );
      expect(isCreatable).toBe(false);
    }
  });
});
