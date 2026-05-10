import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    enforceSameOrigin(request);
    const { id } = await params;
    const body = await parseJsonBody<{ status?: "open" | "acknowledged" | "resolved" | "closed" }>(request);
    const status = ["open", "acknowledged", "resolved", "closed"].includes(body.status || "")
      ? (body.status as "open" | "acknowledged" | "resolved" | "closed")
      : "open";
    const db = await getDb();

    await db.collection<any>("securityAlerts").updateOne(
      { _id: id },
      {
        $set: {
          status,
          resolvedBy: session.user.email,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update alert" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")
            ? 403
            : 500
      }
    );
  }
}
