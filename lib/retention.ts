import { getDb } from "@/lib/mongodb";
import { getOptionalEnv } from "@/lib/env";

function getRetentionDays(envName: string, fallbackDays: number) {
  const raw = getOptionalEnv(envName);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallbackDays;
  }

  return Math.floor(parsed);
}

export async function cleanupRetentionData() {
  const db = await getDb();
  const now = Date.now();
  const uploadCutoff = new Date(now - getRetentionDays("RETENTION_UPLOAD_DAYS", 45) * 24 * 60 * 60 * 1000);
  const auditCutoff = new Date(now - getRetentionDays("RETENTION_AUDIT_DAYS", 120) * 24 * 60 * 60 * 1000);
  const jobCutoff = new Date(now - getRetentionDays("RETENTION_JOB_DAYS", 30) * 24 * 60 * 60 * 1000);

  const [uploads, auditLogs, jobs] = await Promise.all([
    db.collection("resumeUploads").deleteMany({ createdAt: { $lt: uploadCutoff } }),
    db.collection("auditLogs").deleteMany({ createdAt: { $lt: auditCutoff } }),
    db.collection("generationJobs").deleteMany({
      updatedAt: { $lt: jobCutoff },
      status: { $in: ["completed", "failed"] }
    })
  ]);

  return {
    deletedUploads: uploads.deletedCount ?? 0,
    deletedAuditLogs: auditLogs.deletedCount ?? 0,
    deletedGenerationJobs: jobs.deletedCount ?? 0
  };
}
