"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import type { ResumeUploadSummary } from "@/types/prep";

export function ResumeManager({ initialUploads }: { initialUploads: ResumeUploadSummary[] }) {
  const [uploads, setUploads] = useState(initialUploads);
  const [loadingId, setLoadingId] = useState("");
  const { showToast } = useToast();

  async function removeUpload(resumeUploadId: string) {
    setLoadingId(resumeUploadId);
    try {
      const response = await fetch("/api/uploads/resume", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUploadId })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete upload");
      }

      setUploads((current) => current.filter((item) => item._id !== resumeUploadId));
      showToast({
        title: "Resume removed",
        description: "The upload and extracted text were deleted from your workspace.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not delete resume",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoadingId("");
    }
  }

  if (!uploads.length) {
    return <p className="rounded-2xl bg-sand px-4 py-4 text-sm text-ink/65">No saved resume uploads yet.</p>;
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div key={upload._id} className="rounded-2xl bg-sand p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">{upload.fileName}</p>
              <p className="mt-2 text-sm text-ink/65">{upload.extractedTextPreview}</p>
              <p className="mt-2 text-xs text-ink/50">{new Date(upload.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <Button
              variant="secondary"
              disabled={loadingId === upload._id}
              onClick={() => removeUpload(upload._id)}
            >
              {loadingId === upload._id ? "Removing..." : "Delete"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
