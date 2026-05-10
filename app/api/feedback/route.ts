import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createProductFeedback } from "@/lib/support";
import { validateFeedbackInput } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "product-feedback-create",
      limit: 12,
      windowMs: 30 * 60 * 1000,
      userKey: session.user.id
    });
    const body = validateFeedbackInput(await parseJsonBody(request));
    const feedbackId = await createProductFeedback({
      userId: session.user.id,
      email: session.user.email || "",
      area: body.area,
      sentiment: body.sentiment,
      message: body.message
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "product_feedback_created",
      entityType: "productFeedback",
      entityId: feedbackId,
      metadata: {
        area: body.area,
        sentiment: body.sentiment
      }
    });

    return NextResponse.json({ ok: true, feedbackId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit feedback" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            : error instanceof Error && error.message === "Unauthorized"
              ? 401
              : error instanceof Error && error.message.includes("Too many requests")
                ? 429
                : 400
      }
    );
  }
}

