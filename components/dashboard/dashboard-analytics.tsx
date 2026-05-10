export function DashboardAnalytics({
  analytics
}: {
  analytics: {
    totalPrepPacks: number;
    completedPrepPacks: number;
    totalQuestions: number;
    bookmarkedQuestions: number;
    learningQuestions: number;
    masteredQuestions: number;
    dueReviewCount?: number;
    queuedJobs?: number;
  };
}) {
  const momentum = analytics.totalQuestions
    ? Math.round(((analytics.learningQuestions + analytics.masteredQuestions) / analytics.totalQuestions) * 100)
    : 0;

  const cards = [
    { label: "Prep Packs", value: analytics.totalPrepPacks },
    { label: "Completed Packs", value: analytics.completedPrepPacks },
    { label: "Tracked Questions", value: analytics.totalQuestions },
    { label: "Bookmarks", value: analytics.bookmarkedQuestions },
    { label: "Learning", value: analytics.learningQuestions },
    { label: "Mastered", value: analytics.masteredQuestions },
    { label: "Due Reviews", value: analytics.dueReviewCount ?? 0 },
    { label: "Queued Jobs", value: analytics.queuedJobs ?? 0 }
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] bg-gradient-to-r from-ink to-ocean p-6 text-white shadow-glow">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Study Momentum</p>
            <h2 className="mt-2 text-3xl font-black">{momentum}% of tracked questions are in motion.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              Bookmarks, learning status, and mastered answers all feed this workspace so students
              always know what to revise next.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/12 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Active Focus</p>
            <p className="mt-2 text-3xl font-black">{analytics.learningQuestions}</p>
            <p className="text-sm text-white/75">questions currently in learning mode</p>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-white transition-all"
            style={{ width: `${momentum}%` }}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-8">
        {cards.map((card) => (
          <div key={card.label} className="panel-hover rounded-[1.5rem] bg-white/85 p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{card.label}</p>
            <p className="mt-3 text-2xl font-black text-ink">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
