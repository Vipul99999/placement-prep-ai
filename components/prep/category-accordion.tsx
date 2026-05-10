"use client";

import { useState } from "react";
import { LoadingGenerationState } from "@/components/prep/loading-generation-state";
import { QuestionCard } from "@/components/prep/question-card";
import { GenerateMoreButton } from "@/components/prep/generate-more-button";
import type { QuestionPageItem, RecommendedCategory } from "@/types/prep";

interface QuestionsResponse {
  items: QuestionPageItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function CategoryAccordion({
  prepPackId,
  companyName,
  role,
  category,
  totalQuestions
}: {
  prepPackId: string;
  companyName: string;
  role: string;
  category: RecommendedCategory & { totalQuestions?: number };
  totalQuestions?: number;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QuestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const currentCount = category.totalQuestions ?? totalQuestions ?? 0;

  async function loadQuestions(nextPage = 1) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/prep-packs/${prepPackId}/questions?category=${encodeURIComponent(category.name)}&page=${nextPage}&limit=6`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to fetch questions");
      }
      setData(payload);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && !data) {
      await loadQuestions(1);
    }
  }

  return (
    <div className="panel-hover rounded-[1.5rem] bg-white/85 shadow-lg ring-1 ring-black/5">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">
            {category.type}
          </p>
          <h3 className="mt-1 text-xl font-bold text-ink">{category.name}</h3>
          <p className="mt-2 text-sm text-ink/65">{category.reason}</p>
          <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky to-ocean"
              style={{
                width: `${Math.min(100, category.recommendedQuestionCount ? (currentCount / category.recommendedQuestionCount) * 100 : 0)}%`
              }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-ink/70">
            {category.importance}
          </p>
          <p className="mt-3 text-sm font-semibold text-ink">
            {currentCount} questions
          </p>
          <p className="mt-2 text-xs text-ink/50">{open ? "Tap to collapse" : "Tap to explore"}</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 px-6 py-6">
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <InfoCard
              title="Why this matters"
              value={`${category.name} is marked ${category.importance} importance because ${category.reason}`}
            />
            <InfoCard
              title="What to study first"
              value={`Start with foundational ${category.name} concepts, then revise interview-friendly examples and likely follow-up questions.`}
            />
          </div>

          <div className="mb-6">
            <GenerateMoreButton prepPackId={prepPackId} category={category.name} onDone={() => loadQuestions(page)} />
          </div>

          {loading && !data ? (
            <LoadingGenerationState />
          ) : (
            <div className="space-y-4">
              {data?.items.map((item) => (
                <QuestionCard
                  key={item.joinId}
                  item={item}
                  prepPackId={prepPackId}
                  companyName={companyName}
                  role={role}
                />
              ))}
            </div>
          )}

          {data && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink/60">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => loadQuestions(page - 1)}
                  disabled={page <= 1 || loading}
                  className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadQuestions(page + 1)}
                  disabled={page >= data.totalPages || loading}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink/75">{value}</p>
    </div>
  );
}
