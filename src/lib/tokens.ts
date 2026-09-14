import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const TOKEN_EXPIRATION_HOURS = 24;

/**
 * Generate and store a new verification token for an email address.
 * Deletes any existing verification tokens for this email.
 * Optionally accepts a Prisma transaction client for atomic execution.
 */
export async function generateVerificationToken(
  email: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  // Remove existing tokens for this identifier
  await db.verificationToken.deleteMany({
    where: {
      identifier: normalizedEmail,
    },
  });

  const verificationToken = await db.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  return verificationToken;
}

/**
 * Look up a verification token record by its token string.
 */
export async function getVerificationTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });
    return verificationToken;
  } catch {
    return null;
  }
}

/**
 * Look up a verification token record by the user's email identifier.
 */
export async function getVerificationTokenByEmail(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: normalizedEmail },
    });
    return verificationToken;
  } catch {
    return null;
  }
}

export const EMAIL_CHANGE_PREFIX = "email-change:";

export function getEmailChangeIdentifier(userId: string, newEmail: string): string {
  return `${EMAIL_CHANGE_PREFIX}${userId}:${newEmail.trim().toLowerCase()}`;
}

export function parseEmailChangeIdentifier(
  identifier: string
): { userId: string; newEmail: string } | null {
  if (!identifier.startsWith(EMAIL_CHANGE_PREFIX)) {
    return null;
  }
  const rest = identifier.slice(EMAIL_CHANGE_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  const userId = rest.slice(0, colonIdx);
  const newEmail = rest.slice(colonIdx + 1);
  if (!userId || !newEmail) return null;
  return { userId, newEmail };
}

/**
 * Generate and store a new email change verification token for an authenticated user.
 * Deletes any existing pending email change tokens for this user.
 */
export async function generateEmailChangeToken(
  userId: string,
  newEmail: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const identifier = getEmailChangeIdentifier(userId, newEmail);
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  // Remove any existing pending email change tokens for this user
  await db.verificationToken.deleteMany({
    where: {
      identifier: {
        startsWith: `${EMAIL_CHANGE_PREFIX}${userId}:`,
      },
    },
  });

  const verificationToken = await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return verificationToken;
}

export type VerifyTokenResult =
  | { success: true; email: string; isEmailChange?: boolean }
  | {
      success: false;
      error: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" | "EMAIL_ALREADY_IN_USE";
    };

/**
 * Validate a verification token, update the corresponding user's email / emailVerified status,
 * and remove the consumed token from the database.
 */
export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  const tokenRecord = await getVerificationTokenByToken(token);

  if (!tokenRecord) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const hasExpired = new Date(tokenRecord.expires) < new Date();
  if (hasExpired) {
    try {
      await prisma.verificationToken.delete({
        where: { token },
      });
    } catch {
      // Delete expired token to keep table clean
    }
    return { success: false, error: "TOKEN_EXPIRED" };
  }

  // Handle email change verification
  const emailChangeInfo = parseEmailChangeIdentifier(tokenRecord.identifier);
  if (emailChangeInfo) {
    const { userId, newEmail } = emailChangeInfo;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "USER_NOT_FOUND" };
    }

    // Ensure the new email hasn't been claimed by another account in the meantime
    const emailClaimed = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (emailClaimed && emailClaimed.id !== userId) {
      try {
        await prisma.verificationToken.delete({
          where: { token },
        });
      } catch {
        // Ignore deletion error
      }
      return { success: false, error: "EMAIL_ALREADY_IN_USE" };
    }

    // Atomically update user email and emailVerified, and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          emailVerified: new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return { success: true, email: newEmail, isEmailChange: true };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: tokenRecord.identifier },
  });

  if (!existingUser) {
    return { success: false, error: "USER_NOT_FOUND" };
  }

  // Update user emailVerified and delete the used token in transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  return { success: true, email: existingUser.email! };
}

// -----------------------------------------------------------------------------
// Password Reset Token Management
// -----------------------------------------------------------------------------

const PASSWORD_RESET_PREFIX = "password-reset:";
const RESET_TOKEN_EXPIRATION_HOURS = 1;

export function getPasswordResetIdentifier(email: string): string {
  return `${PASSWORD_RESET_PREFIX}${email.trim().toLowerCase()}`;
}

export function extractEmailFromResetIdentifier(identifier: string): string | null {
  if (identifier.startsWith(PASSWORD_RESET_PREFIX)) {
    return identifier.slice(PASSWORD_RESET_PREFIX.length);
  }
  return null;
}

/**
 * Computes a SHA-256 hexadecimal hash of a raw token string.
 * Used to ensure bearer reset tokens are never stored in plaintext in the database.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Generate and store a new password reset token for an email address.
 * Deletes any existing password reset tokens for this email.
 * Password reset tokens expire in 1 hour.
 * Stores a SHA-256 hash in the database while returning the plaintext token for email delivery.
 */
export async function generatePasswordResetToken(email: string) {
  const identifier = getPasswordResetIdentifier(email);
  const rawToken = crypto.randomUUID();
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  // Remove existing reset tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  // Return raw plaintext token for email dispatch
  return {
    token: rawToken,
    identifier,
    expires,
  };
}

/**
 * Look up a password reset token record by its plaintext token string.
 * Computes SHA-256 hash of the input and checks verification_tokens table.
 * Ensures the token belongs to the password-reset namespace.
 */
export async function getPasswordResetTokenByToken(token: string) {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const hashedToken = hashToken(token);
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!tokenRecord || !tokenRecord.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
      return null;
    }

    return tokenRecord;
  } catch {
    return null;
  }
}

export type VerifyPasswordResetTokenResult =
  | { success: true; email: string }
  | { success: false; error: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" };

/**
 * Verify whether a password reset token is valid and active without consuming it.
 * Used for route validation when loading the reset password page.
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<VerifyPasswordResetTokenResult> {
  const tokenRecord = await getPasswordResetTokenByToken(token);

  if (!tokenRecord) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const hasExpired = new Date(tokenRecord.expires) < new Date();
  if (hasExpired) {
    await prisma.verificationToken
      .delete({
        where: { token: tokenRecord.token },
      })
      .catch(() => null);
    return { success: false, error: "TOKEN_EXPIRED" };
  }

  const email = extractEmailFromResetIdentifier(tokenRecord.identifier);
  if (!email) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return { success: false, error: "USER_NOT_FOUND" };
  }

  return { success: true, email: existingUser.email! };
}

export type ConsumePasswordResetTokenResult =
  | { success: true; email: string }
  | { success: false; error: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" };

/**
 * Consume a password reset token and update the user's password atomically.
 * Also marks the user's email as verified if it wasn't already.
 */
export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string
): Promise<ConsumePasswordResetTokenResult> {
  const tokenRecord = await getPasswordResetTokenByToken(token);

  if (!tokenRecord) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const hasExpired = new Date(tokenRecord.expires) < new Date();
  if (hasExpired) {
    await prisma.verificationToken
      .delete({
        where: { token: tokenRecord.token },
      })
      .catch(() => null);
    return { success: false, error: "TOKEN_EXPIRED" };
  }

  const email = extractEmailFromResetIdentifier(tokenRecord.identifier);
  if (!email) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return { success: false, error: "USER_NOT_FOUND" };
  }

  // Update password and delete the token in a single transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: newPasswordHash,
        tokenVersion: { increment: 1 },
        // Proving ownership of email via reset token can also mark email as verified
        ...(!existingUser.emailVerified ? { emailVerified: new Date() } : {}),
      },
    }),
    prisma.verificationToken.delete({
      where: { token: tokenRecord.token },
    }),
  ]);

  return { success: true, email: existingUser.email! };
}

