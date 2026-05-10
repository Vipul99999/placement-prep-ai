"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { UserPreferences } from "@/types/prep";

export function PreferencesForm({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialPreferences);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not save preferences");
      }

      showToast({
        title: "Preferences saved",
        description: "Your default study settings are updated.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not save preferences",
        description: error instanceof Error ? error.message : "Something went wrong",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Default Days</span>
          <select
            value={form.defaultPreparationDays}
            onChange={(event) =>
              setForm((current) => ({ ...current, defaultPreparationDays: Number(event.target.value) as 7 | 15 | 30 }))
            }
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
          >
            <option value={7}>7 days</option>
            <option value={15}>15 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Default Difficulty</span>
          <select
            value={form.defaultDifficulty}
            onChange={(event) => setForm((current) => ({ ...current, defaultDifficulty: event.target.value as UserPreferences["defaultDifficulty"] }))}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Mixed">Mixed</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Weekly Goal</span>
          <input
            type="number"
            min={1}
            max={14}
            value={form.weeklyGoalSessions}
            onChange={(event) => setForm((current) => ({ ...current, weeklyGoalSessions: Number(event.target.value) || 1 }))}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
          />
        </label>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center gap-3 rounded-2xl bg-snow px-4 py-3">
          <input
            type="checkbox"
            checked={form.emailStudyReminders}
            onChange={(event) => setForm((current) => ({ ...current, emailStudyReminders: event.target.checked }))}
          />
          <span className="text-sm font-medium text-ink">Send study reminder emails</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl bg-snow px-4 py-3">
          <input
            type="checkbox"
            checked={form.emailProductUpdates}
            onChange={(event) => setForm((current) => ({ ...current, emailProductUpdates: event.target.checked }))}
          />
          <span className="text-sm font-medium text-ink">Send product improvement updates</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
        <p className="text-sm text-ink/60">These defaults shape faster form fills and better study consistency.</p>
      </div>
    </form>
  );
}

