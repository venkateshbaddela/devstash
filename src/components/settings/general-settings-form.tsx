"use client";

import * as React from "react";
import { User, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarUploadDialog } from "@/components/profile/avatar-upload-dialog";
import { updateNameAction } from "@/actions/profile";
import type { UserProfileData } from "@/lib/db/profile";

interface GeneralSettingsFormProps {
  user: UserProfileData;
}

export function GeneralSettingsForm({ user }: GeneralSettingsFormProps) {
  const [name, setName] = React.useState(user.name);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const isDemoUser = user.email.toLowerCase() === "demo@devstash.io";
  const isDirty = name.trim() !== user.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || isDemoUser) return;

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await updateNameAction(name);
      if (res.success) {
        setSuccessMessage(res.message || "Display name updated successfully.");
      } else {
        setError(res.error || "Failed to update display name.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 backdrop-blur-sm space-y-6">
      {/* Card Header */}
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Public Profile
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your public avatar photo and display name across DevStash
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {isDemoUser && (
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-400">
          <Info className="size-4 shrink-0 mt-0.5" />
          <span>The demo account profile is locked to preserve prototype data.</span>
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex items-center gap-4 py-1">
        <div className="relative group">
          <AvatarUploadDialog
            currentImage={user.image}
            userName={user.name}
            userEmail={user.email}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">Profile Avatar</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Click on your avatar to upload a custom picture (PNG, JPEG, WEBP, max 2MB) or remove it
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="space-y-1.5 max-w-md">
          <label
            htmlFor="settings-name"
            className="text-xs font-medium text-foreground/90 flex items-center gap-1.5"
          >
            <User className="size-3.5 text-muted-foreground" />
            <span>Display Name</span>
          </label>
          <Input
            id="settings-name"
            name="name"
            type="text"
            required
            disabled={isLoading || isDemoUser}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="h-9 bg-background/50 border-border/70 text-xs"
          />
        </div>

        {/* Action Footer */}
        <div className="pt-2 flex items-center justify-start">
          <Button
            type="submit"
            disabled={!isDirty || isLoading || isDemoUser}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Name</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
