"use server";

import bcrypt from "bcryptjs";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationToken,
  verifyToken,
  generatePasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";

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

export async function requestPasswordResetAction(email: string) {
  try {
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: "Please enter your email address." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Generic response to prevent email enumeration
    if (!user || !user.email) {
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      };
    }

    const token = await generatePasswordResetToken(user.email);
    const mailResult = await sendPasswordResetEmail(user.email, token.token);

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
      emailSent: mailResult.success,
    };
  } catch (err) {
    console.error("requestPasswordResetAction error:", err);
    return { success: false, error: "Failed to process password reset request." };
  }
}

export async function resetPasswordAction(
  token: string,
  password: string,
  confirmPassword: string
) {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: "Invalid or missing reset token." };
    }

    if (!password || typeof password !== "string") {
      return { success: false, error: "Password is required." };
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await consumePasswordResetToken(token.trim(), hashedPassword);

    if (!result.success) {
      if (result.error === "TOKEN_EXPIRED") {
        return {
          success: false,
          error: "This password reset link has expired. Please request a new one.",
        };
      }
      return {
        success: false,
        error: "This password reset link is invalid or has already been used.",
      };
    }

    return { success: true, email: result.email };
  } catch (err) {
    console.error("resetPasswordAction error:", err);
    return { success: false, error: "An unexpected error occurred while resetting your password." };
  }
}

