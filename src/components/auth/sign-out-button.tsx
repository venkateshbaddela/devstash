"use client";

import * as React from "react";
import { handleSignOut } from "@/lib/auth-client";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const onSignOut = async () => {
    setIsLoading(true);
    await handleSignOut();
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onSignOut}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin mr-1.5" />
      ) : (
        <LogOut className="size-3.5 mr-1.5" />
      )}
      <span>Sign out</span>
    </Button>
  );
}
