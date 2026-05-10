import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { changeUserPassword } from "@/lib/user";
import { validatePassword } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "account-change-password",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      userKey: session.user.id
    });
    const body = await parseJsonBody<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>(request);

    const currentPassword = body.currentPassword?.trim();
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const newPassword = validatePassword(body.newPassword, "New password");

    if (newPassword !== body.confirmPassword?.trim()) {
      return NextResponse.json({ error: "New password and confirm password must match" }, { status: 400 });
    }

    await changeUserPassword({
      userId: session.user.id,
      currentPassword,
      newPassword
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "password_changed",
      entityType: "user",
      entityId: session.user.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to change password" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.includes("Too many requests")
              ? 429
              : error instanceof Error && error.message.includes("password")
              ? 400
              : 500
      }
    );
  }
}
