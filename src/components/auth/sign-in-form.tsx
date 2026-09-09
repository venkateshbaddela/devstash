"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Layers, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/dashboard";
  const registered = searchParams.get("registered") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = React.useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = React.useState(false);

  const urlErrorMessage = React.useMemo(() => {
    if (!urlError) return null;
    if (urlError === "OAuthAccountNotLinked") {
      return "This GitHub account is already associated with another account, or you are already logged in as a different user. Please sign out first before connecting this GitHub account.";
    }
    if (urlError === "CredentialsSignin") {
      return "Invalid email or password. Please try again.";
    }
    return "An authentication error occurred. Please try again.";
  }, [urlError]);

  const displayError = formError || urlErrorMessage;

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    setIsLoadingCredentials(true);
    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setFormError("Invalid email or password. Please check your credentials.");
        setIsLoadingCredentials(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      setIsLoadingCredentials(false);
    }
  };

  const handleGithubSignIn = async () => {
    setFormError(null);
    setIsLoadingGithub(true);
    try {
      await signIn("github", { callbackUrl });
    } catch {
      setFormError("Failed to initiate GitHub sign-in.");
      setIsLoadingGithub(false);
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
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to access your developer hub and collections
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        {/* Success Alert (from register redirect) */}
        {registered && !displayError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>Account created successfully! Please sign in with your email and password.</span>
          </div>
        )}

        {/* Error Alert */}
        {displayError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        {/* GitHub OAuth Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGithubSignIn}
          disabled={isLoadingGithub || isLoadingCredentials}
          className="w-full h-10 border-border/80 bg-background/50 hover:bg-muted/80 text-foreground font-medium text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          {isLoadingGithub ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <GithubIcon className="size-4 fill-current" />
          )}
          <span>Continue with GitHub</span>
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign in with email
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                disabled={isLoadingCredentials || isLoadingGithub}
                className="pl-9 h-10 bg-background/50 border-border/70 text-sm focus-visible:bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-foreground/90 block"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoadingCredentials || isLoadingGithub}
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

          <Button
            type="submit"
            disabled={isLoadingCredentials || isLoadingGithub}
            className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm mt-2 transition-all cursor-pointer"
          >
            {isLoadingCredentials ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </Button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-5 pt-4 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            Demo credentials:{" "}
            <span className="font-mono text-foreground/90 bg-muted/50 px-1 py-0.5 rounded">
              demo@devstash.io
            </span>{" "}
            /{" "}
            <span className="font-mono text-foreground/90 bg-muted/50 px-1 py-0.5 rounded">
              12345678
            </span>
          </p>
        </div>
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
