"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export function RegisterForm() {

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    email: string;
    emailSent: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password.length > 72) {
      setErrorMessage("Password cannot exceed 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success: display verification instructions
      setSuccessData({
        email: trimmedEmail,
        emailSent: data?.emailSent ?? true,
      });
      setIsLoading(false);
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="w-full max-w-md mx-auto">
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
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification link to your email address
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Mail className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-foreground">{successData.email}</span>. Please click the link to activate your DevStash account.
          </p>

          <div className="pt-3 border-t border-border/40 text-left">
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Didn&apos;t receive the email? Check your spam folder or request a new link:
            </p>
            <ResendVerificationForm initialEmail={successData.email} />
          </div>

          <div className="pt-2">
            <Link
              href="/sign-in"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Start organizing your snippets, prompts, commands, and notes
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="name"
              className="text-xs font-medium text-foreground/90 block"
            >
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="e.g. Brad Traversy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="pl-9 h-10 bg-background/50 border-border/70 text-sm focus-visible:bg-background"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground/90 block"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
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

          {/* Password */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground/90 block"
            >
              Password (8-72 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                maxLength={72}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-9 pr-9 h-10 bg-background/50 border-border/70 text-sm focus-visible:bg-background"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium text-foreground/90 block"
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                maxLength={72}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="pl-9 pr-9 h-10 bg-background/50 border-border/70 text-sm focus-visible:bg-background"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
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
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </Button>
        </form>
      </div>

      {/* Link to Sign In */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline transition-all"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
