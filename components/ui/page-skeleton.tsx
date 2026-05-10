export function PageSkeleton(props: {
  title?: string;
  subtitle?: string;
  sections?: number;
}) {
  const title = props.title || "Loading workspace";
  const subtitle = props.subtitle || "Getting your prep experience ready.";
  const sections = props.sections ?? 3;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-[2rem] bg-white/80 p-8 shadow-lg ring-1 ring-black/5">
        <div className="animate-pulse">
          <div className="h-3 w-28 rounded-full bg-sand" />
          <div className="mt-4 h-10 w-full max-w-xl rounded-2xl bg-sand/90" />
          <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-sand/75" />
          <div className="mt-2 h-4 w-full max-w-xl rounded-full bg-sand/60" />
        </div>

        <div className="sr-only" aria-live="polite">
          {title}. {subtitle}
        </div>

        <div className="mt-8 grid gap-4">
          {Array.from({ length: sections }, (_, index) => (
            <div key={index} className="animate-pulse rounded-[1.5rem] border border-black/5 bg-snow p-5">
              <div className="h-5 w-40 rounded-full bg-sand/90" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-20 rounded-2xl bg-white" />
                <div className="h-20 rounded-2xl bg-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

