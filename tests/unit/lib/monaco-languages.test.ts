import { describe, it, expect } from "vitest";
import {
  normalizeMonacoLanguage,
  formatLanguageLabel,
} from "@/lib/monaco-languages";

describe("monaco-languages utility", () => {
  describe("normalizeMonacoLanguage", () => {
    it("returns plaintext for null, undefined, or empty strings", () => {
      expect(normalizeMonacoLanguage(null)).toBe("plaintext");
      expect(normalizeMonacoLanguage(undefined)).toBe("plaintext");
      expect(normalizeMonacoLanguage("")).toBe("plaintext");
      expect(normalizeMonacoLanguage("   ")).toBe("plaintext");
    });

    it("normalizes javascript and typescript aliases", () => {
      expect(normalizeMonacoLanguage("js")).toBe("javascript");
      expect(normalizeMonacoLanguage("jsx")).toBe("javascript");
      expect(normalizeMonacoLanguage("ts")).toBe("typescript");
      expect(normalizeMonacoLanguage("tsx")).toBe("typescript");
      expect(normalizeMonacoLanguage("typescript")).toBe("typescript");
    });

    it("normalizes shell and terminal aliases", () => {
      expect(normalizeMonacoLanguage("bash")).toBe("shell");
      expect(normalizeMonacoLanguage("sh")).toBe("shell");
      expect(normalizeMonacoLanguage("zsh")).toBe("shell");
      expect(normalizeMonacoLanguage("shell")).toBe("shell");
      expect(normalizeMonacoLanguage("terminal")).toBe("shell");
      expect(normalizeMonacoLanguage("command")).toBe("shell");
    });

    it("normalizes python aliases", () => {
      expect(normalizeMonacoLanguage("py")).toBe("python");
      expect(normalizeMonacoLanguage("py3")).toBe("python");
      expect(normalizeMonacoLanguage("python")).toBe("python");
    });

    it("normalizes devops and data languages", () => {
      expect(normalizeMonacoLanguage("docker")).toBe("dockerfile");
      expect(normalizeMonacoLanguage("dockerfile")).toBe("dockerfile");
      expect(normalizeMonacoLanguage("yml")).toBe("yaml");
      expect(normalizeMonacoLanguage("yaml")).toBe("yaml");
      expect(normalizeMonacoLanguage("json")).toBe("json");
      expect(normalizeMonacoLanguage("sql")).toBe("sql");
    });

    it("handles case insensitivity and whitespace trimming", () => {
      expect(normalizeMonacoLanguage("  TypeScript  ")).toBe("typescript");
      expect(normalizeMonacoLanguage("BASH")).toBe("shell");
      expect(normalizeMonacoLanguage("PyThOn")).toBe("python");
    });

    it("preserves unmapped clean strings as fallback", () => {
      expect(normalizeMonacoLanguage("solidity")).toBe("solidity");
      expect(normalizeMonacoLanguage("haskell")).toBe("haskell");
    });
  });

  describe("formatLanguageLabel", () => {
    it("returns empty string for null, undefined, or whitespace", () => {
      expect(formatLanguageLabel(null)).toBe("");
      expect(formatLanguageLabel(undefined)).toBe("");
      expect(formatLanguageLabel("")).toBe("");
      expect(formatLanguageLabel("   ")).toBe("");
    });

    it("returns formatted display labels for standard languages", () => {
      expect(formatLanguageLabel("typescript")).toBe("TypeScript");
      expect(formatLanguageLabel("javascript")).toBe("JavaScript");
      expect(formatLanguageLabel("python")).toBe("Python");
      expect(formatLanguageLabel("bash")).toBe("Bash");
      expect(formatLanguageLabel("dockerfile")).toBe("Dockerfile");
      expect(formatLanguageLabel("sql")).toBe("SQL");
      expect(formatLanguageLabel("cpp")).toBe("C++");
      expect(formatLanguageLabel("csharp")).toBe("C#");
    });

    it("resolves labels via aliases", () => {
      expect(formatLanguageLabel("ts")).toBe("TypeScript");
      expect(formatLanguageLabel("js")).toBe("JavaScript");
      expect(formatLanguageLabel("py")).toBe("Python");
      expect(formatLanguageLabel("docker")).toBe("Dockerfile");
    });

    it("capitalizes first letter for unmapped languages", () => {
      expect(formatLanguageLabel("clojure")).toBe("Clojure");
      expect(formatLanguageLabel("elixir")).toBe("Elixir");
    });
  });
});
