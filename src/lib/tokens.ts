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
