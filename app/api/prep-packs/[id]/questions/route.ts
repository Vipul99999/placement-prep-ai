import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { getPrepPackQuestions } from "@/lib/prepPack";
import { assertValidObjectId, parsePositiveInt } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const page = parsePositiveInt(searchParams.get("page"), 1, 1000);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);

    if (!category?.trim()) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const payload = await getPrepPackQuestions({
      prepPackId: id,
      userId: session.user.id,
      category,
      page,
      limit
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load questions" },
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
