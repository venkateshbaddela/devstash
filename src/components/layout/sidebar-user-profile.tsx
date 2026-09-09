"use client";

import * as React from "react";
import { User, LogOut, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { handleSignOut } from "@/lib/auth-client";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface SidebarUserProfileProps {
  user?: SidebarUser;
}

export function SidebarUserProfile({ user }: SidebarUserProfileProps) {
  const router = useRouter();

  const currentUser = user ?? {
    name: "Demo User",
    email: "demo@devstash.io",
    avatarUrl: undefined,
  };

  return (
    <div className="p-3 border-t border-border/60 shrink-0 bg-sidebar/50">
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="sidebar-user-trigger"
          className="w-full flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              name={currentUser.name}
              email={currentUser.email}
              image={currentUser.avatarUrl}
              size="default"
              className="size-8 text-xs shrink-0"
            />
            <div className="flex flex-col min-w-0 text-left leading-tight">
              <span className="text-sm font-medium text-foreground truncate">
                {currentUser.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-56 p-1 bg-popover border border-border/80 shadow-xl rounded-xl"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 px-2.5 py-2 text-sm text-foreground hover:bg-muted/60 rounded-md cursor-pointer transition-colors"
            >
              <User className="size-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md cursor-pointer transition-colors"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
