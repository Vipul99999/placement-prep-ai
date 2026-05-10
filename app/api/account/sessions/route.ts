import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { listUserSessions, registerUserSession, revokeUserSession } from "@/lib/user";

export async function GET() {
  try {
    const session = await requireUserSession();
    const sessions = await listUserSessions(session.user.id, session.user.sessionId);
    return NextResponse.json({ items: sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load sessions" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    if (!session.user.sessionId) {
      return NextResponse.json({ error: "Session unavailable" }, { status: 400 });
    }

    const body = await parseJsonBody<{ userAgent?: string }>(request);
    await registerUserSession({
      userId: session.user.id,
      sessionId: session.user.sessionId,
      userAgent: body.userAgent?.trim() || request.headers.get("user-agent") || "Unknown browser"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register session" },
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    const body = await parseJsonBody<{ sessionId?: string }>(request);
    if (!body.sessionId?.trim()) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
    }

    await revokeUserSession({
      userId: session.user.id,
      sessionId: body.sessionId.trim()
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "session_revoked",
      entityType: "userSession",
      entityId: body.sessionId.trim(),
      severity: "warning"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke session" },
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
