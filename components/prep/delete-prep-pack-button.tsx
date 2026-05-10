"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function DeletePrepPackButton({ prepPackId }: { prepPackId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete() {
    const confirmed = window.confirm("Delete this prep pack and all its personal notes/progress?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/prep-packs/${prepPackId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete prep pack");
      }

      showToast({
        title: "Prep pack deleted",
        description: "The pack has been removed from your workspace.",
        tone: "success"
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      showToast({
        title: "Could not delete prep pack",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete Prep Pack"}
    </Button>
  );
}
