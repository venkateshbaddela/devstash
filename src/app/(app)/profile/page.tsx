import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/profile";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";

export const metadata: Metadata = {
  title: "Profile — DevStash",
  description: "View and manage your DevStash account profile, usage statistics, and credentials.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userProfile = await getUserProfile(session.user.id);
  if (!userProfile) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your personal profile details, membership status, and knowledge hub usage statistics
        </p>
      </div>

      {/* User Info & Actions Card */}
      <ProfileHeader user={userProfile} />

      {/* Usage Stats & Item Type Breakdown */}
      <ProfileStats
        totalItems={userProfile.stats.totalItems}
        totalCollections={userProfile.stats.totalCollections}
        itemTypes={userProfile.stats.itemTypes}
      />
    </div>
  );
}
