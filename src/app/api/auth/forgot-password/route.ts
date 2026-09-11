import { NextResponse } from "next/server";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { executePasswordResetRequest } from "@/lib/auth-core";

export async function POST(request: Request) {
  try {
    const clientIp = await getClientIp(request);
    const rateLimit = await checkRateLimit("forgot-password", clientIp);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = body;
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await executePasswordResetRequest(email);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process password reset request." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: result.message || "If an account exists with this email, a password reset link has been sent.",
        emailSent: result.emailSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
