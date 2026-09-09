import { signOut } from "next-auth/react";

export async function handleSignOut() {
  try {
    await signOut({ callbackUrl: "/sign-in" });
  } catch (err) {
    console.error("Sign out error:", err);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/sign-in";
  }
}
