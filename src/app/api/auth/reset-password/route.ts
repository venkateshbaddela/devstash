import { NextResponse } from "next/server";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { executePasswordReset } from "@/lib/auth-core";

export async function POST(request: Request) {
  try {
    const clientIp = await getClientIp(request);
    const rateLimit = await checkRateLimit("reset-password", clientIp);
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

    const { token, password, confirmPassword } = body;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    const result = await executePasswordReset(token, password, confirmPassword);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Password reset successfully. You can now sign in.",
        email: result.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
