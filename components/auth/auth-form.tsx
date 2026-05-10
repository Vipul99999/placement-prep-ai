"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to create account");
        }

        showToast({
          title: "Account created",
          description: "Please verify your email before signing in and using AI generation.",
          tone: "success"
        });
        router.push(`/verify-email/sent?email=${encodeURIComponent(form.email)}` as never);
        router.refresh();
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      await fetch("/api/account/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: navigator.userAgent
        })
      }).catch(() => null);

      showToast({
        title: "Welcome back",
        description: "You are signed in and ready to continue your prep.",
        tone: "success"
      });
      const nextUrl = searchParams.get("next") || "/dashboard";
      router.push(nextUrl as never);
      router.refresh();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: mode === "signup" ? "Could not create account" : "Could not sign in",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {mode === "signup" && (
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
            placeholder="Aditi Sharma"
          />
        </label>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Email</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
          placeholder="student@example.com"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
          placeholder="At least 8 characters"
        />
      </label>
      {mode === "signup" ? <PasswordStrengthMeter password={form.password} /> : null}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "signup"
            ? "Creating account..."
            : "Signing in..."
          : mode === "signup"
            ? "Create Account"
            : "Sign In"}
      </Button>
      {mode === "login" && (
        <p className="text-xs leading-6 text-ink/55">
          Your progress, bookmarks, and notes stay linked to your account across sessions.
        </p>
      )}
    </form>
  );
}
