import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { runRuntimeHealthChecks } from "@/lib/runtime-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const result = await runRuntimeHealthChecks();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Runtime health check failed" },
      {
        status:
          error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")
            ? 403
            : 500
      }
    );
  }
}
