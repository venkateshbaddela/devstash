"use client";

import * as React from "react";
import { Shield, KeyRound, Laptop, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { updateEmailAction } from "@/actions/profile";
import type { UserProfileData } from "@/lib/db/profile";

interface SecurityCardProps {
  user: UserProfileData;
}

export function SecurityCard({ user }: SecurityCardProps) {
  const isDemoUser = user.email.toLowerCase() === "demo@devstash.io";
  const isOAuthOnly = user.authMethod === "github" && !user.hasPassword;

  const [email, setEmail] = React.useState(user.email);
  const [isLoadingEmail, setIsLoadingEmail] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = React.useState<string | null>(null);

  const isEmailDirty = !isOAuthOnly && email.trim().toLowerCase() !== user.email.toLowerCase();

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailDirty || isDemoUser) return;

    setEmailError(null);
    setEmailSuccess(null);
    setIsLoadingEmail(true);

    try {
      const res = await updateEmailAction(email);
      if (res.success) {
        setEmailSuccess(res.message || "Verification link sent to your new email address.");
      } else {
        setEmailError(res.error || "Failed to update email.");
      }
    } catch {
      setEmailError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const authLabel =
    user.authMethod === "both"
      ? "GitHub OAuth & Password"
      : user.authMethod === "github"
      ? "GitHub OAuth"
      : "Email & Password";

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Security & Authentication
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your login email, password, authentication providers, and active device sessions
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {/* 1. Authentication Provider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground">
              <Shield className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Authentication Method</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Identity provider configured for signing in to your account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto pl-12 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted border border-border/70 text-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              {authLabel}
            </span>
          </div>
        </div>

        {/* 2. Primary Email Address */}
        <div className="py-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Primary Login Email</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The email address associated with your DevStash account and notifications
                </p>
              </div>
            </div>

            {isOAuthOnly && (
              <span className="self-start sm:self-auto pl-12 sm:pl-0 inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/60">
                <ShieldCheck className="size-3 text-muted-foreground" />
                Managed via GitHub
              </span>
            )}
          </div>

          {emailError && (
            <div className="ml-0 sm:ml-12 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="ml-0 sm:ml-12 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{emailSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="ml-0 sm:ml-12 space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <Input
                id="security-email"
                name="email"
                type="email"
                required
                disabled={isLoadingEmail || isOAuthOnly || isDemoUser}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="h-9 bg-background/50 border-border/70 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {!isOAuthOnly && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isEmailDirty || isLoadingEmail || isDemoUser}
                  className="h-9 shrink-0 text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoadingEmail ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span>Update</span>
                  )}
                </Button>
              )}
            </div>
            {!isOAuthOnly && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Changing your email requires verification. A confirmation link will be sent to the new address.
              </p>
            )}
          </form>
        </div>

        {/* 3. Password Management */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground">
              <KeyRound className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Account Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.hasPassword
                  ? "Ensure your account is protected with a secure password"
                  : "Signed in via GitHub OAuth. No password is required for this account."}
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto pl-12 sm:pl-0">
            {user.hasPassword ? (
              <ChangePasswordDialog isDemoUser={isDemoUser} />
            ) : (
              <span className="text-xs text-muted-foreground italic">OAuth Managed</span>
            )}
          </div>
        </div>

        {/* 4. Active Session & Sign Out */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 last:pb-0">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground">
              <Laptop className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Active Session</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently signed in to DevStash on this browser and device
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto pl-12 sm:pl-0">
            <SignOutButton variant="destructive" />
          </div>
        </div>
      </div>
    </div>
  );
}
