import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/shell";

const features = ["Role-focused packs", "Smart question roadmap", "Mock interview flow", "PDF export"];

const steps = [
  "Paste role details",
  "Get a focused pack",
  "Practice category by category"
];

const benefits = [
  "Cuts prep confusion fast",
  "Fits short placement timelines",
  "Feels useful on phone or laptop",
  "Turns revision into a daily routine"
];

const trustSignals = [
  "Structured JSON AI output",
  "Question bank reuse",
  "Phone-friendly study flow",
  "Save notes and revisit weak areas"
];

export function LandingPage() {
  return (
    <main className="pb-16 section-fade">
      <SectionShell className="pt-4 sm:pt-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-mesh p-6 shadow-glow sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-ocean">
                Built for Tier-2/3 placement prep
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
                Crack placement prep with a pack that feels built for you.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/75 sm:text-base">
                Add company, role, and JD. Get likely questions, sharp answers, a topic roadmap,
                and mock interview practice in one clean workspace.
              </p>
              <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
                {trustSignals.map((signal) => (
                  <div key={signal} className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-ink/72 ring-1 ring-black/5">
                    {signal}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span key={feature} className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm">
                    {feature}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/create">Start Preparing</Button>
                <Button href="/dashboard" variant="secondary">
                  Open Dashboard
                </Button>
              </div>
            </div>

            <div className="glass rounded-[1.75rem] border border-white/80 p-4 shadow-lg sm:p-5">
              <div className="rounded-[1.5rem] bg-ink p-5 text-white">
                <div className="flex items-center justify-between gap-3 text-sm text-white/70">
                  <span>Prep Snapshot</span>
                  <span>Frontend Developer</span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Top Skills</p>
                    <p className="mt-2 text-lg font-semibold">React, JavaScript, APIs, Debugging</p>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Suggested Categories</p>
                      <p className="mt-2 text-sm leading-6 text-white/80">React fundamentals, API handling, debugging rounds, HR answers</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-3xl font-bold">54</p>
                      <p className="text-sm text-white/70">questions ready</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-3xl font-bold">15</p>
                      <p className="text-sm text-white/70">day roadmap</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-accent/90 to-sky/80 p-4 text-sm font-medium text-white">
                    Revise fast, bookmark weak answers, and run mock interviews from the same pack.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pt-16">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="panel-hover rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">Step {index + 1}</p>
              <h2 className="mt-3 text-2xl font-bold text-ink">{step}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/70">
                {index === 0 && "Start with the role details you already have, even if the JD is rough."}
                {index === 1 && "The app organizes likely interview questions, answers, roadmap, and priority topics."}
                {index === 2 && "Track learning, save notes, and generate more only where you need deeper prep."}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="pt-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.9rem] bg-gradient-to-br from-ink via-ocean to-sky p-8 text-white shadow-glow">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/65">Why students like it</p>
            <h2 className="mt-3 text-3xl font-black">Clear next steps, not endless scrolling.</h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              The product is designed to reduce confusion, especially for students preparing around classes,
              travel, and short interview windows.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/12 p-4 text-sm">Likely questions, not inflated promises</div>
              <div className="rounded-2xl bg-white/12 p-4 text-sm">Study on laptop or phone without clutter</div>
              <div className="rounded-2xl bg-white/12 p-4 text-sm">Progress, notes, bookmarks, and mock practice together</div>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-white/80 p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky">Built for daily use</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-black/5 bg-white p-5">
                  <p className="text-base font-semibold text-ink">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-sand p-5">
              <p className="text-sm leading-7 text-ink/75">
                Mobile-friendly cards, focused forms, and category-wise loading keep the app easy to use when students are prepping on the move.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pt-16">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">What You Get</p>
            <h3 className="mt-3 text-2xl font-bold text-ink">A roadmap that feels manageable</h3>
            <p className="mt-3 text-sm leading-7 text-ink/70">
              Students do not need a giant unreadable dump. The app keeps the first pack focused and expandable.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">Why It Feels Better</p>
            <h3 className="mt-3 text-2xl font-bold text-ink">Each category loads when needed</h3>
            <p className="mt-3 text-sm leading-7 text-ink/70">
              That keeps the prep page faster on mobile and lets students stay focused instead of scanning everything at once.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">Trust Layer</p>
            <h3 className="mt-3 text-2xl font-bold text-ink">Likely questions, not fake guarantees</h3>
            <p className="mt-3 text-sm leading-7 text-ink/70">
              The product keeps interview prep honest while still giving students a practical and confidence-building study pack.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pt-16">
        <div className="rounded-[2rem] bg-gradient-to-r from-ocean to-sky p-7 text-white shadow-glow sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Start Now</p>
              <h2 className="mt-2 text-3xl font-black">Build your prep pack before the next shortlist lands.</h2>
            </div>
            <Button href="/create" variant="secondary" className="bg-white text-ink">
              Start Preparing
            </Button>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
