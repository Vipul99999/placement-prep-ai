import { cleanupRetentionData } from "../lib/retention.ts";
import { processAnyQueuedGenerationJobs } from "../lib/prepPack.ts";
import { runRuntimeHealthChecks } from "../lib/runtime-health.ts";

const loopIntervalMs = Number(process.env.WORKER_INTERVAL_MS || 30000);
const retentionEveryLoops = Number(process.env.WORKER_RETENTION_EVERY_LOOPS || 20);
const healthEveryLoops = Number(process.env.WORKER_HEALTH_EVERY_LOOPS || 10);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(loop: number) {
  const processed = await processAnyQueuedGenerationJobs(6);
  if (loop % retentionEveryLoops === 0) {
    await cleanupRetentionData();
  }
  if (loop % healthEveryLoops === 0) {
    await runRuntimeHealthChecks();
  }

  console.log(`[worker] processed prep packs: ${processed.length}`);
}

async function main() {
  console.log("[worker] PlacementPrep AI worker started");
  let loop = 1;
  while (true) {
    try {
      await runOnce(loop);
    } catch (error) {
      console.error("[worker] loop failed", error);
    }
    loop += 1;
    await sleep(loopIntervalMs);
  }
}

main().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exit(1);
});
