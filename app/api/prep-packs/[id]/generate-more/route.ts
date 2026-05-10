import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getDb } from "@/lib/mongodb";
import { processPrepPackGenerationJobs, queueCategoryGenerationJob } from "@/lib/prepPack";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { assertValidObjectId, validateGenerationInput } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireVerifiedUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "prep-pack-generate-more",
      limit: 12,
      windowMs: 15 * 60 * 1000,
      userKey: session.user.id
    });
    const body = validateGenerationInput((await parseJsonBody<{
      category: string;
      count: number;
      difficulty: string;
    }>(request)));

    const db = await getDb();
    const prepPack = await db.collection("prepPacks").findOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });
    if (!prepPack) {
      return NextResponse.json({ error: "Prep pack not found" }, { status: 404 });
    }

    const category = prepPack.categoryPlan.find((item: { name: string }) => item.name === body.category);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await queueCategoryGenerationJob({
      prepPackId: id,
      category: category.name,
      count: body.count,
      difficulty: body.difficulty || prepPack.difficulty
    });
    await db.collection("prepPacks").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "generating",
          updatedAt: new Date()
        }
      }
    );
    await processPrepPackGenerationJobs({
      prepPackId: id,
      userId: session.user.id,
      limit: 1
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "prep_pack_generate_more",
      entityType: "prepPack",
      entityId: id,
      metadata: {
        category: body.category,
        count: body.count,
        difficulty: body.difficulty
      }
    });

    return NextResponse.json({ ok: true, queued: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate more questions" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Email verification required"
              ? 403
            : error instanceof Error && error.message.includes("Too many requests")
              ? 429
            : error instanceof Error &&
                (error.message.startsWith("Invalid ") || error.message.includes("required"))
              ? 400
              : 500
      }
    );
  }
}
