"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface SidebarUserProfileProps {
  user?: SidebarUser;
}

export function SidebarUserProfile({ user }: SidebarUserProfileProps) {
  const currentUser = user ?? {
    name: "Demo User",
    email: "demo@devstash.io",
    avatarUrl: "",
  };

  const userInitials = React.useMemo(() => {
    if (!currentUser.name) return "DU";
    const parts = currentUser.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.name.slice(0, 2).toUpperCase();
  }, [currentUser.name]);

  return (
    <div className="p-3 border-t border-border/60 shrink-0 bg-sidebar/50">
      <div className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-8 bg-zinc-200 text-zinc-900 shrink-0">
            {currentUser.avatarUrl ? (
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            ) : null}
            <AvatarFallback className="bg-zinc-200 text-zinc-900 font-medium text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 text-left leading-tight">
            <span className="text-sm font-medium text-foreground truncate">
              {currentUser.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {currentUser.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Settings"
          type="button"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
