import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createPasswordResetToken } from "@/lib/user";
import { validateEmail } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: "auth-forgot-password", limit: 5, windowMs: 15 * 60 * 1000 });
    const body = await parseJsonBody<{ email: string }>(request);
    const email = validateEmail(body.email || "");

    const token = await createPasswordResetToken(email);
    const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3008";
    const resetLink = token ? `${baseUrl}/reset-password?token=${token}` : "";

    if (token) {
      await sendPasswordResetEmail({
        to: email,
        resetLink
      });
    }

    await logAuditEvent({
      actorEmail: email,
      action: "password_reset_requested",
      entityType: "user",
      metadata: {
        email,
        delivered: Boolean(token)
      }
    });

    return NextResponse.json({
      message: "If this email exists, a reset email has been sent."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process forgot password request" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message.includes("Too many requests")
            ? 429
            : error instanceof Error && error.message.includes("Email")
              ? 400
              : 500
      }
    );
  }
}
