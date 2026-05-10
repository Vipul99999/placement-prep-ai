import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { getPrepPackAnalytics } from "@/lib/prepPack";
import { assertValidObjectId } from "@/lib/validators";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const analytics = await getPrepPackAnalytics(id, session.user.id);
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}
