"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

const sentimentOptions = [
  { value: "love_it", label: "Love it" },
  { value: "needs_work", label: "Needs work" },
  { value: "bug", label: "Bug / issue" }
] as const;

export function QuickFeedbackCard({ area = "General Product" }: { area?: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<(typeof sentimentOptions)[number]["value"]>("love_it");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          sentiment,
          message
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not submit feedback");
      }

      setMessage("");
      setSentiment("love_it");
      showToast({
        title: "Feedback received",
        description: "Thanks. This helps shape the product roadmap.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Feedback failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Product Feedback</p>
      <h3 className="mt-2 text-2xl font-black text-ink">Tell us what should improve next</h3>
      <div className="mt-5 flex flex-wrap gap-2">
        {sentimentOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSentiment(option.value)}
            className={
              sentiment === option.value
                ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <textarea
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What felt great, what felt confusing, or what blocked progress?"
        className="mt-4 w-full rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      />
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={loading || message.trim().length < 10}>
          {loading ? "Sending..." : "Send Feedback"}
        </Button>
        <p className="text-sm text-ink/60">We use this to prioritize roadmap decisions.</p>
      </div>
    </form>
  );
}

