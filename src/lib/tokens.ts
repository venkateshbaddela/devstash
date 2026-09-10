import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRATION_HOURS = 24;

/**
 * Generate and store a new verification token for an email address.
 * Deletes any existing verification tokens for this email.
 */
export async function generateVerificationToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  // Remove existing tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: normalizedEmail,
    },
  });

  const verificationToken = await prisma.verificationToken.create({
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

export type VerifyTokenResult =
  | { success: true; email: string }
  | { success: false; error: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" };

/**
 * Validate a verification token, update the corresponding user's emailVerified status,
 * and remove the consumed token from the database.
 */
export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  const tokenRecord = await getVerificationTokenByToken(token);

  if (!tokenRecord) {
    return { success: false, error: "TOKEN_NOT_FOUND" };
  }

  const hasExpired = new Date(tokenRecord.expires) < new Date();
  if (hasExpired) {
    // Delete expired token to keep table clean
    await prisma.verificationToken.delete({
      where: { token },
    }).catch(() => null);
    return { success: false, error: "TOKEN_EXPIRED" };
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
 * Generate and store a new password reset token for an email address.
 * Deletes any existing password reset tokens for this email.
 * Password reset tokens expire in 1 hour.
 */
export async function generatePasswordResetToken(email: string) {
  const identifier = getPasswordResetIdentifier(email);
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  // Remove existing reset tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  const resetToken = await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return resetToken;
}

/**
 * Look up a password reset token record by its token string.
 * Ensures the token belongs to the password-reset namespace.
 */
export async function getPasswordResetTokenByToken(token: string) {
  try {
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
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
        where: { token },
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
        where: { token },
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
        // Proving ownership of email via reset token can also mark email as verified
        ...(!existingUser.emailVerified ? { emailVerified: new Date() } : {}),
      },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  return { success: true, email: existingUser.email! };
}

