import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { getUserPreferences, updateUserPreferences } from "@/lib/support";
import { validateUserPreferencesInput } from "@/lib/validators";

export async function GET() {
  try {
    const session = await requireUserSession();
    const preferences = await getUserPreferences(session.user.id);
    return NextResponse.json(preferences);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load preferences" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "account-preferences",
      limit: 20,
      windowMs: 10 * 60 * 1000,
      userKey: session.user.id
    });
    const body = validateUserPreferencesInput(await parseJsonBody(request));
    await updateUserPreferences({
      userId: session.user.id,
      ...body
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "preferences_updated",
      entityType: "userPreferences",
      entityId: session.user.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preferences" },
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

