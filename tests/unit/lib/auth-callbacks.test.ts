import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtCallback, sessionCallback } from "@/lib/auth-callbacks";
import { prisma } from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Auth Callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("jwtCallback", () => {
    it("sets id and tokenVersion when user is provided on sign in", async () => {
      const token: JWT = {};
      const user: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        tokenVersion: 2,
      };

      const result = await jwtCallback({ token, user });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-123");
      expect(result?.tokenVersion).toBe(2);
    });

    it("defensively removes data URL token.picture to prevent cookie bloat", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
        picture: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        tokenVersion: 1,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const result = await jwtCallback({ token });

      expect(result).not.toBeNull();
      expect(result?.picture).toBeUndefined();
    });

    it("defensively removes oversized token.picture strings (> 2048 chars)", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
        picture: "https://example.com/avatar/" + "a".repeat(2100),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        tokenVersion: 1,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const result = await jwtCallback({ token });

      expect(result).not.toBeNull();
      expect(result?.picture).toBeUndefined();
    });

    it("preserves standard external HTTPS URLs in token.picture", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
        picture: "https://avatars.githubusercontent.com/u/1234567?v=4",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        tokenVersion: 1,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const result = await jwtCallback({ token });

      expect(result).not.toBeNull();
      expect(result?.picture).toBe("https://avatars.githubusercontent.com/u/1234567?v=4");
    });

    it("invalidates token when tokenVersion does not match database", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        tokenVersion: 2,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const result = await jwtCallback({ token });

      expect(result).toBeNull();
    });
  });

  describe("sessionCallback", () => {
    it("populates session user from database rather than relying solely on token", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
      };
      const session: Session = {
        user: {
          id: "",
          email: "old@example.com",
          name: "Old Name",
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        name: "Fresh Name",
        email: "fresh@example.com",
        image: "data:image/png;base64,freshavatar",
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const result = await sessionCallback({ session, token });

      expect(result.user.id).toBe("user-123");
      expect(result.user.tokenVersion).toBe(1);
      expect(result.user.name).toBe("Fresh Name");
      expect(result.user.email).toBe("fresh@example.com");
      expect(result.user.image).toBe("data:image/png;base64,freshavatar");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: { image: true, name: true, email: true },
      });
    });

    it("handles database errors gracefully without throwing", async () => {
      const token: JWT = {
        id: "user-123",
        tokenVersion: 1,
      };
      const session: Session = {
        user: {
          id: "",
          email: "fallback@example.com",
          name: "Fallback User",
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB connection timeout"));

      const result = await sessionCallback({ session, token });

      expect(result.user.id).toBe("user-123");
      expect(result.user.name).toBe("Fallback User");
      expect(result.user.email).toBe("fallback@example.com");
    });
  });
});
