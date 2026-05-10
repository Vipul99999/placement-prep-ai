import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { PrepPackSummary } from "@/types/prep";

export function PrepPackCard({ pack }: { pack: PrepPackSummary }) {
  const statusTone =
    pack.status === "completed"
      ? "bg-ocean/12 text-ocean"
      : pack.status === "generating"
        ? "bg-sky/12 text-sky"
        : pack.status === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-sand text-ink/70";

  return (
    <div className="panel-hover rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {pack.companyName}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-ink">{pack.role}</h3>
          <p className="mt-2 text-sm text-ink/60">
            {pack.experienceLevel} - {pack.difficulty} track
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone}`}>
          {pack.status}
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Questions" value={String(pack.totalQuestions)} />
        <Stat label="Created" value={formatDate(pack.createdAt)} />
        <Stat label="Days" value={String(pack.preparationDays)} />
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-ocean"
          style={{
            width: `${Math.min(100, pack.totalQuestions === 0 ? 8 : 20 + pack.totalQuestions)}%`
          }}
        />
      </div>
      <div className="mt-6">
        <Link
          href={`/prep/${pack._id}`}
          className="inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
