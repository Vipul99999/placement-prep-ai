import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, requireVerifiedUserSession } from "@/lib/auth";
import { createPrepPack, listPrepPacks } from "@/lib/prepPack";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { validatePrepInput } from "@/lib/validators";
import type { PrepInput } from "@/types/prep";

export async function GET() {
  try {
    const session = await requireVerifiedUserSession();
    const packs = await listPrepPacks(session.user.id);
    return NextResponse.json({ items: packs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load prep packs" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
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
            : error instanceof Error && error.message.startsWith("Missing required environment variable")
              ? 500
              : 400
      }
    );
  }
}
