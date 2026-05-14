import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { releaseDetailedAnswerBudget, reserveDetailedAnswerBudget } from "@/lib/cost-controls";
import { generateDetailedAnswer } from "@/lib/gemini";
import { getDb } from "@/lib/mongodb";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { assertValidObjectId } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "question id");
    const session = await requireVerifiedUserSession();
    enforceSameOrigin(request);
    await enforceRateLimit(request, {
      key: "generate-detailed-answer",
      limit: 25,
      windowMs: 15 * 60 * 1000,
      userKey: session.user.id
    });
    const body = await parseJsonBody<{
      prepPackId: string;
      companyName: string;
      role: string;
      category: string;
    }>(request);
    assertValidObjectId(body.prepPackId, "prep pack id");

    const db = await getDb();
    const prepPack = await db.collection("prepPacks").findOne({
      _id: new ObjectId(body.prepPackId),
      userId: session.user.id
    });

    if (!prepPack) {
      return NextResponse.json({ error: "Prep pack not found" }, { status: 404 });
    }

    const question = await db.collection("questions").findOne({ _id: new ObjectId(id) });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.answerDetailed) {
      return NextResponse.json({ answerDetailed: question.answerDetailed });
    }

    await reserveDetailedAnswerBudget(session.user.id);
    let generated: Awaited<ReturnType<typeof generateDetailedAnswer>>;
    try {
      generated = await generateDetailedAnswer({
        question: question.question,
        answerShort: question.answerShort,
        category: body.category,
        role: body.role,
        companyName: body.companyName
      });
    } catch (error) {
      await releaseDetailedAnswerBudget(session.user.id);
      throw error;
    }

    await db.collection("questions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          answerDetailed: generated.answerDetailed,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(generated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate detailed answer" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Email verification required"
              ? 403
              : error instanceof Error && error.message.includes("Too many requests")
                ? 429
              : error instanceof Error && error.message.includes("Daily ")
                ? 429
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}
