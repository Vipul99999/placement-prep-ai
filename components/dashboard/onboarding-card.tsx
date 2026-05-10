"use client";

import Link from "next/link";
import type { OnboardingState } from "@/types/prep";

export function OnboardingCard({ state }: { state: OnboardingState }) {
  const items = [
    {
      label: "Verify email",
      done: state.hasVerifiedEmail,
      href: "/account"
    },
    {
      label: "Create first prep pack",
      done: state.hasPrepPack,
      href: "/create"
    },
    {
      label: "Upload resume",
      done: state.hasResumeUpload,
      href: "/account"
    },
    {
      label: "Start practicing",
      done: state.hasStartedPractice,
      href: state.hasPrepPack ? "/dashboard" : "/create"
    }
  ];

  return (
    <section className="rounded-[1.85rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Getting Started</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Build momentum in the first 10 minutes</h2>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            A few quick steps make the app feel much smarter and more useful right away.
          </p>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-sm font-bold text-ink">{state.percentComplete}% done</div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand/70">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-ocean" style={{ width: `${state.percentComplete}%` }} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href as never}
            className={`rounded-2xl px-4 py-4 transition ${
              item.done ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "bg-snow text-ink ring-1 ring-black/5"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{item.done ? "Done" : "Next step"}</p>
            <p className="mt-2 text-sm font-bold">{item.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
