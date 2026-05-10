import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { updateUserProfile } from "@/lib/user";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "account-profile",
      limit: 20,
      windowMs: 10 * 60 * 1000,
      userKey: session.user.id
    });
    const body = await parseJsonBody<{ name: string }>(request);
    await updateUserProfile({
      userId: session.user.id,
      name: body.name
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "profile_updated",
      entityType: "user",
      entityId: session.user.id,
      metadata: {
        updatedField: "name"
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.includes("Too many requests")
              ? 429
              : error instanceof Error && error.message.includes("Name")
              ? 400
              : 500
      }
    );
  }
}
