import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { deletePrepPackDeep } from "@/lib/privacy";
import { getPrepPackDetail } from "@/lib/prepPack";
import { enforceSameOrigin, getRequestGuardErrorStatus } from "@/lib/request-guards";
import { assertValidObjectId } from "@/lib/validators";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const pack = await getPrepPackDetail(id, session.user.id);

    if (!pack) {
      return NextResponse.json({ error: "Prep pack not found" }, { status: 404 });
    }

    return NextResponse.json(pack);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prep pack" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    enforceSameOrigin(request);
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    await deletePrepPackDeep(id, session.user.id);
    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "prep_pack_deleted",
      entityType: "prepPack",
      entityId: id,
      severity: "warning"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete prep pack" },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && (error.message.startsWith("Invalid ") || error.message === "Prep pack not found")
              ? 400
              : 500
      }
    );
  }
}
