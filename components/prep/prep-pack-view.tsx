import type { ReactNode } from "react";
import { DeletePrepPackButton } from "@/components/prep/delete-prep-pack-button";
import { DownloadPdfButton } from "@/components/prep/download-pdf-button";
import { CategoryAccordion } from "@/components/prep/category-accordion";
import { MockInterviewSection } from "@/components/prep/mock-interview-section";
import { ProcessPrepButton } from "@/components/prep/process-prep-button";
import { RoadmapTimeline } from "@/components/prep/roadmap-timeline";
import { Button } from "@/components/ui/button";
import type { PrepPackDetail } from "@/types/prep";

export function PrepPackView({ pack }: { pack: PrepPackDetail }) {
  const counts = new Map(pack.categorySummary.map((item) => [item.category, item.totalQuestions]));
  const nextStep =
    pack.analytics.notStartedQuestions > 0
      ? "Open the highest-importance category and move a few questions into Learning."
      : pack.analytics.learningQuestions > 0
        ? "Convert one learning category into mastered answers with your own notes."
        : "You are in a strong spot. Run a mock interview and export your final pack.";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-[2rem] bg-mesh p-8 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">{pack.companyName}</p>
            <h1 className="mt-2 text-4xl font-black text-ink">{pack.role}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/75">{pack.analysis.summary}</p>
          </div>
          <div className="flex gap-3">
            <Button href="/dashboard" variant="secondary">
              Back to Dashboard
            </Button>
            {pack.status === "generating" ? <ProcessPrepButton prepPackId={pack._id} /> : null}
            <DownloadPdfButton prepPackId={pack._id} />
            <DeletePrepPackButton prepPackId={pack._id} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric label="Questions" value={String(pack.totalQuestions)} />
          <Metric label="Preparation Days" value={String(pack.preparationDays)} />
          <Metric label="Difficulty" value={pack.difficulty} />
          <Metric label="Status" value={pack.status} />
        </div>
        <div className="mt-6 rounded-[1.5rem] bg-white/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Best Next Move</p>
              <p className="mt-2 text-sm leading-7 text-ink/75">{nextStep}</p>
            </div>
            <div className="min-w-52">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
                <span>Overall progress</span>
                <span>{pack.analytics.completionRate}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-ocean transition-all"
                  style={{ width: `${pack.analytics.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {pack.generationSummary.some((item) => item.status !== "completed") ? (
          <div className="mt-6 rounded-[1.5rem] border border-sky/20 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Generation Queue</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pack.generationSummary.map((item) => (
                <div key={item.category} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{item.category}</p>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/65">
                    target {item.requestedCount} - reused {item.reusedCount} - generated {item.generatedCount}
                  </p>
                  {item.error ? <p className="mt-2 text-sm text-red-700">{item.error}</p> : null}
                  {item.attemptCount ? (
                    <p className="mt-1 text-xs text-ink/50">Attempts used: {item.attemptCount}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-8">
          <SectionCard title="Progress Overview">
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Completion Rate" value={`${pack.analytics.completionRate}%`} />
              <Metric label="Bookmarked" value={String(pack.analytics.bookmarkedQuestions)} />
              <Metric label="Learning" value={String(pack.analytics.learningQuestions)} />
              <Metric label="Mastered" value={String(pack.analytics.masteredQuestions)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Metric label="Categories Started" value={String(pack.analytics.categoriesStarted)} />
              <Metric label="Categories Mastered" value={String(pack.analytics.categoriesMastered)} />
              <Metric label="Due Reviews" value={String(pack.analytics.dueReviewCount)} />
              <Metric label="Active Review Streaks" value={String(pack.analytics.activeReviewStreaks)} />
            </div>
          </SectionCard>

          <SectionCard title="Skill Breakdown">
            <SkillRow title="Primary Skills" items={pack.analysis.primarySkills} />
            <SkillRow title="Secondary Skills" items={pack.analysis.secondarySkills} />
            <SkillRow title="Core Subjects" items={pack.analysis.coreSubjects} />
            <SkillRow title="Interview Rounds" items={pack.analysis.interviewRounds} />
            {pack.projectHighlights?.length ? <SkillRow title="Project Highlights" items={pack.projectHighlights} /> : null}
          </SectionCard>

          <SectionCard title="Roadmap">
            <RoadmapTimeline roadmap={pack.roadmap} />
          </SectionCard>

          <MockInterviewSection prepPackId={pack._id} />
        </div>

        <SectionCard title="Question Categories">
          <div className="space-y-4">
            {pack.categoryPlan.map((category) => (
              <CategoryAccordion
                key={category.name}
                prepPackId={pack._id}
                companyName={pack.companyName}
                role={pack.role}
                category={{
                  ...category,
                  totalQuestions: counts.get(category.name) ?? 0
                }}
                totalQuestions={counts.get(category.name) ?? 0}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel-hover rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function SkillRow({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-4 rounded-2xl bg-sand p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-2 text-sm text-ink/70">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
