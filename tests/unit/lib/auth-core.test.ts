import { describe, it, expect, vi, beforeEach } from "vitest";
import { executePasswordResetRequest, executePasswordReset } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken, consumePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tokens", () => ({
  generatePasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

describe("Auth Core Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executePasswordResetRequest", () => {
    it("fails when email is empty or whitespace", async () => {
      const res1 = await executePasswordResetRequest("");
      expect(res1.success).toBe(false);
      expect(res1.error).toContain("Please enter your email address.");

      const res2 = await executePasswordResetRequest("   ");
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("Please enter your email address.");
    });

    it("fails when email format is invalid", async () => {
      const invalidEmails = ["notanemail", "user@", "@domain.com", "user@domain", "user space@test.com"];
      for (const email of invalidEmails) {
        const res = await executePasswordResetRequest(email);
        expect(res.success).toBe(false);
        expect(res.error).toContain("Please enter a valid email address.");
      }
    });

    it("returns generic success message when user does not exist (enumeration defense)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await executePasswordResetRequest("nonexistent@example.com");
      expect(res.success).toBe(true);
      expect(res.message).toBe("If an account exists with this email, a password reset link has been sent.");
      expect(generatePasswordResetToken).not.toHaveBeenCalled();
    });

    it("generates token and sends email when user exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      vi.mocked(generatePasswordResetToken).mockResolvedValue({
        token: "12345678-1234-1234-1234-123456789abc",
        identifier: "password-reset:user@example.com",
        expires: new Date(Date.now() + 3600000),
      });

      vi.mocked(sendPasswordResetEmail).mockResolvedValue({
        success: true,
      });

      const res = await executePasswordResetRequest("user@example.com");
      expect(res.success).toBe(true);
      expect(generatePasswordResetToken).toHaveBeenCalledWith("user@example.com");
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        "user@example.com",
        "12345678-1234-1234-1234-123456789abc"
      );
    });
  });

  describe("executePasswordReset", () => {
    it("fails when token is empty", async () => {
      const res = await executePasswordReset("", "ValidPassword123", "ValidPassword123");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid or missing reset token.");
    });

    it("fails when password is empty", async () => {
      const res = await executePasswordReset("token-abc", "", "");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Please enter a new password.");
    });

    it("enforces minimum password length of 8 characters", async () => {
      const res = await executePasswordReset("token-abc", "1234567", "1234567");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Password must be at least 8 characters long.");
    });

    it("enforces maximum password length of 72 characters (bcrypt constraint)", async () => {
      const longPassword = "A".repeat(73);
      const res = await executePasswordReset("token-abc", longPassword, longPassword);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Password cannot exceed 72 characters.");
    });

    it("fails when passwords do not match", async () => {
      const res = await executePasswordReset("token-abc", "ValidPassword123", "DifferentPassword456");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Passwords do not match.");
    });

    it("handles expired token error from token consumption", async () => {
      vi.mocked(consumePasswordResetToken).mockResolvedValue({
        success: false,
        error: "TOKEN_EXPIRED",
      });

      const res = await executePasswordReset("token-abc", "ValidPassword123", "ValidPassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("This reset link has expired.");
    });

    it("successfully resets password when valid", async () => {
      vi.mocked(consumePasswordResetToken).mockResolvedValue({
        success: true,
        email: "user@example.com",
      });

      const res = await executePasswordReset("valid-token-abc", "ValidPassword123", "ValidPassword123");
      expect(res.success).toBe(true);
      expect(res.email).toBe("user@example.com");
      expect(consumePasswordResetToken).toHaveBeenCalled();
    });
  });
});
