import NextAuth, { CredentialsSignin, type User, type Account, type Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import authConfig from "./auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class RateLimitError extends CredentialsSignin {
  code = "rate_limited";
}

export async function jwtCallback({
  token,
  user,
}: {
  token: JWT;
  user?: User | AdapterUser;
  account?: Account | null;
  profile?: Profile;
  trigger?: "signIn" | "signUp" | "update";
  isNewUser?: boolean;
  session?: unknown;
}) {
  if (user) {
    token.id = user.id;
    const tokenVersion = (user as User).tokenVersion;
    if (typeof tokenVersion === "number") {
      token.tokenVersion = tokenVersion;
    } else if (user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { tokenVersion: true },
      });
      token.tokenVersion = dbUser?.tokenVersion ?? 0;
    } else {
      token.tokenVersion = 0;
    }
    return token;
  }

  // Invalidate JWT session if user does not exist or tokenVersion does not match
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { tokenVersion: true },
    });

    if (!dbUser || dbUser.tokenVersion !== (token.tokenVersion ?? 0)) {
      return null;
    }
  }

  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers.filter(
      (provider) => (provider as { id?: string }).id !== "credentials"
    ),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Check credentials login rate limits:
        // 1. Global IP-level limit against password spraying (30 attempts / 15 min)
        // 2. Account-level limit against targeted brute force (5 attempts / 15 min by IP + email)
        const clientIp = await getClientIp(request as Request | undefined);
        const ipRateLimit = await checkRateLimit("login-ip", clientIp);
        if (!ipRateLimit.success) {
          throw new RateLimitError();
        }

        const rateLimit = await checkRateLimit("login", `${clientIp}:${email}`);
        if (!rateLimit.success) {
          throw new RateLimitError();
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: jwtCallback,
  },
});
