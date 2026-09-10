import { prisma } from "@/lib/prisma";
import { getSidebarItemTypes, type SidebarItemType } from "@/lib/db/items";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  isPro: boolean;
  hasPassword: boolean;
  authMethod: "github" | "credentials" | "both";
  stats: {
    totalItems: number;
    totalCollections: number;
    itemTypes: SidebarItemType[];
  };
}

/**
 * Fetches user profile data and complete usage statistics.
 */
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const [user, totalItems, totalCollections, itemTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        createdAt: true,
        isPro: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    }),
    prisma.item.count({
      where: { userId },
    }),
    prisma.collection.count({
      where: { userId },
    }),
    getSidebarItemTypes(userId),
  ]);

  if (!user) return null;

  const hasGithub = user.accounts.some((a) => a.provider === "github");
  const hasPassword = Boolean(user.password);
  let authMethod: "github" | "credentials" | "both" = "credentials";
  if (hasGithub && hasPassword) {
    authMethod = "both";
  } else if (hasGithub) {
    authMethod = "github";
  }

  return {
    id: user.id,
    name: user.name || "User",
    email: user.email || "",
    image: user.image,
    createdAt: user.createdAt,
    isPro: user.isPro,
    hasPassword,
    authMethod,
    stats: {
      totalItems,
      totalCollections,
      itemTypes,
    },
  };
}
