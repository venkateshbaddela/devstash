import type { User, Session, Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "@auth/core/adapters";
import { prisma } from "@/lib/prisma";

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

    if (typeof token.picture === "string" && (token.picture.startsWith("data:") || token.picture.length > 2048)) {
      delete token.picture;
    }

    return token;
  }

  // Defensively strip data URLs or oversized strings from token.picture to prevent JWT cookie bloat
  if (typeof token.picture === "string" && (token.picture.startsWith("data:") || token.picture.length > 2048)) {
    delete token.picture;
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

export async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}) {
  if (session.user) {
    session.user.id = (token.id ?? token.sub ?? "") as string;
    session.user.tokenVersion = typeof token.tokenVersion === "number" ? token.tokenVersion : 0;

    if (session.user.id) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { image: true, name: true, email: true },
        });

        if (dbUser) {
          session.user.image = dbUser.image;
          if (dbUser.name) session.user.name = dbUser.name;
          if (dbUser.email) session.user.email = dbUser.email;
        }
      } catch (err) {
        console.error("Error fetching user data in sessionCallback:", err);
      }
    }
  }
  return session;
}
