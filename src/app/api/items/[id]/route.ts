import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemById } from "@/lib/db/items";
import { getDefaultUserId } from "@/lib/db/collections";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Fallback if called outside of Next.js HTTP request context (e.g. testing)
    }
    const userId = session?.user?.id ?? (await getDefaultUserId());

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const item = await getItemById(id.trim(), userId);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching item by id:", error);
    return NextResponse.json(
      { error: "Failed to fetch item details" },
      { status: 500 }
    );
  }
}
