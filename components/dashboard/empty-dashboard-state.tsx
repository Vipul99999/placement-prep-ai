import { Button } from "@/components/ui/button";

export function EmptyDashboardState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">No Prep Packs Yet</p>
      <h2 className="mt-3 text-3xl font-bold text-ink">Start with one company and one role.</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/70">
        The first pack will analyze the job description, create a category plan, and save reusable
        questions in MongoDB so later packs can generate faster.
      </p>
      <div className="mt-6">
        <Button href="/create">Create New Prep Pack</Button>
      </div>
    </div>
  );
}
