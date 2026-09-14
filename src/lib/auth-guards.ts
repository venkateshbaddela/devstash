import { auth } from "@/auth";
import { getDefaultUserId } from "@/lib/db/collections";

/**
 * Resolves the current authenticated user's ID.
 *
 * Checks active session via NextAuth's `auth()`.
 * If no session is present or if called outside a Next.js HTTP request context
 * (e.g. tests or standalone scripts), falls back to the default demo user.
 *
 * Returns null if no user ID could be resolved.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Fallback when called outside of Next.js HTTP request context (e.g. testing or scripts)
  }

  const userId = session?.user?.id ?? (await getDefaultUserId());
  return userId ?? null;
}
