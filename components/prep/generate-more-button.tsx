"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateMoreButton({
  prepPackId,
  category,
  onDone
}: {
  prepPackId: string;
  category: string;
  onDone: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);

  async function trigger(count: number, difficulty: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/prep-packs/${prepPackId}/generate-more`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, count, difficulty })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate more questions");
      }

      await onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => trigger(10, "Mixed")} disabled={loading}>
        {loading ? "Working..." : "Generate 10 More"}
      </Button>
      <Button variant="ghost" onClick={() => trigger(8, "Advanced")} disabled={loading}>
        Advanced Questions
      </Button>
      <Button variant="ghost" onClick={() => trigger(8, "Intermediate")} disabled={loading}>
        Coding Questions
      </Button>
    </div>
  );
}
