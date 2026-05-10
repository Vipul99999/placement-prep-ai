"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ResendVerificationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to resend verification email");
      }

      setMessage(data.message);
      showToast({
        title: "Verification email sent",
        description: data.message,
        tone: "success"
      });
    } catch (submissionError) {
      const messageText =
        submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(messageText);
      showToast({
        title: "Could not resend verification email",
        description: messageText,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
          placeholder="student@example.com"
        />
      </label>
      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Resend Verification Email"}
      </Button>
    </form>
  );
}
