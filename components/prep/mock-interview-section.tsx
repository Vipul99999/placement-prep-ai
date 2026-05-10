"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

interface MockQuestion {
  questionId: string;
  category: string;
  difficulty: string;
  question: string;
  answerShort: string;
  answerDetailed?: string;
  followUps: string[];
}

export function MockInterviewSection({ prepPackId }: { prepPackId: string }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<MockQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, "needs-work" | "okay" | "strong">>({});

  async function startMock() {
    setLoading(true);
    try {
      const response = await fetch(`/api/prep-packs/${prepPackId}/mock-interview?count=5`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load mock interview");
      }

      setItems(data.items);
      setCurrent(0);
      setRevealed(false);
      setOpen(true);
      showToast({
        title: "Mock interview ready",
        description: "A fresh practice round has been prepared from your saved pack.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not load mock interview",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function persistRating(questionId: string, rating: "needs-work" | "okay" | "strong") {
    const response = await fetch(`/api/prep-packs/${prepPackId}/mock-interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, rating })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Unable to save mock interview rating");
    }
  }

  const currentItem = items[current];
  const currentRating = currentItem ? ratings[currentItem.questionId] : undefined;
  const completedCount = useMemo(() => Object.keys(ratings).length, [ratings]);

  return (
    <section className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Mock Interview</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Practice a short interview loop.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
            Pulls a quick set of questions from your saved prep pack so you can rehearse answers
            under light pressure.
          </p>
        </div>
        <Button onClick={startMock} disabled={loading}>
          {loading ? "Preparing..." : open ? "Refresh Mock Interview" : "Start Mock Interview"}
        </Button>
      </div>

      {open && currentItem ? (
        <div className="mt-6 rounded-[1.5rem] bg-sand p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">
              Question {current + 1} of {items.length}
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70">
              {currentItem.category} - {currentItem.difficulty}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-ink">{currentItem.question}</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Panel title="Answer cue" value={currentItem.answerShort} />
            <Panel
              title="Follow-up prompts"
              value={currentItem.followUps.length ? currentItem.followUps.join(" | ") : "No follow-ups saved yet."}
            />
          </div>
          <div className="mt-4 rounded-2xl bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Self review</p>
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink"
              >
                {revealed ? "Hide model answer" : "Reveal model answer"}
              </button>
            </div>
            {revealed ? (
              <p className="mt-4 text-sm leading-7 text-ink/75">
                {currentItem.answerDetailed || currentItem.answerShort}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["needs-work", "Needs work"],
                ["okay", "Okay"],
                ["strong", "Strong"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={async () => {
                    const rating = value as "needs-work" | "okay" | "strong";
                    setRatings((currentRatings) => ({
                      ...currentRatings,
                      [currentItem.questionId]: rating
                    }));
                    try {
                      await persistRating(currentItem.questionId, rating);
                    } catch (error) {
                      showToast({
                        title: "Could not save mock rating",
                        description: error instanceof Error ? error.message : "Please try again.",
                        tone: "error"
                      });
                    }
                  }}
                  className={
                    currentRating === value
                      ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink/75"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/65 px-4 py-3 text-sm text-ink/65">
            Rated {completedCount} of {items.length} mock questions
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrent((value) => Math.max(0, value - 1));
                setRevealed(false);
              }}
              disabled={current === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                setCurrent((value) => Math.min(items.length - 1, value + 1));
                setRevealed(false);
              }}
              disabled={current === items.length - 1}
            >
              Next Question
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Panel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink/75">{value}</p>
    </div>
  );
}
