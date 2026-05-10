import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireEnv } from "@/lib/env";
import { sendAlertNotification, sendMonitoringEvent } from "@/lib/monitoring";

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return {};
  }

  const trimmedEntries = Object.entries(metadata).slice(0, 12).map(([key, value]) => [
    key,
    typeof value === "string" ? value.slice(0, 500) : value
  ]);

  return Object.fromEntries(trimmedEntries);
}

export async function logAuditEvent(input: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  severity?: "info" | "warning" | "error";
}) {
  try {
    const db = await getDb();
    const event = {
      actorUserId: input.actorUserId ?? "",
      actorEmail: input.actorEmail ?? "",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? "",
      metadata: sanitizeMetadata(input.metadata),
      severity: input.severity ?? "info",
      createdAt: new Date()
    };
    await db.collection("auditLogs").insertOne(event);
    await sendMonitoringEvent({
      source: "audit",
      event: input.action,
      level: input.severity ?? "info",
      message: `Audit event: ${input.action}`,
      metadata: {
        entityType: input.entityType,
        entityId: input.entityId ?? "",
        actorUserId: input.actorUserId ?? ""
      }
    });
  } catch {
    // Avoid blocking user flows if audit insertion fails.
  }
}

export async function raiseSecurityAlert(input: {
  type: string;
  severity?: "info" | "warning" | "error";
  title: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection<any>("securityAlerts").findOneAndUpdate(
      { _id: input.dedupeKey },
      {
        $setOnInsert: {
          _id: input.dedupeKey,
          type: input.type,
          title: input.title,
          createdAt: now,
          status: "open"
        },
        $set: {
          severity: input.severity ?? "warning",
          metadata: sanitizeMetadata(input.metadata),
          updatedAt: now,
          lastSeenAt: now,
          status: "open"
        },
        $inc: {
          hitCount: 1
        }
      },
      { upsert: true, returnDocument: "after" }
    );
    const hitCount = Number(result?.hitCount ?? 1);
    await sendMonitoringEvent({
      source: "security",
      event: input.type,
      level: input.severity ?? "warning",
      message: input.title,
      metadata: {
        dedupeKey: input.dedupeKey,
        hitCount
      }
    });
    if (hitCount === 3 || hitCount === 10) {
      await sendAlertNotification({
        title: `${input.title} (${hitCount} hits)`,
        severity: input.severity ?? "warning",
        kind: input.type,
        metadata: {
          dedupeKey: input.dedupeKey,
          hitCount,
          ...sanitizeMetadata(input.metadata)
        }
      });
    }
  } catch {
    // Avoid blocking primary flow on alert failures.
  }
}

export function getAdminEmails() {
  const raw = requireEnv("ADMIN_EMAILS");
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return getAdminEmails().includes(email.toLowerCase().trim());
}

export async function getAdminOverview() {
  const db = await getDb();

  const [
    auditLogs,
    generationJobs,
    alerts,
    supportTickets,
    productFeedback,
    totalUsers,
    totalPrepPacks,
    failedJobs,
    dueReviewCount,
    unverifiedUsers,
    rateLimitEvents,
    aiGuardEvents
  ] = await Promise.all([
    db.collection("auditLogs").find({}).sort({ createdAt: -1 }).limit(30).toArray(),
    db.collection("generationJobs").find({}).sort({ updatedAt: -1 }).limit(20).toArray(),
    db.collection("securityAlerts").find({ status: { $in: ["open", "acknowledged"] } }).sort({ updatedAt: -1 }).limit(20).toArray(),
    db.collection("supportTickets").find({ status: { $ne: "resolved" } }).sort({ updatedAt: -1 }).limit(20).toArray(),
    db.collection("productFeedback").find({}).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection("users").countDocuments(),
    db.collection("prepPacks").countDocuments(),
    db.collection("generationJobs").countDocuments({ status: "failed" }),
    db.collection("prepPackQuestions").countDocuments({
      nextReviewAt: { $lte: new Date() }
    }),
    db.collection("users").countDocuments({ emailVerifiedAt: null }),
    db.collection("auditLogs").countDocuments({ action: "rate_limit_blocked" }),
    db.collection("auditLogs").countDocuments({ action: "ai_input_sanitized" })
  ]);

  const queryPlans = await Promise.all([
    db
      .collection("prepPackQuestions")
      .find({ nextReviewAt: { $lte: new Date() } })
      .limit(1)
      .explain("executionStats"),
    db
      .collection("generationJobs")
      .find({ status: "pending" })
      .sort({ updatedAt: -1 })
      .limit(1)
      .explain("executionStats"),
    db
      .collection("questions")
      .find({ category: { $exists: true } })
      .sort({ qualityScore: -1, usageCount: -1 })
      .limit(1)
      .explain("executionStats")
  ]);

  return {
    stats: {
      totalUsers,
      totalPrepPacks,
      failedJobs,
      dueReviewCount,
      unverifiedUsers,
      openAlerts: alerts.length,
      openSupportTickets: supportTickets.length,
      recentFeedbackItems: productFeedback.length,
      rateLimitEvents,
      aiGuardEvents
    },
    queryPlans: queryPlans.map((plan) => ({
      collection: plan.queryPlanner?.namespace?.split(".").pop() ?? "unknown",
      winningPlan: JSON.stringify(plan.queryPlanner?.winningPlan ?? {}),
      docsExamined: plan.executionStats?.totalDocsExamined ?? 0,
      keysExamined: plan.executionStats?.totalKeysExamined ?? 0
    })),
    auditLogs: JSON.parse(
      JSON.stringify(auditLogs, (_, value) => (value instanceof ObjectId ? value.toString() : value))
    ),
    generationJobs: JSON.parse(
      JSON.stringify(generationJobs, (_, value) => (value instanceof ObjectId ? value.toString() : value))
    ),
    alerts: JSON.parse(
      JSON.stringify(alerts, (_, value) => (value instanceof ObjectId ? value.toString() : value))
    ),
    supportTickets: JSON.parse(
      JSON.stringify(supportTickets, (_, value) => (value instanceof ObjectId ? value.toString() : value))
    ),
    productFeedback: JSON.parse(
      JSON.stringify(productFeedback, (_, value) => (value instanceof ObjectId ? value.toString() : value))
    )
  };
}
