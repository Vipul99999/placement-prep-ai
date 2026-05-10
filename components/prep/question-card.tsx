"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import type { PracticeStatus, QuestionPageItem } from "@/types/prep";

export function QuestionCard({
  item,
  prepPackId,
  companyName,
  role
}: {
  item: QuestionPageItem;
  prepPackId: string;
  companyName: string;
  role: string;
}) {
  const { showToast } = useToast();
  const [detailedAnswer, setDetailedAnswer] = useState(item.question.answerDetailed ?? "");
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Progress syncs here");
  const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked);
  const [practiceStatus, setPracticeStatus] = useState<PracticeStatus>(item.practiceStatus);
  const [userNotes, setUserNotes] = useState(item.userNotes);
  const [feedback, setFeedback] = useState(item.lastFeedback || "");

  async function persistState(next: {
    isBookmarked?: boolean;
    practiceStatus?: PracticeStatus;
    userNotes?: string;
    markReviewed?: boolean;
    feedback?: "helpful" | "irrelevant" | "too_easy" | "too_repetitive";
  }) {
    setSavingState(true);
    try {
      const response = await fetch(
        `/api/prep-packs/${prepPackId}/question-state/${item.joinId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update question state");
      }
      setSaveMessage("Saved just now");
    } catch {
      setSaveMessage("Save failed, try again");
      throw new Error("Failed to update question state");
    } finally {
      setSavingState(false);
    }
  }

  async function handleGenerateDetailedAnswer() {
    setLoadingDetailed(true);
    try {
      const response = await fetch(`/api/questions/${item.questionId}/generate-detailed-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prepPackId,
          companyName,
          role,
          category: item.category
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate detailed answer");
      }
      setDetailedAnswer(data.answerDetailed);
      showToast({
        title: "Detailed answer ready",
        description: "The expanded explanation has been added for this question.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not generate detailed answer",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoadingDetailed(false);
    }
  }

  async function copyQuestion() {
    await navigator.clipboard.writeText(item.question.question);
    setSaveMessage("Question copied");
    showToast({
      title: "Question copied",
      description: "You can paste it into your own notes or practice sheet.",
      tone: "success"
    });
  }

  const dueReviewLabel = item.nextReviewAt
    ? new Date(item.nextReviewAt).getTime() <= Date.now()
      ? "Review due now"
      : `Next review ${new Date(item.nextReviewAt).toLocaleDateString("en-IN")}`
    : "No review scheduled yet";

  return (
    <div className="panel-hover rounded-[1.5rem] bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{item.question.difficulty}</Badge>
          <Badge tone="warm">{item.question.subtopic}</Badge>
          {item.question.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} tone="soft">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyQuestion}
            className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 transition hover:bg-black/10"
          >
            Copy
          </button>
          <button
            onClick={async () => {
              const next = !isBookmarked;
              setIsBookmarked(next);
              try {
                await persistState({ isBookmarked: next });
                showToast({
                  title: next ? "Question bookmarked" : "Bookmark removed",
                  tone: "success"
                });
              } catch {
                setIsBookmarked(!next);
                showToast({
                  title: "Could not update bookmark",
                  description: "Please try again.",
                  tone: "error"
                });
              }
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
              isBookmarked ? "bg-ocean text-white" : "bg-black/5 text-ink/70"
            )}
          >
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
      </div>
      <h3 className="mt-4 text-xl font-bold text-ink">{item.question.question}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/55">
        <span className="rounded-full bg-sand px-3 py-1 font-semibold">{dueReviewLabel}</span>
        <span className="rounded-full bg-black/5 px-3 py-1 font-semibold">
          Review streak {item.reviewStreak ?? 0}
        </span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Short Answer" value={item.question.answerShort} />
        <Panel title="Example" value={item.question.example || "No example generated yet."} />
      </div>
      <div className="mt-4 rounded-2xl bg-sand p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Detailed Answer
          </p>
          {!detailedAnswer && (
            <Button
              onClick={handleGenerateDetailedAnswer}
              variant="secondary"
              disabled={loadingDetailed}
            >
              {loadingDetailed ? "Generating..." : "Generate Detailed Answer"}
            </Button>
          )}
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/75">
          {detailedAnswer || "Generate this only when needed to keep storage lighter and the MVP fast."}
        </p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ListPanel title="Follow-ups" items={item.question.followUps} />
        <ListPanel title="Common Mistakes" items={item.question.commonMistakes} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-2xl bg-sand p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Practice Status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["not_started", "Not Started"],
              ["learning", "Learning"],
              ["mastered", "Mastered"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={async () => {
                  const next = value as PracticeStatus;
                  const previous = practiceStatus;
                  setPracticeStatus(next);
                  try {
                    await persistState({ practiceStatus: next });
                    showToast({
                      title: "Practice status updated",
                      description: `Marked as ${label}.`,
                      tone: "success"
                    });
                  } catch {
                    setPracticeStatus(previous);
                    showToast({
                      title: "Could not update practice status",
                      description: "Please try again.",
                      tone: "error"
                    });
                  }
                }}
                className={
                  practiceStatus === value
                    ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/70 ring-1 ring-black/10 transition hover:bg-white/80"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/55">{savingState ? "Saving..." : saveMessage}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await persistState({ markReviewed: true, practiceStatus });
                showToast({
                  title: "Review saved",
                  description: "Your revision streak and next review date were updated.",
                  tone: "success"
                });
              } catch {
                showToast({
                  title: "Could not save review",
                  description: "Please try again.",
                  tone: "error"
                });
              }
            }}
            className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/75"
          >
            Mark Reviewed Today
          </button>
        </div>
        <div className="rounded-2xl bg-sand p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Question Feedback</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["helpful", "Helpful"],
              ["irrelevant", "Irrelevant"],
              ["too_easy", "Too Easy"],
              ["too_repetitive", "Too Repetitive"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={async () => {
                  const next = value;
                  const previous = feedback;
                  setFeedback(next);
                  try {
                    await persistState({ feedback: next as "helpful" | "irrelevant" | "too_easy" | "too_repetitive" });
                    showToast({
                      title: "Feedback saved",
                      description: `${label} feedback will improve future question quality.`,
                      tone: "success"
                    });
                  } catch {
                    setFeedback(previous);
                    showToast({
                      title: "Could not save feedback",
                      description: "Please try again.",
                      tone: "error"
                    });
                  }
                }}
                className={
                  feedback === value
                    ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/70 ring-1 ring-black/10"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/55">
            Use this when a question feels off-target, too basic, or repeated too often.
          </p>
        </div>
        <div className="rounded-2xl bg-sand p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Your Notes</p>
          <textarea
            rows={4}
            value={userNotes}
            onChange={(event) => setUserNotes(event.target.value)}
            onBlur={async () => {
              try {
                await persistState({ userNotes });
              } catch {
                showToast({
                  title: "Could not save notes",
                  description: "Your notes were not updated. Please try again.",
                  tone: "error"
                });
              }
            }}
            className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
            placeholder="Add your own explanation, memory trick, or example..."
          />
          <div className="mt-3 flex items-center justify-between text-xs text-ink/50">
            <span>Use this space for your own interview phrasing.</span>
            <span>{userNotes.length}/3000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink/75">{value}</p>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-sand p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-xl bg-white px-3 py-2 text-sm text-ink/75">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "warm" | "soft";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "default" && "bg-ink text-white",
        tone === "warm" && "bg-accent/15 text-accent",
        tone === "soft" && "bg-black/5 text-ink/70"
      )}
    >
      {children}
    </span>
  );
}
