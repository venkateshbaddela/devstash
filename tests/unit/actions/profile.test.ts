import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Session } from "next-auth";
import {
  updateAvatarAction,
  updateNameAction,
  changePasswordAction,
  deleteAccountAction,
} from "@/actions/profile";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
    },
    item: {
      deleteMany: vi.fn(),
    },
    collection: {
      deleteMany: vi.fn(),
    },
    tag: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    account: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

const createMockSession = (email = "user@example.com", id = "user-1"): Session => ({
  user: {
    id,
    email,
    name: "Test User",
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
});

describe("Profile Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateAvatarAction", () => {
    it("fails if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateAvatarAction("data:image/png;base64,abc");
      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be signed in to update your avatar.");
    });

    it("fails with invalid image data URL format", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const result = await updateAvatarAction("data:application/pdf;base64,abc");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid image format");
    });

    it("fails if image exceeds 2MB limit", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const oversizedData = "data:image/png;base64," + "x".repeat(3.5 * 1024 * 1024);
      const result = await updateAvatarAction(oversizedData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Image file size exceeds");
    });

    it("successfully updates avatar when valid", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      vi.mocked(prisma.user.update).mockResolvedValue({
        image: "data:image/png;base64,validimage",
      } as unknown as Awaited<ReturnType<typeof prisma.user.update>>);

      const result = await updateAvatarAction("data:image/png;base64,validimage");
      expect(result.success).toBe(true);
      expect(result.data?.image).toBe("data:image/png;base64,validimage");
    });

    it("allows removing avatar by passing null", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      vi.mocked(prisma.user.update).mockResolvedValue({
        image: null,
      } as unknown as Awaited<ReturnType<typeof prisma.user.update>>);

      const result = await updateAvatarAction(null);
      expect(result.success).toBe(true);
      expect(result.message).toContain("Avatar removed");
    });
  });

  describe("updateNameAction", () => {
    it("fails if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateNameAction("New Name");
      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be signed in to update your name.");
    });

    it("safeguards demo user name from modification", async () => {
      mockAuth.mockResolvedValue(createMockSession("demo@devstash.io", "demo-id"));

      const result = await updateNameAction("Hacked Name");
      expect(result.success).toBe(false);
      expect(result.error).toContain("demo account name cannot be modified");
    });

    it("fails if name is empty or only whitespace", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const result = await updateNameAction("   ");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Display name must be between 1 and 60 characters.");
    });

    it("fails if name exceeds 60 characters", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const longName = "A".repeat(61);
      const result = await updateNameAction(longName);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Display name must be between 1 and 60 characters.");
    });

    it("successfully updates name when valid", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      vi.mocked(prisma.user.update).mockResolvedValue({
        name: "Jane Developer",
      } as unknown as Awaited<ReturnType<typeof prisma.user.update>>);

      const result = await updateNameAction("Jane Developer");
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Jane Developer");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "Jane Developer" },
      });
    });
  });

  describe("changePasswordAction", () => {
    it("fails if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await changePasswordAction("curr", "newpass123", "newpass123");
      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be signed in to change your password.");
    });

    it("safeguards demo user from password change", async () => {
      mockAuth.mockResolvedValue(createMockSession("demo@devstash.io", "demo-id"));

      const result = await changePasswordAction("curr", "newpass123", "newpass123");
      expect(result.success).toBe(false);
      expect(result.error).toContain("demo account password cannot be modified");
    });

    it("fails if passwords do not match", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const result = await changePasswordAction("curr", "newpass123", "differentpass");
      expect(result.success).toBe(false);
      expect(result.error).toBe("New passwords do not match.");
    });

    it("enforces minimum 8 characters for new password", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const result = await changePasswordAction("curr", "short", "short");
      expect(result.success).toBe(false);
      expect(result.error).toBe("New password must be at least 8 characters long.");
    });

    it("enforces maximum 72 characters for new password (bcrypt constraint)", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const longPass = "A".repeat(73);
      const result = await changePasswordAction("curr", longPass, longPass);
      expect(result.success).toBe(false);
      expect(result.error).toBe("New password cannot exceed 72 characters.");
    });
  });

  describe("deleteAccountAction", () => {
    it("fails if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteAccountAction("user@example.com");
      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be signed in to delete your account.");
    });

    it("safeguards demo user account from deletion", async () => {
      mockAuth.mockResolvedValue(createMockSession("demo@devstash.io", "demo-id"));

      const result = await deleteAccountAction("demo@devstash.io");
      expect(result.success).toBe(false);
      expect(result.error).toContain("demo account cannot be deleted");
    });

    it("fails if confirmation email does not match user email", async () => {
      mockAuth.mockResolvedValue(createMockSession());

      const result = await deleteAccountAction("wrong@example.com");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Confirmation email does not match");
    });
  });
});
