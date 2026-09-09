import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Layers, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { verifyToken, type VerifyTokenResult } from "@/lib/tokens";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = {
  title: "Verify Email — DevStash",
  description: "Verify your email address to access your DevStash account.",
};

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  let verificationResult: VerifyTokenResult | null = null;
  if (token) {
    verificationResult = await verifyToken(token);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[500px] rounded-full bg-gradient-to-t from-pink-500/10 via-purple-500/5 to-transparent blur-3xl" />

      <div className="w-full max-w-md mx-auto">
        {/* Header Branding */}
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
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 text-center">
          {/* Case 1: Verification Successful */}
          {verificationResult?.success && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-7" />
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Email Verified!
              </h1>
              <p className="text-sm text-muted-foreground">
                Your email address{" "}
                <span className="font-medium text-foreground">
                  {verificationResult.email}
                </span>{" "}
                has been successfully verified. You can now sign in to access your dashboard.
              </p>
              <div className="pt-2">
                <Link
                  href="/sign-in?verified=true"
                  className={buttonVariants({
                    className:
                      "w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm gap-2 flex items-center justify-center cursor-pointer",
                  })}
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Case 2: Verification Token Expired */}
          {verificationResult && !verificationResult.success && verificationResult.error === "TOKEN_EXPIRED" && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="size-7" />
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Verification Link Expired
              </h1>
              <p className="text-sm text-muted-foreground">
                This verification link has expired (links are valid for 24 hours). Enter your email below to receive a new link.
              </p>
              <div className="pt-2">
                <ResendVerificationForm />
              </div>
            </div>
          )}

          {/* Case 3: Invalid or Missing Token */}
          {verificationResult && !verificationResult.success && verificationResult.error !== "TOKEN_EXPIRED" && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="size-7" />
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Invalid Verification Link
              </h1>
              <p className="text-sm text-muted-foreground">
                This verification link is invalid or has already been used. Enter your email below to request a new verification link.
              </p>
              <div className="pt-2">
                <ResendVerificationForm />
              </div>
            </div>
          )}

          {/* Case 4: No token provided at all */}
          {!token && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="size-7" />
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your registered email address below to receive an account verification link.
              </p>
              <div className="pt-2">
                <ResendVerificationForm />
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border/40 text-center">
            <Link
              href="/sign-in"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
