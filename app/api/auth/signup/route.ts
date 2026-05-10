import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { sendEmailVerificationEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createEmailVerificationToken, createUser } from "@/lib/user";
import { validateEmail, validatePassword } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: "auth-signup", limit: 6, windowMs: 10 * 60 * 1000 });
    const body = await parseJsonBody<{
      name: string;
      email: string;
      password: string;
    }>(request);

    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const email = validateEmail(body.email);
    const password = validatePassword(body.password);

    const created = await createUser({
      ...body,
      email,
      password
    });
    const verification = await createEmailVerificationToken(email);
    const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3008";

    if (verification) {
      await sendEmailVerificationEmail({
        to: verification.email,
        recipientName: verification.name,
        verificationLink: `${baseUrl}/verify-email?token=${verification.token}`
      });
    }

    await logAuditEvent({
      actorUserId: created.userId,
      actorEmail: email,
      action: "user_signed_up",
      entityType: "user",
      entityId: created.userId
    });
    return NextResponse.json({ userId: created.userId, verificationSent: Boolean(verification) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create user" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message.includes("Too many requests")
            ? 429
            : error instanceof Error &&
                (error.message.includes("required")
                  || error.message.includes("Password")
                  || error.message.includes("Email")
                  || error.message.includes("exists"))
              ? 400
              : 500
      }
    );
  }
}
