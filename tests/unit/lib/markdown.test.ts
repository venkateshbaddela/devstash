import { describe, it, expect } from "vitest";
import { isMarkdownItemType, isCodeItemType } from "@/lib/markdown";

describe("Markdown Item Type Utilities", () => {
  describe("isMarkdownItemType", () => {
    it("returns true for note and prompt types", () => {
      expect(isMarkdownItemType("note")).toBe(true);
      expect(isMarkdownItemType("prompt")).toBe(true);
    });

    it("handles uppercase and mixed case strings", () => {
      expect(isMarkdownItemType("NOTE")).toBe(true);
      expect(isMarkdownItemType("Prompt")).toBe(true);
      expect(isMarkdownItemType("NoTe")).toBe(true);
    });

    it("handles strings with leading and trailing whitespace", () => {
      expect(isMarkdownItemType("  note  ")).toBe(true);
      expect(isMarkdownItemType("\tprompt\n")).toBe(true);
    });

    it("returns false for non-markdown types", () => {
      expect(isMarkdownItemType("snippet")).toBe(false);
      expect(isMarkdownItemType("command")).toBe(false);
      expect(isMarkdownItemType("link")).toBe(false);
      expect(isMarkdownItemType("file")).toBe(false);
      expect(isMarkdownItemType("image")).toBe(false);
      expect(isMarkdownItemType("unknown")).toBe(false);
    });

    it("returns false for falsy or empty inputs", () => {
      expect(isMarkdownItemType("")).toBe(false);
      expect(isMarkdownItemType(null)).toBe(false);
      expect(isMarkdownItemType(undefined)).toBe(false);
    });
  });

  describe("isCodeItemType", () => {
    it("returns true for snippet and command types", () => {
      expect(isCodeItemType("snippet")).toBe(true);
      expect(isCodeItemType("command")).toBe(true);
    });

    it("handles uppercase and mixed case strings", () => {
      expect(isCodeItemType("SNIPPET")).toBe(true);
      expect(isCodeItemType("Command")).toBe(true);
      expect(isCodeItemType("cOmMaNd")).toBe(true);
    });

    it("handles strings with leading and trailing whitespace", () => {
      expect(isCodeItemType("  snippet  ")).toBe(true);
      expect(isCodeItemType("\tcommand\n")).toBe(true);
    });

    it("returns false for non-code types", () => {
      expect(isCodeItemType("note")).toBe(false);
      expect(isCodeItemType("prompt")).toBe(false);
      expect(isCodeItemType("link")).toBe(false);
      expect(isCodeItemType("file")).toBe(false);
      expect(isCodeItemType("image")).toBe(false);
      expect(isCodeItemType("unknown")).toBe(false);
    });

    it("returns false for falsy or empty inputs", () => {
      expect(isCodeItemType("")).toBe(false);
      expect(isCodeItemType(null)).toBe(false);
      expect(isCodeItemType(undefined)).toBe(false);
    });
  });
});
