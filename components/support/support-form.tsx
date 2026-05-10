"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function SupportForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    topic: "",
    message: ""
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not send support request");
      }

      setForm({ topic: "", message: "" });
      showToast({
        title: "Support request sent",
        description: "Your message is now in the support queue.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Support request failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input
        value={form.topic}
        onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
        placeholder="Topic: billing, generation issue, account access..."
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      />
      <textarea
        rows={5}
        value={form.message}
        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        placeholder="Tell us what happened, what you expected, and what blocked you."
        className="rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Support Request"}
        </Button>
        <p className="text-sm text-ink/60">Clear bug reports help us respond faster.</p>
      </div>
    </form>
  );
}

