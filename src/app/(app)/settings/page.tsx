import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/profile";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { SecurityCard } from "@/components/settings/security-card";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account Settings — DevStash",
  description: "Manage your personal profile details, authentication credentials, and account settings.",
};

export default async function SettingsPage() {
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
      {/* Top Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Link
            href="/profile"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "h-7 px-2 -ml-2 text-xs text-muted-foreground hover:text-foreground font-normal gap-1",
            })}
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Profile</span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile details, authentication credentials, and security preferences
        </p>
      </div>

      {/* 1. Public Profile Form (Avatar & Display Name) */}
      <GeneralSettingsForm user={userProfile} />

      {/* 2. Security & Authentication Card (Auth Method, Email, Password, Sessions) */}
      <SecurityCard user={userProfile} />

      {/* 3. Danger Zone Card (Delete Account) */}
      <DangerZoneCard userEmail={userProfile.email} />
    </div>
  );
}
