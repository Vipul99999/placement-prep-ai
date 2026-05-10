import nodemailer from "nodemailer";
import { getOptionalEnv, requireEnv } from "@/lib/env";
import { getDb } from "@/lib/mongodb";
import { sendMonitoringEvent } from "@/lib/monitoring";

async function checkMongo() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return "ok";
}

async function checkGemini() {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: "GET" }
  );
  if (!response.ok) {
    throw new Error(`Gemini health check failed with ${response.status}`);
  }
  return "ok";
}

async function checkSmtp() {
  const transport = nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(requireEnv("SMTP_PORT")),
    secure: Number(requireEnv("SMTP_PORT")) === 465,
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS")
    }
  });

  await transport.verify();
  return "ok";
}

async function checkMonitoring() {
  const monitoringUrl = getOptionalEnv("MONITORING_WEBHOOK_URL");
  if (!monitoringUrl) {
    return "skipped";
  }

  await sendMonitoringEvent({
    source: "runtime-health",
    event: "healthcheck_ping",
    level: "info",
    message: "PlacementPrep AI runtime health check",
    metadata: {
      mode: "manual"
    }
  });

  return "ok";
}

export async function runRuntimeHealthChecks() {
  const checks = {
    mongo: "pending",
    gemini: "pending",
    smtp: "pending",
    monitoring: "pending"
  } as Record<string, string>;

  const results = await Promise.allSettled([
    checkMongo(),
    checkGemini(),
    checkSmtp(),
    checkMonitoring()
  ]);

  checks.mongo = results[0].status === "fulfilled" ? results[0].value : results[0].reason?.message || "failed";
  checks.gemini = results[1].status === "fulfilled" ? results[1].value : results[1].reason?.message || "failed";
  checks.smtp = results[2].status === "fulfilled" ? results[2].value : results[2].reason?.message || "failed";
  checks.monitoring = results[3].status === "fulfilled" ? results[3].value : results[3].reason?.message || "failed";

  return {
    checkedAt: new Date().toISOString(),
    checks,
    ok: Object.values(checks).every((value) => value === "ok" || value === "skipped")
  };
}
