"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "U";
}

export function UserAvatar({
  name,
  email,
  image,
  size = "default",
  className,
  ...props
}: UserAvatarProps) {
  const initials = React.useMemo(() => getInitials(name, email), [name, email]);

  return (
    <Avatar
      size={size}
      className={cn("shrink-0 bg-zinc-800 text-zinc-100 select-none", className)}
      {...props}
    >
      {image ? (
        <AvatarImage src={image} alt={name ?? email ?? "User avatar"} />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-semibold bg-zinc-800 text-zinc-100",
          size === "lg" ? "text-sm sm:text-base" : size === "sm" ? "text-[10px]" : "text-xs"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
