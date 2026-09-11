import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resendVerificationAction,
  verifyEmailAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, verifyToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  executePasswordResetRequest,
  executePasswordReset,
} from "@/lib/auth-core";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tokens", () => ({
  generateVerificationToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth-core", () => ({
  executePasswordResetRequest: vi.fn(),
  executePasswordReset: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClientIp).mockResolvedValue("127.0.0.1");
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
      retryAfterSeconds: 0,
    });
  });

  describe("resendVerificationAction", () => {
    it("fails when email is empty or invalid", async () => {
      const res1 = await resendVerificationAction("");
      expect(res1.success).toBe(false);
      expect(res1.error).toBe("Please enter your email address.");

      const res2 = await resendVerificationAction("not-an-email");
      expect(res2.success).toBe(false);
      expect(res2.error).toBe("Please enter a valid email address.");
    });

    it("returns error if rate limit is exceeded", async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        limit: 3,
        remaining: 0,
        reset: Date.now() + 900000,
        retryAfterSeconds: 900,
        errorMessage: "Too many attempts. Please try again in 15 minutes.",
      });

      const res = await resendVerificationAction("user@example.com");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Too many attempts. Please try again in 15 minutes.");
    });

    it("returns generic success message when user does not exist (enumeration defense)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await resendVerificationAction("nonexistent@example.com");
      expect(res.success).toBe(true);
      expect(res.message).toBe("If an account exists with this email, a verification link has been sent.");
      expect(generateVerificationToken).not.toHaveBeenCalled();
    });

    it("returns generic success message when user is already verified (enumeration defense)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "verified@example.com",
        emailVerified: new Date(),
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const res = await resendVerificationAction("verified@example.com");
      expect(res.success).toBe(true);
      expect(res.message).toBe("If an account exists with this email, a verification link has been sent.");
      expect(generateVerificationToken).not.toHaveBeenCalled();
    });

    it("sends verification email when user exists and is unverified", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "unverified@example.com",
        emailVerified: null,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      vi.mocked(generateVerificationToken).mockResolvedValue({
        token: "12345678-1234-1234-1234-123456789abc",
        identifier: "unverified@example.com",
        expires: new Date(Date.now() + 86400000),
      });

      vi.mocked(sendVerificationEmail).mockResolvedValue({ success: true });

      const res = await resendVerificationAction("unverified@example.com");
      expect(res.success).toBe(true);
      expect(generateVerificationToken).toHaveBeenCalledWith("unverified@example.com");
      expect(sendVerificationEmail).toHaveBeenCalledWith("unverified@example.com", "12345678-1234-1234-1234-123456789abc");
    });
  });

  describe("verifyEmailAction", () => {
    it("handles expired token", async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        success: false,
        error: "TOKEN_EXPIRED",
      });

      const res = await verifyEmailAction("expired-token");
      expect(res.success).toBe(false);
      expect(res.error).toContain("This verification link has expired.");
    });

    it("handles invalid or consumed token", async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        success: false,
        error: "TOKEN_NOT_FOUND",
      });

      const res = await verifyEmailAction("invalid-token");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid or consumed verification link.");
    });

    it("returns success when token is valid", async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        success: true,
        email: "verified@example.com",
      });

      const res = await verifyEmailAction("valid-token");
      expect(res.success).toBe(true);
      expect(res.email).toBe("verified@example.com");
    });
  });

  describe("requestPasswordResetAction", () => {
    it("fails when email is empty", async () => {
      const res = await requestPasswordResetAction("");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Please enter your email address.");
    });

    it("fails when email format is invalid", async () => {
      const res = await requestPasswordResetAction("invalid-email");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Please enter a valid email address.");
    });

    it("delegates to executePasswordResetRequest when valid", async () => {
      vi.mocked(executePasswordResetRequest).mockResolvedValue({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });

      const res = await requestPasswordResetAction("user@example.com");
      expect(res.success).toBe(true);
      expect(executePasswordResetRequest).toHaveBeenCalledWith("user@example.com");
    });
  });

  describe("resetPasswordAction", () => {
    it("validates token presence", async () => {
      const res = await resetPasswordAction("", "Password123", "Password123");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid or missing reset token.");
    });

    it("validates minimum password length of 8 characters", async () => {
      const res = await resetPasswordAction("tok", "1234567", "1234567");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Password must be at least 8 characters long.");
    });

    it("validates maximum password length of 72 characters", async () => {
      const longPass = "A".repeat(73);
      const res = await resetPasswordAction("tok", longPass, longPass);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Password cannot exceed 72 characters.");
    });

    it("validates matching confirmPassword", async () => {
      const res = await resetPasswordAction("tok", "Password123", "Different123");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Passwords do not match.");
    });

    it("delegates to executePasswordReset when valid", async () => {
      vi.mocked(executePasswordReset).mockResolvedValue({
        success: true,
        email: "user@example.com",
      });

      const res = await resetPasswordAction("tok-valid", "ValidPassword123", "ValidPassword123");
      expect(res.success).toBe(true);
      expect(executePasswordReset).toHaveBeenCalledWith("tok-valid", "ValidPassword123", "ValidPassword123");
    });
  });
});
