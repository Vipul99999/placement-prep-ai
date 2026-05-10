import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sendEmailChangeVerificationEmail } from "@/lib/email";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createEmailChangeToken } from "@/lib/user";
import { validateEmail } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    const body = await parseJsonBody<{ newEmail?: string }>(request);
    const newEmail = validateEmail(body.newEmail || "", "New email");
    const result = await createEmailChangeToken({
      userId: session.user.id,
      newEmail
    });
    const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3008";

    await sendEmailChangeVerificationEmail({
      to: result.newEmail,
      recipientName: result.name,
      verificationLink: `${baseUrl}/verify-email-change?token=${result.token}`
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "email_change_requested",
      entityType: "user",
      entityId: session.user.id,
      metadata: {
        newEmail: result.newEmail
      },
      severity: "warning"
    });

    return NextResponse.json({ ok: true, pendingEmail: result.newEmail });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to request email change" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && (error.message.includes("email") || error.message.includes("exists"))
              ? 400
              : 500
      }
    );
  }
}
