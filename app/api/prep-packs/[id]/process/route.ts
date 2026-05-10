import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { processPrepPackGenerationJobs } from "@/lib/prepPack";
import { enforceSameOrigin, getRequestGuardErrorStatus } from "@/lib/request-guards";
import { assertValidObjectId } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    enforceSameOrigin(request);
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireVerifiedUserSession();
    const generationSummary = await processPrepPackGenerationJobs({
      prepPackId: id,
      userId: session.user.id,
      limit: 3
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "prep_pack_generation_processed",
      entityType: "prepPack",
      entityId: id,
      metadata: {
        jobsTouched: generationSummary.length
      }
    });

    return NextResponse.json({ ok: true, generationSummary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process generation queue" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Email verification required"
              ? 403
              : error instanceof Error && (error.message.startsWith("Invalid ") || error.message === "Prep pack not found")
                ? 400
                : 500
      }
    );
  }
}
