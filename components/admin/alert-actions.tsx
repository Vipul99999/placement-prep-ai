"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

export function AlertActions({
  alertId,
  status
}: {
  alertId: string;
  status: "open" | "acknowledged" | "resolved" | "closed";
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function updateStatus(nextStatus: "open" | "acknowledged" | "resolved" | "closed") {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update alert");
      }
      showToast({
        title:
          nextStatus === "resolved"
            ? "Alert resolved"
            : nextStatus === "acknowledged"
              ? "Alert acknowledged"
              : nextStatus === "closed"
                ? "Alert closed"
                : "Alert reopened",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      showToast({
        title: "Could not update alert",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "open" ? (
        <button
          type="button"
          onClick={() => updateStatus("acknowledged")}
          disabled={loading}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70"
        >
          {loading ? "Saving..." : "Acknowledge"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => updateStatus(status === "resolved" || status === "closed" ? "open" : "resolved")}
        disabled={loading}
        className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70"
      >
        {loading ? "Saving..." : status === "resolved" || status === "closed" ? "Reopen" : "Resolve"}
      </button>
      {status !== "closed" ? (
        <button
          type="button"
          onClick={() => updateStatus("closed")}
          disabled={loading}
          className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}
