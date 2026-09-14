import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      if (typeof token.picture === "string" && (token.picture.startsWith("data:") || token.picture.length > 2048)) {
        delete token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? "") as string;
        session.user.tokenVersion = typeof token.tokenVersion === "number" ? token.tokenVersion : 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
