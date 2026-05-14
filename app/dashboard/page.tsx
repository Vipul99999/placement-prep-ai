import { redirect } from "next/navigation";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { EmptyDashboardState } from "@/components/dashboard/empty-dashboard-state";
import { QuickFeedbackCard } from "@/components/feedback/quick-feedback-card";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
import { getDashboardAnalytics, listPrepPacks } from "@/lib/prepPack";
import { getOnboardingState } from "@/lib/support";
import type { PrepPackSummary } from "@/types/prep";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let packs: PrepPackSummary[] = [];
  let analytics = {
    totalPrepPacks: 0,
    completedPrepPacks: 0,
    totalQuestions: 0,
    bookmarkedQuestions: 0,
    learningQuestions: 0,
    masteredQuestions: 0,
    dueReviewCount: 0,
    queuedJobs: 0
  };
  let error = "";
  let onboarding = {
    hasVerifiedEmail: false,
    hasPrepPack: false,
    hasResumeUpload: false,
    hasStartedPractice: false,
    percentComplete: 0
  };

  try {
    const [packResult, analyticsResult, onboardingResult] = await Promise.all([
      listPrepPacks(session.user.id),
      getDashboardAnalytics(session.user.id),
      getOnboardingState(session.user.id)
    ]);
    packs = packResult.items;
    analytics = analyticsResult;
    onboarding = onboardingResult;
  } catch (pageError) {
    error = pageError instanceof Error ? pageError.message : "Unable to load prep packs";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Dashboard</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Recent Prep Packs</h1>
        </div>
        <Button href="/create">Create New Prep Pack</Button>
      </div>

      <div className="mt-8">
        {!error && <DashboardAnalytics analytics={analytics} />}
      </div>

      {!error && onboarding.percentComplete < 100 ? (
        <div className="mt-8">
          <OnboardingCard state={onboarding} />
        </div>
      ) : null}

      <div className="mt-8">
        {error ? (
          <div className="rounded-[2rem] bg-white/80 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Setup Needed</p>
            <h2 className="mt-3 text-3xl font-bold text-ink">Connect MongoDB to unlock the dashboard.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">{error}</p>
          </div>
        ) : packs.length === 0 ? (
          <EmptyDashboardState />
        ) : (
          <DashboardWorkspace packs={packs} />
        )}
      </div>

      {!error ? (
        <div className="mt-8">
          <QuickFeedbackCard area="Dashboard" />
        </div>
      ) : null}
    </main>
  );
}
