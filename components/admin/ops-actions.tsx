"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function OpsActions() {
  const [loading, setLoading] = useState("");
  const { showToast } = useToast();
  const router = useRouter();

  async function run(path: "/api/jobs/process" | "/api/jobs/retention", label: string) {
    setLoading(path);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to run ${label}`);
      }
      showToast({
        title: `${label} finished`,
        description: "The admin workspace has been refreshed with the latest state.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      showToast({
        title: `${label} failed`,
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        disabled={loading === "/api/jobs/process"}
        onClick={() => run("/api/jobs/process", "Job processor")}
      >
        {loading === "/api/jobs/process" ? "Processing..." : "Process Queued Jobs"}
      </Button>
      <Button
        variant="secondary"
        disabled={loading === "/api/jobs/retention"}
        onClick={() => run("/api/jobs/retention", "Retention cleanup")}
      >
        {loading === "/api/jobs/retention" ? "Cleaning..." : "Run Retention Cleanup"}
      </Button>
    </div>
  );
}
