"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ProcessPrepButton({ prepPackId }: { prepPackId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleProcess() {
    setLoading(true);
    try {
      const response = await fetch(`/api/prep-packs/${prepPackId}/process`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process queued jobs");
      }

      showToast({
        title: "Generation queue advanced",
        description: "Fresh categories are being added to this prep pack.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      showToast({
        title: "Could not process queue",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={handleProcess} disabled={loading}>
      {loading ? "Processing..." : "Continue Generation"}
    </Button>
  );
}
