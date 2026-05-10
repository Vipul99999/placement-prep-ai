import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { getMockInterviewQuestions, saveMockInterviewRating } from "@/lib/prepPack";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { assertValidObjectId, parsePositiveInt } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const count = parsePositiveInt(request.nextUrl.searchParams.get("count"), 5, 10);
    const items = await getMockInterviewQuestions(id, session.user.id, count);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load mock interview" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    enforceSameOrigin(request);
    const body = await parseJsonBody<{
      questionId?: string;
      rating?: "needs-work" | "okay" | "strong";
    }>(request);

    if (!body.questionId || !body.rating) {
      return NextResponse.json({ error: "Question id and rating are required" }, { status: 400 });
    }

    await saveMockInterviewRating({
      prepPackId: id,
      userId: session.user.id,
      questionId: body.questionId,
      rating: body.rating
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save mock interview rating" },
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
