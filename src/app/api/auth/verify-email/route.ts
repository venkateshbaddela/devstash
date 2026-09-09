import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await verifyToken(token);

    if (!result.success) {
      if (result.error === "TOKEN_EXPIRED") {
        return NextResponse.json(
          { error: "Verification token has expired. Please request a new one." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Email verified successfully. You can now sign in.",
        email: result.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await verifyToken(token);

    if (!result.success) {
      if (result.error === "TOKEN_EXPIRED") {
        return NextResponse.json(
          { error: "Verification token has expired. Please request a new one." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Email verified successfully. You can now sign in.",
        email: result.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}
