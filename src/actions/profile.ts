"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Updates or removes the current user's profile avatar image.
 */
export async function updateAvatarAction(
  imageDataUrl: string | null
): Promise<ActionResult<{ image: string | null }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to update your avatar." };
    }

    if (imageDataUrl !== null) {
      // Validate image data URL prefix
      const isValidDataUrl = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(imageDataUrl);
      if (!isValidDataUrl) {
        return {
          success: false,
          error: "Invalid image format. Please upload a PNG, JPEG, WEBP, or GIF image.",
        };
      }

      // Max size check (~2MB binary is approx 2.8MB base64)
      if (imageDataUrl.length > 3 * 1024 * 1024) {
        return { success: false, error: "Image file size exceeds the 2MB limit." };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageDataUrl },
      select: { image: true },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { image: updatedUser.image },
      message: imageDataUrl ? "Avatar updated successfully." : "Avatar removed successfully.",
    };
  } catch (err) {
    console.error("updateAvatarAction error:", err);
    return { success: false, error: "Failed to update profile avatar." };
  }
}

export interface UpdateProfileDetailsResult {
  name: string;
  email: string;
  emailChanged: boolean;
}

/**
 * Updates the user's display name and/or email address.
 * If the email is modified on a credentials account, emailVerified is reset to null
 * and a verification email link is dispatched to the new email address.
 */
export async function updateProfileDetailsAction(
  name: string,
  email: string
): Promise<ActionResult<UpdateProfileDetailsResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to update your profile details." };
    }

    if (session.user.email?.toLowerCase() === "demo@devstash.io") {
      return {
        success: false,
        error: "The demo account profile details cannot be modified to preserve prototype integrity.",
      };
    }

    const trimmedName = (name ?? "").trim();
    if (!trimmedName || trimmedName.length > 60) {
      return { success: false, error: "Display name must be between 1 and 60 characters." };
    }

    const trimmedEmail = (email ?? "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!currentUser) {
      return { success: false, error: "User record not found." };
    }

    const isGithubOnly = currentUser.accounts.some((a) => a.provider === "github") && !currentUser.password;
    const currentEmail = (currentUser.email ?? "").toLowerCase();
    const isEmailChanging = trimmedEmail !== currentEmail;

    if (isEmailChanging && isGithubOnly) {
      return {
        success: false,
        error: "Your email address is managed by GitHub and cannot be modified here.",
      };
    }

    let emailChanged = false;

    if (isEmailChanging) {
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return { success: false, error: "This email address is already in use by another account." };
      }

      const verificationToken = await generateVerificationToken(trimmedEmail);
      await sendVerificationEmail(trimmedEmail, verificationToken.token);

      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: trimmedName,
          email: trimmedEmail,
          emailVerified: null,
        },
      });

      emailChanged = true;
    } else {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: trimmedName,
        },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: {
        name: trimmedName,
        email: trimmedEmail,
        emailChanged,
      },
      message: emailChanged
        ? "Profile updated! A verification link has been sent to your new email. Please verify to keep your account active."
        : "Profile details updated successfully.",
    };
  } catch (err) {
    console.error("updateProfileDetailsAction error:", err);
    return { success: false, error: "Failed to update profile details. Please try again." };
  }
}

/**
 * Updates display name only (Public Profile).
 */
export async function updateNameAction(
  name: string
): Promise<ActionResult<{ name: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to update your name." };
    }

    if (session.user.email?.toLowerCase() === "demo@devstash.io") {
      return {
        success: false,
        error: "The demo account name cannot be modified to preserve prototype integrity.",
      };
    }

    const trimmedName = (name ?? "").trim();
    if (!trimmedName || trimmedName.length > 60) {
      return { success: false, error: "Display name must be between 1 and 60 characters." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedName },
    });

    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { name: trimmedName },
      message: "Display name updated successfully.",
    };
  } catch (err) {
    console.error("updateNameAction error:", err);
    return { success: false, error: "Failed to update display name. Please try again." };
  }
}

/**
 * Updates primary email address with Option B verification token generation (Security & Credentials).
 */
export async function updateEmailAction(
  email: string
): Promise<ActionResult<{ email: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to update your email." };
    }

    if (session.user.email?.toLowerCase() === "demo@devstash.io") {
      return {
        success: false,
        error: "The demo account email cannot be modified to preserve prototype integrity.",
      };
    }

    const trimmedEmail = (email ?? "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!currentUser) {
      return { success: false, error: "User record not found." };
    }

    const isGithubOnly = currentUser.accounts.some((a) => a.provider === "github") && !currentUser.password;
    if (isGithubOnly) {
      return {
        success: false,
        error: "Your email address is managed by GitHub and cannot be modified here.",
      };
    }

    const currentEmail = (currentUser.email ?? "").toLowerCase();
    if (trimmedEmail === currentEmail) {
      return { success: false, error: "New email matches your current email address." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser && existingUser.id !== currentUser.id) {
      return { success: false, error: "This email address is already in use by another account." };
    }

    const verificationToken = await generateVerificationToken(trimmedEmail);
    await sendVerificationEmail(trimmedEmail, verificationToken.token);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: trimmedEmail,
        emailVerified: null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { email: trimmedEmail },
      message: "Email updated! A verification link has been sent to your new email. Please verify to keep your account active.",
    };
  } catch (err) {
    console.error("updateEmailAction error:", err);
    return { success: false, error: "Failed to update email address. Please try again." };
  }
}

/**
 * Changes password for credentials-based users after verifying their current password.
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to change your password." };
    }

    if (session.user.email?.toLowerCase() === "demo@devstash.io") {
      return {
        success: false,
        error: "The demo account password cannot be modified to preserve prototype integrity.",
      };
    }

    if (!currentPassword) {
      return { success: false, error: "Current password is required." };
    }

    if (!newPassword || typeof newPassword !== "string") {
      return { success: false, error: "New password is required." };
    }

    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "New passwords do not match." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "This account was created via GitHub OAuth and does not use a password.",
      };
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return { success: false, error: "The current password you entered is incorrect." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Your password has been changed successfully." };
  } catch (err) {
    console.error("changePasswordAction error:", err);
    return { success: false, error: "An unexpected error occurred while changing your password." };
  }
}

/**
 * Permanently deletes the user account and associated knowledge data.
 */
export async function deleteAccountAction(
  confirmEmail: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { success: false, error: "You must be signed in to delete your account." };
    }

    if (!confirmEmail || typeof confirmEmail !== "string") {
      return { success: false, error: "Confirmation email is required." };
    }

    // Safety guard against deleting the demo user
    if (session.user.email.toLowerCase() === "demo@devstash.io") {
      return {
        success: false,
        error: "The demo account cannot be deleted to preserve prototype integrity.",
      };
    }

    if (confirmEmail.trim().toLowerCase() !== session.user.email.toLowerCase()) {
      return {
        success: false,
        error: "Confirmation email does not match your current email address.",
      };
    }

    const userEmail = session.user.email.toLowerCase();
    const userId = session.user.id;

    // Delete user (Prisma cascade handles items, collections, tags, itemTypes, accounts, sessions)
    // and cleanup verification tokens for this user
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: {
          identifier: {
            in: [userEmail, `password-reset:${userEmail}`],
          },
        },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    // Sign out session cleanly without server-side throw
    await signOut({ redirect: false });

    return { success: true, message: "Your account has been deleted." };
  } catch (err) {
    console.error("deleteAccountAction error:", err);
    return { success: false, error: "Failed to delete account. Please try again." };
  }
}
