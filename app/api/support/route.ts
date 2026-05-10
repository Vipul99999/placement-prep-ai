import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sendAlertNotification } from "@/lib/monitoring";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { createSupportTicket } from "@/lib/support";
import { validateSupportTicketInput } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "support-ticket-create",
      limit: 8,
      windowMs: 30 * 60 * 1000,
      userKey: session.user.id
    });
    const body = validateSupportTicketInput(await parseJsonBody(request));
    const ticketId = await createSupportTicket({
      userId: session.user.id,
      email: session.user.email || "",
      topic: body.topic,
      message: body.message
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "support_ticket_created",
      entityType: "supportTicket",
      entityId: ticketId,
      severity: "warning",
      metadata: {
        topic: body.topic
      }
    });

    await sendAlertNotification({
      title: `New support ticket: ${body.topic}`,
      severity: "info",
      kind: "support_ticket_created",
      metadata: {
        ticketId,
        actorEmail: session.user.email || ""
      }
    });

    return NextResponse.json({ ok: true, ticketId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit support request" },
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

