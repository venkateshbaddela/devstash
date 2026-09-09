import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Profile — DevStash",
  description: "View and manage your DevStash account profile.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  const user = session.user;

  const userName = user.name ?? "User";
  const userEmail = user.email ?? "";
  const userImage = user.image ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal account details and authentication preferences
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 backdrop-blur-sm space-y-6">
        {/* User Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <UserAvatar
            name={userName}
            email={userEmail}
            image={userImage}
            size="lg"
            className="size-16 text-lg border-2 border-border"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-foreground">
                {userName}
              </h2>
              <Badge variant="outline" className="text-[10px] tracking-wide uppercase px-2 py-0.5">
                Free Tier
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/20">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Display Name</p>
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/20">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/20">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Account Status</p>
              <p className="text-sm font-medium text-emerald-500">Active</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/20">
            <Shield className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Authentication</p>
              <p className="text-sm font-medium text-foreground truncate">
                {userImage ? "GitHub OAuth" : "Email & Password"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="border-t border-border/60 pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Session</p>
            <p className="text-xs text-muted-foreground">
              Sign out from this device to end your session
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
