"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-10 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Something Broke</p>
        <h1 className="mt-3 text-4xl font-black text-ink">This page hit an unexpected issue.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Your saved prep packs and account data are still safe. Try again, or head back to a stable page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
          <Link href="/dashboard" className="rounded-full bg-sand px-5 py-3 text-sm font-semibold text-ink">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

