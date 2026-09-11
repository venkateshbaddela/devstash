import { describe, it, expect } from "vitest";
import { getItemTypeIcon, ITEM_TYPE_ICONS } from "@/lib/icons";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";

describe("Item Type Icons Utility", () => {
  it("resolves exact lowercase system type names", () => {
    expect(getItemTypeIcon("snippet")).toBe(Code);
    expect(getItemTypeIcon("prompt")).toBe(Sparkles);
    expect(getItemTypeIcon("command")).toBe(Terminal);
    expect(getItemTypeIcon("note")).toBe(StickyNote);
    expect(getItemTypeIcon("file")).toBe(File);
    expect(getItemTypeIcon("image")).toBe(ImageIcon);
    expect(getItemTypeIcon("link")).toBe(LinkIcon);
  });

  it("resolves plural type names", () => {
    expect(getItemTypeIcon("snippets")).toBe(Code);
    expect(getItemTypeIcon("prompts")).toBe(Sparkles);
    expect(getItemTypeIcon("commands")).toBe(Terminal);
    expect(getItemTypeIcon("notes")).toBe(StickyNote);
    expect(getItemTypeIcon("files")).toBe(File);
    expect(getItemTypeIcon("images")).toBe(ImageIcon);
    expect(getItemTypeIcon("links")).toBe(LinkIcon);
  });

  it("resolves capitalized names case-insensitively", () => {
    expect(getItemTypeIcon("Snippet")).toBe(Code);
    expect(getItemTypeIcon("PROMPTS")).toBe(Sparkles);
    expect(getItemTypeIcon("Command")).toBe(Terminal);
  });

  it("falls back to Code icon for null, undefined, or unknown names", () => {
    expect(getItemTypeIcon(null)).toBe(Code);
    expect(getItemTypeIcon(undefined)).toBe(Code);
    expect(getItemTypeIcon("")).toBe(Code);
    expect(getItemTypeIcon("non-existent-type")).toBe(Code);
  });

  it("has mapping for all 7 standard types", () => {
    const standardTypes = ["snippet", "prompt", "command", "note", "file", "image", "link"];
    for (const type of standardTypes) {
      expect(ITEM_TYPE_ICONS[type]).toBeDefined();
    }
  });
});
