"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function PrivacyControls() {
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { showToast } = useToast();

  async function handleExport() {
    setExportingData(true);
    try {
      const response = await fetch("/api/account/export");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to export data");
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "placementprep-account-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      showToast({
        title: "Export ready",
        description: "Your account data export has been downloaded.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not export account data",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setExportingData(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete your account and all prep packs, notes, uploads, and progress? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      showToast({
        title: "Account deleted",
        description: "Your account and personal study data have been removed.",
        tone: "success"
      });
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      showToast({
        title: "Could not delete account",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={handleExport} disabled={exportingData}>
        {exportingData ? "Preparing Export..." : "Export My Data"}
      </Button>
      <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deletingAccount}>
        {deletingAccount ? "Deleting Account..." : "Delete Account"}
      </Button>
    </div>
  );
}
