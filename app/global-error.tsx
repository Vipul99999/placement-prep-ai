"use client";

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  console.error(error);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-[2rem] bg-white/90 p-10 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">App Recovery</p>
            <h1 className="mt-3 text-4xl font-black text-ink">PlacementPrep AI needs a fresh reload.</h1>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              A critical rendering issue occurred. Reload the page to restore the app shell.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              Reload App
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

