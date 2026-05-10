"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ProfileForm({
  initialName,
  email,
  pendingEmail
}: {
  initialName: string;
  email: string;
  pendingEmail?: string;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmailState, setPendingEmailState] = useState(pendingEmail || "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update profile");
      }
      setSuccess("Profile updated");
      showToast({
        title: "Profile updated",
        description: "Your display name has been saved.",
        tone: "success"
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not update profile",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function requestEmailChange() {
    setChangingEmail(true);
    setError("");
    try {
      const response = await fetch("/api/account/email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to change email");
      }

      setPendingEmailState(data.pendingEmail || newEmail);
      setNewEmail("");
      showToast({
        title: "Verification sent",
        description: "Open the inbox for your new email address to confirm the change.",
        tone: "success"
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not request email change",
        description: message,
        tone: "error"
      });
    } finally {
      setChangingEmail(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Display name</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Email</span>
        <input
          value={email}
          disabled
          className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-ink/60 outline-none"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">New email</span>
        <input
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
          placeholder="new-email@example.com"
        />
      </label>
      {pendingEmailState ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pending email change: {pendingEmailState}. Confirm it from that inbox to finish switching.
        </p>
      ) : null}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
        </Button>
        <Button type="button" variant="secondary" disabled={changingEmail || !newEmail.trim()} onClick={requestEmailChange}>
          {changingEmail ? "Sending..." : "Change Email"}
        </Button>
      </div>
    </form>
  );
}
