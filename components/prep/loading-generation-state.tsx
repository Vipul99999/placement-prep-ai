export function LoadingGenerationState({ label = "Loading category questions..." }: { label?: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5">
      <div className="h-4 w-40 animate-pulse rounded-full bg-black/10" />
      <div className="mt-4 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-20 animate-pulse rounded-2xl bg-black/5" />
      </div>
      <p className="mt-4 text-sm text-ink/60">{label}</p>
    </div>
  );
}
