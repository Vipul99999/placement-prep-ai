import type { RoadmapDay } from "@/types/prep";

export function RoadmapTimeline({ roadmap }: { roadmap: RoadmapDay[] }) {
  return (
    <div className="space-y-4">
      {roadmap.map((day) => (
        <div key={day.day} className="rounded-[1.5rem] bg-white/85 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">Day {day.day}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{day.title}</h3>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink/70">
              {day.estimatedHours} hrs
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Box title="Topics" items={day.topics} />
            <Box title="Tasks" items={day.tasks} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Box({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-sand p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-2 text-sm text-ink/70">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
