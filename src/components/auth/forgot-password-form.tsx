"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordResetAction(trimmedEmail);
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setError(res.error || "Failed to send reset link. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* DevStash Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 mb-3 transition-transform hover:scale-105"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-purple-500/20 text-white">
            <Layers className="size-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">
            DevStash
          </span>
        </Link>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email address and we&apos;ll send you a password reset link
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        {isSubmitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>, we
                have sent password reset instructions.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-2">
                The link is valid for <strong>1 hour</strong>. Don&apos;t forget
                to check your spam folder.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="w-full h-10 border-border/80 bg-background/50 hover:bg-muted/80 text-foreground font-medium text-sm transition-all cursor-pointer"
              >
                Send to another email
              </Button>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>Return to sign in</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="reset-email"
                  className="text-xs font-medium text-foreground/90 block"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-10 bg-background/50 border-border/70 text-sm focus-visible:bg-background"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm mt-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/40 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Link to Register */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline transition-all"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
