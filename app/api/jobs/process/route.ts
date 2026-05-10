import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { processAnyQueuedGenerationJobs } from "@/lib/prepPack";

export async function POST() {
  try {
    await requireAdminSession();
    const results = await processAnyQueuedGenerationJobs(4);
    return NextResponse.json({
      ok: true,
      processedPrepPacks: results.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process queued jobs" },
      {
        status:
          error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")
            ? 403
            : 500
      }
    );
  }
}
