import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-10 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Not Found</p>
        <h1 className="mt-3 text-4xl font-black text-ink">That prep pack does not exist.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          It may have been removed, or the link may be incomplete.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/create"
            className="rounded-full bg-sand px-5 py-3 text-sm font-semibold text-ink"
          >
            Create New Pack
          </Link>
        </div>
      </div>
    </main>
  );
}
