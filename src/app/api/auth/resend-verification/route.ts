import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const clientIp = await getClientIp(request);
    const rateLimit = await checkRateLimit(
      "resend-verification",
      `${clientIp}:${normalizedEmail}`
    );
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user does not exist, return a generic message to prevent account enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, a verification link has been sent." },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please sign in directly." },
        { status: 400 }
      );
    }

    // Generate new token & send email
    const verificationToken = await generateVerificationToken(user.email!);
    const mailResult = await sendVerificationEmail(user.email!, verificationToken.token);

    if (!mailResult.success) {
      console.warn("Failed to dispatch verification email:", mailResult.error);
    }

    return NextResponse.json(
      {
        message: "A new verification link has been sent to your email.",
        emailSent: mailResult.success,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resending verification email." },
      { status: 500 }
    );
  }
}
