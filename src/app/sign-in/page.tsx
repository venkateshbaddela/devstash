import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — DevStash",
  description: "Sign in to your DevStash developer knowledge hub account.",
};

export default async function SignInPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  // If already logged in and there is no error in URL, redirect to dashboard
  if (session?.user && !searchParams?.error) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[500px] rounded-full bg-gradient-to-t from-pink-500/10 via-purple-500/5 to-transparent blur-3xl" />

      <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading sign-in...</div>}>
        <SignInForm />
      </React.Suspense>
    </div>
  );
}
