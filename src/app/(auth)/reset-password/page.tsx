import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Layers, AlertCircle, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { verifyPasswordResetToken } from "@/lib/tokens";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — DevStash",
  description: "Set a new password for your DevStash account.",
};

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  let verificationResult = null;
  if (token) {
    verificationResult = await verifyPasswordResetToken(token);
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
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a new, secure password for your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 text-center">
          {/* Case 1: Valid Token -> Show Reset Form */}
          {token && verificationResult?.success && (
            <ResetPasswordForm
              token={token}
              email={verificationResult.email}
            />
          )}

          {/* Case 2: Token Expired */}
          {token &&
            verificationResult &&
            !verificationResult.success &&
            verificationResult.error === "TOKEN_EXPIRED" && (
              <div className="space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="size-7" />
                </div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Reset Link Expired
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This password reset link has expired (links are valid for 1 hour).
                  Please request a new reset link.
                </p>
                <div className="pt-2">
                  <Link
                    href="/forgot-password"
                    className={buttonVariants({
                      className:
                        "w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm gap-2 flex items-center justify-center cursor-pointer",
                    })}
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}

          {/* Case 3: Token Invalid or Not Found */}
          {token &&
            verificationResult &&
            !verificationResult.success &&
            verificationResult.error !== "TOKEN_EXPIRED" && (
              <div className="space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="size-7" />
                </div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Invalid Reset Link
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This password reset link is invalid or has already been used.
                  Please request a fresh reset link.
                </p>
                <div className="pt-2">
                  <Link
                    href="/forgot-password"
                    className={buttonVariants({
                      className:
                        "w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm gap-2 flex items-center justify-center cursor-pointer",
                    })}
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}

          {/* Case 4: No Token in Query */}
          {!token && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="size-7" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Missing Reset Token
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No password reset token was provided. Please follow the link sent to your email or request a new one below.
              </p>
              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className={buttonVariants({
                    className:
                      "w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm gap-2 flex items-center justify-center cursor-pointer",
                  })}
                >
                  <span>Request Reset Link</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border/40 text-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
