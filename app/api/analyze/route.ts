import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { analyzeInput } from "@/lib/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validatePrepInput } from "@/lib/validators";
import type { PrepInput } from "@/types/prep";

export async function POST(request: NextRequest) {
  try {
    const session = await requireVerifiedUserSession();
    await enforceRateLimit(request, {
      key: "analyze-input",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      userKey: session.user.id
    });
    const body = validatePrepInput((await request.json()) as PrepInput);
    const analysis = await analyzeInput(body);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analyze failed" },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Email verification required"
              ? 403
              : error instanceof Error && error.message.includes("Too many requests")
                ? 429
                : 400
      }
    );
  }
}
