import { describe, it, expect } from "vitest";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";

describe("Collection Validation Schema (createCollectionSchema)", () => {
  it("validates valid collection with name only", () => {
    const result = createCollectionSchema.safeParse({
      name: "Frontend Libraries",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Frontend Libraries");
      expect(result.data.description).toBeNull();
    }
  });

  it("validates valid collection with name and description", () => {
    const result = createCollectionSchema.safeParse({
      name: "DevOps & CI/CD",
      description: "Collection of Docker, GitHub Actions, and Kubernetes setups.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("DevOps & CI/CD");
      expect(result.data.description).toBe(
        "Collection of Docker, GitHub Actions, and Kubernetes setups."
      );
    }
  });

  it("trims whitespace from name and description", () => {
    const result = createCollectionSchema.safeParse({
      name: "   Algorithms   ",
      description: "   Useful algorithms   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Algorithms");
      expect(result.data.description).toBe("Useful algorithms");
    }
  });

  it("rejects empty or whitespace-only name", () => {
    const emptyResult = createCollectionSchema.safeParse({
      name: "",
    });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues[0]?.message).toBe(
        "Collection name cannot be empty."
      );
    }

    const whitespaceResult = createCollectionSchema.safeParse({
      name: "    ",
    });
    expect(whitespaceResult.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const longName = "a".repeat(101);
    const result = createCollectionSchema.safeParse({
      name: longName,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Collection name cannot exceed 100 characters."
      );
    }
  });

  it("transforms empty description to null", () => {
    const result = createCollectionSchema.safeParse({
      name: "Database Tools",
      description: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it("rejects description exceeding 1000 characters", () => {
    const longDesc = "a".repeat(1001);
    const result = createCollectionSchema.safeParse({
      name: "Tooling",
      description: longDesc,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Description cannot exceed 1000 characters."
      );
    }
  });
});

describe("Collection Validation Schema (updateCollectionSchema)", () => {
  it("validates valid collection update with name only", () => {
    const result = updateCollectionSchema.safeParse({
      name: "Updated Libraries",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Libraries");
      expect(result.data.description).toBeNull();
    }
  });

  it("validates valid collection update with name and description", () => {
    const result = updateCollectionSchema.safeParse({
      name: "DevOps & Cloud",
      description: "Updated notes about Cloud architectures.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("DevOps & Cloud");
      expect(result.data.description).toBe(
        "Updated notes about Cloud architectures."
      );
    }
  });

  it("trims whitespace from name and description in update", () => {
    const result = updateCollectionSchema.safeParse({
      name: "   Algorithms v2   ",
      description: "   Updated algorithms   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Algorithms v2");
      expect(result.data.description).toBe("Updated algorithms");
    }
  });

  it("rejects empty or whitespace-only name on update", () => {
    const emptyResult = updateCollectionSchema.safeParse({
      name: "",
    });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues[0]?.message).toBe(
        "Collection name cannot be empty."
      );
    }

    const whitespaceResult = updateCollectionSchema.safeParse({
      name: "    ",
    });
    expect(whitespaceResult.success).toBe(false);
  });

  it("rejects name exceeding 100 characters on update", () => {
    const longName = "a".repeat(101);
    const result = updateCollectionSchema.safeParse({
      name: longName,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Collection name cannot exceed 100 characters."
      );
    }
  });

  it("transforms empty description to null on update", () => {
    const result = updateCollectionSchema.safeParse({
      name: "Database Tools",
      description: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it("rejects description exceeding 1000 characters on update", () => {
    const longDesc = "a".repeat(1001);
    const result = updateCollectionSchema.safeParse({
      name: "Tooling",
      description: longDesc,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Description cannot exceed 1000 characters."
      );
    }
  });
});

