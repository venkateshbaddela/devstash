import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  generatePasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

/**
 * Core business logic for initiating a password reset request.
 * Not exposed as a Server Action directly to prevent client-side bypass flags.
 */
export async function executePasswordResetRequest(email: string) {
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
    console.error("executePasswordResetRequest error:", err);
    return { success: false, error: "Failed to process password reset request." };
  }
}

/**
 * Core business logic for validating and completing a password reset.
 * Not exposed as a Server Action directly to prevent client-side bypass flags.
 */
export async function executePasswordReset(
  token: string,
  password: string,
  confirmPassword: string
) {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: "Invalid or missing reset token." };
    }

    if (!password) {
      return { success: false, error: "Please enter a new password." };
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    if (password.length > 72) {
      return { success: false, error: "Password cannot exceed 72 characters." };
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    // Hash the new password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atomically consume token and update password
    const result = await consumePasswordResetToken(token.trim(), hashedPassword);

    if (!result.success) {
      if (result.error === "TOKEN_EXPIRED") {
        return {
          success: false,
          error: "This reset link has expired. Please request a new password reset.",
        };
      }
      return {
        success: false,
        error: "Invalid or already used reset link. Please request a new one.",
      };
    }

    return {
      success: true,
      email: result.email,
    };
  } catch (err) {
    console.error("executePasswordReset error:", err);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
