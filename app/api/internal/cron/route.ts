import { NextRequest, NextResponse } from "next/server";
import { cleanupRetentionData } from "@/lib/retention";
import { processAnyQueuedGenerationJobs } from "@/lib/prepPack";
import { getOptionalEnv } from "@/lib/env";
import { runRuntimeHealthChecks } from "@/lib/runtime-health";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const configuredSecret = getOptionalEnv("CRON_SECRET");
  if (!configuredSecret) {
    return false;
  }

  const requestSecret = request.headers.get("x-cron-secret")?.trim();
  return requestSecret === configuredSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const [jobs, retention, runtime] = await Promise.all([
      processAnyQueuedGenerationJobs(5),
      cleanupRetentionData(),
      runRuntimeHealthChecks()
    ]);

    return NextResponse.json({
      ok: true,
      processedPrepPacks: jobs.length,
      retention,
      runtime
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron processing failed" },
      { status: 500 }
    );
  }
}
