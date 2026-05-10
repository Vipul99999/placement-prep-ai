import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { cleanupRetentionData } from "@/lib/retention";

export async function POST() {
  try {
    await requireAdminSession();
    const result = await cleanupRetentionData();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run retention cleanup" },
      {
        status:
          error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")
            ? 403
            : 500
      }
    );
  }
}
