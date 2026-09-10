import * as React from "react";
import Link from "next/link";
import { Settings, Calendar, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { UserProfileData } from "@/lib/db/profile";

interface ProfileHeaderProps {
  user: UserProfileData;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  const authLabel =
    user.authMethod === "both"
      ? "GitHub & Password"
      : user.authMethod === "github"
      ? "GitHub OAuth"
      : "Email & Password";

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* User Identity */}
        <div className="flex items-center gap-5">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            size="lg"
            className="size-16 sm:size-20 text-xl border-2 border-border shadow-sm shrink-0"
          />

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {user.name}
              </h2>
              {user.isPro ? (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] tracking-wide uppercase px-2 py-0.5 font-semibold">
                  PRO Plan
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] tracking-wide uppercase px-2 py-0.5">
                  Free Tier
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{user.email}</p>

            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/60" />
                Member since {formattedDate}
              </span>
              <span className="text-border/60">•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground/60" />
                {authLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Link to Settings */}
        <div className="self-stretch sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <Link
            href="/settings"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2 text-xs w-full sm:w-auto cursor-pointer border-border hover:bg-muted font-medium",
            })}
          >
            <Settings className="size-3.5 text-muted-foreground" />
            <span>Account Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
