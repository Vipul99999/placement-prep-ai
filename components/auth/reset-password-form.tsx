"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      showToast({
        title: "Passwords do not match",
        description: "Please enter the same new password in both fields.",
        tone: "error"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password");
      }

      setSuccess("Password reset successful. Redirecting to login...");
      showToast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
        tone: "success"
      });
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not reset password",
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
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">New password</span>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Confirm password</span>
        <input
          required
          type="password"
          minLength={8}
          value={form.confirmPassword}
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
        />
      </label>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
