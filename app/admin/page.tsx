import { redirect } from "next/navigation";
import { AlertActions } from "@/components/admin/alert-actions";
import { OpsActions } from "@/components/admin/ops-actions";
import { getAdminOverview } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/dashboard");
  }

  const overview = await getAdminOverview();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-[1.85rem] bg-gradient-to-br from-ink via-ocean to-sky p-8 text-white shadow-glow">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Admin</p>
        <h1 className="mt-3 text-4xl font-black">Observability and audit workspace</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-4 xl:grid-cols-6">
          <Stat label="Users" value={String(overview.stats.totalUsers)} />
          <Stat label="Prep Packs" value={String(overview.stats.totalPrepPacks)} />
          <Stat label="Failed Jobs" value={String(overview.stats.failedJobs)} />
          <Stat label="Due Reviews" value={String(overview.stats.dueReviewCount)} />
          <Stat label="Open Alerts" value={String(overview.stats.openAlerts)} />
          <Stat label="Unverified Users" value={String(overview.stats.unverifiedUsers)} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Stat label="Rate-limit Events" value={String(overview.stats.rateLimitEvents)} />
          <Stat label="AI Safety Hits" value={String(overview.stats.aiGuardEvents)} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Stat label="Open Support" value={String(overview.stats.openSupportTickets)} />
          <Stat label="Recent Feedback" value={String(overview.stats.recentFeedbackItems)} />
        </div>
        <div className="mt-6">
          <OpsActions />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
        <section className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-ink">Open Security Alerts</h2>
          <div className="mt-5 space-y-3">
            {overview.alerts.length === 0 ? (
              <div className="rounded-2xl bg-sand p-4 text-sm text-ink/70">No open alerts right now.</div>
            ) : (
              overview.alerts.map((alert: any) => (
                <div key={alert._id} className="rounded-2xl bg-sand p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{alert.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                        {alert.severity}
                      </span>
                      <AlertActions alertId={alert._id} status={alert.status} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ocean">{alert.type}</p>
                  <p className="mt-2 text-sm text-ink/70">Seen {alert.hitCount || 1} times</p>
                  <p className="mt-2 text-xs text-ink/50">{new Date(alert.updatedAt).toLocaleString("en-IN")}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-ink">Recent Audit Logs</h2>
          <div className="mt-5 space-y-3">
            {overview.auditLogs.map((log: any) => (
              <div key={log._id} className="rounded-2xl bg-sand p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{log.action}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                    {log.severity}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ocean">{log.entityType}</p>
                <p className="mt-2 text-sm text-ink/70">{log.actorEmail || "system"}</p>
                <p className="mt-2 text-xs text-ink/50">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-ink">Generation Jobs</h2>
          <div className="mt-5 space-y-3">
            {overview.generationJobs.map((job: any) => (
              <div key={job._id} className="rounded-2xl bg-sand p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{job.category}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                    {job.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">
                  requested {job.requestedCount} - reused {job.reusedCount} - generated {job.generatedCount}
                </p>
                {job.error ? <p className="mt-2 text-sm text-red-700">{job.error}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-ink">Support Inbox</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {overview.supportTickets.length === 0 ? (
            <div className="rounded-2xl bg-sand p-4 text-sm text-ink/70">No open support tickets right now.</div>
          ) : (
            overview.supportTickets.map((ticket: any) => (
              <div key={ticket._id} className="rounded-2xl bg-sand p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{ticket.topic}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-sm text-ink/70">{ticket.message}</p>
                <p className="mt-2 text-xs text-ink/50">{ticket.email}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-ink">Product Feedback</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {overview.productFeedback.length === 0 ? (
            <div className="rounded-2xl bg-sand p-4 text-sm text-ink/70">No feedback collected yet.</div>
          ) : (
            overview.productFeedback.map((item: any) => (
              <div key={item._id} className="rounded-2xl bg-sand p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{item.area}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                    {item.sentiment}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-sm text-ink/70">{item.message}</p>
                <p className="mt-2 text-xs text-ink/50">{item.email}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] bg-white/85 p-6 shadow-lg ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-ink">Query Plan Snapshot</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {overview.queryPlans.map((plan: any) => (
            <div key={plan.collection} className="rounded-2xl bg-sand p-4">
              <p className="text-sm font-bold text-ink">{plan.collection}</p>
              <p className="mt-2 text-xs text-ink/60">Docs examined: {plan.docsExamined}</p>
              <p className="text-xs text-ink/60">Keys examined: {plan.keysExamined}</p>
              <p className="mt-3 line-clamp-5 text-xs text-ink/55">{plan.winningPlan}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] bg-white/12 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
