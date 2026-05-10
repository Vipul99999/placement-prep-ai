import crypto from "crypto";
import { NextRequest } from "next/server";
import { logAuditEvent, raiseSecurityAlert } from "@/lib/audit";
import { getDb } from "@/lib/mongodb";

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(
  request: NextRequest,
  options: {
    key: string;
    limit: number;
    windowMs: number;
    userKey?: string;
  }
) {
  const db = await getDb();
  const clientId = options.userKey?.trim() || getClientIp(request);
  const bucketStart = Math.floor(Date.now() / options.windowMs) * options.windowMs;
  const scope = `${options.key}:${clientId}`;
  const bucketId = crypto.createHash("sha256").update(`${scope}:${bucketStart}`).digest("hex");
  const now = new Date();
  const expiresAt = new Date(bucketStart + options.windowMs * 2);

  const result = await db.collection<any>("rateLimitBuckets").findOneAndUpdate(
    { _id: bucketId },
    {
      $setOnInsert: {
        _id: bucketId,
        scope,
        bucketStart,
        expiresAt,
        createdAt: now
      },
      $inc: { count: 1 },
      $set: { updatedAt: now }
    },
    {
      upsert: true,
      returnDocument: "after"
    }
  );

  const count = Number(result?.count ?? 1);
  if (count > options.limit) {
    await logAuditEvent({
      action: "rate_limit_blocked",
      entityType: "security",
      metadata: {
        scope: options.key,
        count,
        limit: options.limit,
        clientId
      },
      severity: "warning"
    });
    await raiseSecurityAlert({
      type: "rate_limit_exceeded",
      severity: "warning",
      title: "Rate limit threshold exceeded",
      dedupeKey: `${options.key}:${clientId}`,
      metadata: {
        scope: options.key,
        count,
        limit: options.limit,
        clientId
      }
    });
    throw new Error("Too many requests. Please wait a moment and try again.");
  }
}
