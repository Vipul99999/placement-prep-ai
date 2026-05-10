import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { sendEmailVerificationEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createEmailVerificationToken, getVerificationStatus } from "@/lib/user";
import { validateEmail } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, { key: "auth-resend-verification", limit: 5, windowMs: 15 * 60 * 1000 });
    const body = await parseJsonBody<{ email: string }>(request);
    const email = validateEmail(body.email || "");
    const status = await getVerificationStatus(email);

    if (status.exists && !status.emailVerified) {
      const verification = await createEmailVerificationToken(email);
      if (verification) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3008";
        await sendEmailVerificationEmail({
          to: verification.email,
          recipientName: verification.name,
          verificationLink: `${baseUrl}/verify-email?token=${verification.token}`
        });
      }
    }

    await logAuditEvent({
      actorEmail: email,
      action: "verification_email_requested",
      entityType: "user",
      metadata: {
        email,
        exists: status.exists,
        alreadyVerified: status.emailVerified
      }
    });

    return NextResponse.json({
      message: "If this account exists and is still unverified, a fresh verification email has been sent."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resend verification email" },
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
