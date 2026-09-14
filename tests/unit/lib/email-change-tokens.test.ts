import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateEmailChangeToken,
  getEmailChangeIdentifier,
  parseEmailChangeIdentifier,
  verifyToken,
  EMAIL_CHANGE_PREFIX,
} from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("Email Change Token Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("identifier helpers", () => {
    it("generates correct email-change identifier format", () => {
      const identifier = getEmailChangeIdentifier("user-123", "NEW@example.com");
      expect(identifier).toBe("email-change:user-123:new@example.com");
    });

    it("parses valid email-change identifier", () => {
      const parsed = parseEmailChangeIdentifier("email-change:user-123:new@example.com");
      expect(parsed).toEqual({
        userId: "user-123",
        newEmail: "new@example.com",
      });
    });

    it("returns null for non-email-change identifier", () => {
      expect(parseEmailChangeIdentifier("standard@example.com")).toBeNull();
      expect(parseEmailChangeIdentifier("password-reset:user@example.com")).toBeNull();
    });
  });

  describe("generateEmailChangeToken", () => {
    it("deletes existing email-change tokens for this user and creates a new one", async () => {
      vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({
        identifier: "email-change:user-1:new@example.com",
        token: "uuid-token-123",
        expires: new Date(),
      });

      const token = await generateEmailChangeToken("user-1", "NEW@EXAMPLE.COM");

      expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: {
          identifier: {
            startsWith: `${EMAIL_CHANGE_PREFIX}user-1:`,
          },
        },
      });

      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: "email-change:user-1:new@example.com",
          token: expect.any(String),
          expires: expect.any(Date),
        }),
      });

      expect(token.token).toBe("uuid-token-123");
    });
  });

  describe("verifyToken with email-change identifier", () => {
    it("returns EMAIL_ALREADY_IN_USE if new email has been registered by another user", async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        identifier: "email-change:user-1:claimed@example.com",
        token: "tok-1",
        expires: new Date(Date.now() + 100000),
      });

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: "user-1", email: "old@example.com" } as never) // lookup current user
        .mockResolvedValueOnce({ id: "other-user", email: "claimed@example.com" } as never); // conflict check

      const result = await verifyToken("tok-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("EMAIL_ALREADY_IN_USE");
      }
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("atomically updates user email and emailVerified on valid token", async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        identifier: "email-change:user-1:brandnew@example.com",
        token: "tok-1",
        expires: new Date(Date.now() + 100000),
      });

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: "user-1", email: "old@example.com" } as never) // lookup current user
        .mockResolvedValueOnce(null); // conflict check: new email is free

      const result = await verifyToken("tok-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.email).toBe("brandnew@example.com");
        expect(result.isEmailChange).toBe(true);
      }

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          email: "brandnew@example.com",
          emailVerified: expect.any(Date),
        },
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: "tok-1" },
      });
    });
  });
});
