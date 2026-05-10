import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { resetPasswordWithToken } from "@/lib/user";
import { validatePassword } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: "auth-reset-password", limit: 8, windowMs: 15 * 60 * 1000 });
    const body = await parseJsonBody<{
      token: string;
      password: string;
    }>(request);

    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    const password = validatePassword(body.password, "Password");
    await resetPasswordWithToken(token, password);

    await logAuditEvent({
      action: "password_reset_completed",
      entityType: "user",
      metadata: {
        tokenReset: true
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reset password" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message.includes("Too many requests")
            ? 429
            : error instanceof Error &&
                (error.message.includes("Password") || error.message.includes("Reset link"))
              ? 400
              : 500
      }
    );
  }
}
