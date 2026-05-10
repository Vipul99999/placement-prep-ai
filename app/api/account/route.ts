import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { deleteUserAccountDeep } from "@/lib/privacy";
import { enforceSameOrigin, getRequestGuardErrorStatus } from "@/lib/request-guards";

export async function DELETE(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    const session = await requireUserSession();
    await deleteUserAccountDeep(session.user.id);
    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "user_account_deleted",
      entityType: "user",
      entityId: session.user.id,
      severity: "warning"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            : error instanceof Error && error.message === "Unauthorized"
              ? 401
              : 500
      }
    );
  }
}
