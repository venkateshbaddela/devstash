"use server";

import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, verifyToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export async function resendVerificationAction(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: "This email address is already verified. Please sign in directly.",
      };
    }

    const token = await generateVerificationToken(user.email!);
    const mailResult = await sendVerificationEmail(user.email!, token.token);

    return {
      success: true,
      message: "Verification link sent. Please check your email.",
      emailSent: mailResult.success,
    };
  } catch (err) {
    console.error("resendVerificationAction error:", err);
    return { success: false, error: "Failed to resend verification link." };
  }
}

export async function verifyEmailAction(token: string) {
  try {
    const result = await verifyToken(token);
    if (!result.success) {
      if (result.error === "TOKEN_EXPIRED") {
        return {
          success: false,
          error: "This verification link has expired. Please request a new one.",
        };
      }
      return { success: false, error: "Invalid or consumed verification link." };
    }
    return { success: true, email: result.email };
  } catch (err) {
    console.error("verifyEmailAction error:", err);
    return { success: false, error: "An unexpected error occurred during verification." };
  }
}
