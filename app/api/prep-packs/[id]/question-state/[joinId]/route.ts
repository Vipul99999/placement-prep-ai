import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { updatePrepPackQuestionState } from "@/lib/prepPack";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { assertValidObjectId, validateQuestionStateInput } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; joinId: string }> }
) {
  try {
    const { id, joinId } = await params;
    assertValidObjectId(id, "prep pack id");
    assertValidObjectId(joinId, "question state id");
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "question-state-update",
      limit: 180,
      windowMs: 10 * 60 * 1000,
      userKey: session.user.id
    });
    const payload = await parseJsonBody<{
      isBookmarked?: boolean;
      userNotes?: string;
      practiceStatus?: "not_started" | "learning" | "mastered";
      markReviewed?: boolean;
      feedback?: "helpful" | "irrelevant" | "too_easy" | "too_repetitive";
    }>(request);
    const body = validateQuestionStateInput(payload);

    await updatePrepPackQuestionState({
      prepPackId: id,
      joinId,
      userId: session.user.id,
      ...body
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "question_state_updated",
      entityType: "prepPackQuestion",
      entityId: joinId,
      metadata: body
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update question state" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            : error instanceof Error && error.message === "Unauthorized"
              ? 401
            : error instanceof Error && error.message.includes("Too many requests")
              ? 429
            : error instanceof Error && (error.message.startsWith("Invalid ") || error.message.includes("No valid fields"))
              ? 400
            : error instanceof Error && error.message === "Question state not found"
              ? 404
              : 500
      }
    );
  }
}
