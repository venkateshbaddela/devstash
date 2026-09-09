import * as React from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — DevStash",
  description: "Create a new DevStash developer account.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 size-[500px] rounded-full bg-gradient-to-t from-pink-500/10 via-purple-500/5 to-transparent blur-3xl" />

      <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <RegisterForm />
      </React.Suspense>
    </div>
  );
}
