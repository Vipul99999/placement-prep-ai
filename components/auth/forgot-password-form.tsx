"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to process reset request");
      }

      const nextMessage = data.message || "If this email exists, a reset link is on its way.";
      setMessage(nextMessage);
      showToast({
        title: "Reset link sent",
        description: nextMessage,
        tone: "success"
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not send reset link",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
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

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Preparing..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
