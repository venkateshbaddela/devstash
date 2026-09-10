import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

interface DangerZoneCardProps {
  userEmail: string;
}

export function DangerZoneCard({ userEmail }: DangerZoneCardProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8 space-y-6">
      <div className="border-b border-destructive/20 pb-5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4.5" />
          <h2 className="text-lg font-semibold tracking-tight">Danger Zone</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Irreversible actions for your personal account and stored developer data
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Delete Account</p>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Permanently remove your personal account, saved snippets, prompts, notes, commands,
            links, files, images, and custom collections. This action is immediate and cannot be undone.
          </p>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <DeleteAccountDialog userEmail={userEmail} />
        </div>
      </div>
    </div>
  );
}
