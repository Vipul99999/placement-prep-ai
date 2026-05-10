import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/prepPack";

export async function GET() {
  try {
    const session = await requireUserSession();
    const analytics = await getDashboardAnalytics(session.user.id);
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard analytics" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
