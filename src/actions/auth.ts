"use server";

import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, verifyToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  executePasswordResetRequest,
  executePasswordReset,
} from "@/lib/auth-core";
import {
  validateResetEmail,
  validateResetPassword,
} from "@/lib/validations/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export async function resendVerificationAction(email: string) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: "Please enter your email address." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const clientIp = await getClientIp();
    const rateLimit = await checkRateLimit(
      "resend-verification",
      `${clientIp}:${normalizedEmail}`
    );
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.errorMessage };
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Return generic message if user does not exist or is already verified to prevent account enumeration
    if (!user || user.emailVerified) {
      return {
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      };
    }

    const token = await generateVerificationToken(user.email!);
    const mailResult = await sendVerificationEmail(user.email!, token.token);

    return {
      success: true,
      message: "If an account exists with this email, a verification link has been sent.",
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
      if (result.error === "EMAIL_ALREADY_IN_USE") {
        return {
          success: false,
          error: "This email address is already in use by another account.",
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
    const validation = validateResetEmail(email);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const clientIp = await getClientIp();
    const rateLimit = await checkRateLimit("forgot-password", clientIp);
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.errorMessage };
    }

    return await executePasswordResetRequest(validation.email);
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

    const validation = validateResetPassword(password, confirmPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const clientIp = await getClientIp();
    const rateLimit = await checkRateLimit("reset-password", clientIp);
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.errorMessage };
    }

    return await executePasswordReset(token, password, confirmPassword);
  } catch (err) {
    console.error("resetPasswordAction error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while resetting your password.",
    };
  }
}

