import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { assertCanCreatePrepPackToday } from "@/lib/cost-controls";
import { createPrepPack, listPrepPacks } from "@/lib/prepPack";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { parsePositiveInt, validatePrepInput } from "@/lib/validators";
import type { PrepInput } from "@/types/prep";

export async function GET(request: NextRequest) {
  try {
    const session = await requireVerifiedUserSession();
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 100);
    const limit = parsePositiveInt(searchParams.get("limit"), 12, 24);
    const search = searchParams.get("search")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;
    const result = await listPrepPacks(session.user.id, {
      page,
      limit,
      search,
      status
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load prep packs" },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Invalid prep-pack status filter"
              ? 400
              : 500
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireVerifiedUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "prep-pack-create",
      limit: 6,
      windowMs: 15 * 60 * 1000,
      userKey: session.user.id
    });
    await assertCanCreatePrepPackToday(session.user.id);
    const body = validatePrepInput(await parseJsonBody<PrepInput>(request));
    const prepPackId = await createPrepPack(body, session.user.id);
    return NextResponse.json({ prepPackId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create prep pack" },
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
            : error instanceof Error && error.message.includes("Daily ")
              ? 429
            : error instanceof Error && error.message.startsWith("Missing required environment variable")
              ? 500
              : 400
      }
    );
  }
}
