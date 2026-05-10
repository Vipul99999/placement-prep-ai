import { getOptionalEnv } from "@/lib/env";

type MonitoringLevel = "info" | "warning" | "error";

function sanitizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload)
      .slice(0, 20)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 800) : value
      ])
  );
}

async function postJson(url: string, body: Record<string, unknown>) {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

export async function sendMonitoringEvent(input: {
  source: string;
  event: string;
  level?: MonitoringLevel;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const webhookUrl = getOptionalEnv("MONITORING_WEBHOOK_URL");
  if (!webhookUrl) {
    return;
  }

  try {
    await postJson(webhookUrl, {
      source: input.source,
      event: input.event,
      level: input.level ?? "info",
      message: input.message,
      metadata: sanitizePayload(input.metadata ?? {}),
      timestamp: new Date().toISOString()
    });
  } catch {
    // Monitoring should never break the core app flow.
  }
}

export async function sendAlertNotification(input: {
  title: string;
  severity: MonitoringLevel;
  kind: string;
  metadata?: Record<string, unknown>;
}) {
  const webhookUrl = getOptionalEnv("ALERT_WEBHOOK_URL") || getOptionalEnv("MONITORING_WEBHOOK_URL");
  if (!webhookUrl) {
    return;
  }

  try {
    await postJson(webhookUrl, {
      source: "placement-prep-ai",
      event: "security_or_operational_alert",
      level: input.severity,
      message: input.title,
      kind: input.kind,
      metadata: sanitizePayload(input.metadata ?? {}),
      timestamp: new Date().toISOString()
    });
  } catch {
    // Alerts should not block the user experience.
  }
}
