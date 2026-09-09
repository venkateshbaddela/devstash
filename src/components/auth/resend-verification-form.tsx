"use client";

import * as React from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendVerificationAction } from "@/actions/auth";

interface ResendVerificationFormProps {
  initialEmail?: string;
  className?: string;
}

export function ResendVerificationForm({
  initialEmail = "",
  className = "",
}: ResendVerificationFormProps) {
  const [email, setEmail] = React.useState(initialEmail);
  const [isLoading, setIsLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", message: "Please enter your email address." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await resendVerificationAction(trimmed);
      if (res.success) {
        setStatus({
          type: "success",
          message: res.message || "A verification link has been sent to your email.",
        });
      } else {
        setStatus({
          type: "error",
          message: res.error || "Failed to send verification link.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {status && (
        <div
          className={`mb-4 flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="pl-9 h-10 bg-background/50 border-border/70 text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              <span>Sending link...</span>
            </>
          ) : (
            <span>Resend Verification Link</span>
          )}
        </Button>
      </form>
    </div>
  );
}
