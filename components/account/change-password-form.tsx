"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function ChangePasswordForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match");
      showToast({
        title: "Passwords do not match",
        description: "Please make sure the new password fields are the same.",
        tone: "error"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to change password");
      }
      setSuccess("Password updated successfully");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      showToast({
        title: "Password changed",
        description: "Your account password has been updated. Please sign in again on this device.",
        tone: "success"
      });
      await signOut({ callbackUrl: "/login" });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not change password",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <Field
        label="Current password"
        type="password"
        value={form.currentPassword}
        onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
      />
      <Field
        label="New password"
        type="password"
        value={form.newPassword}
        onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
      />
      <PasswordStrengthMeter password={form.newPassword} />
      <Field
        label="Confirm new password"
        type="password"
        value={form.confirmPassword}
        onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
      />

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <input
        required
        type={type}
        minLength={8}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
      />
    </label>
  );
}
