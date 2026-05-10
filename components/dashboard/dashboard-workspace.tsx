"use client";

import { useMemo, useState } from "react";
import { PrepPackCard } from "@/components/dashboard/prep-pack-card";
import type { PrepPackSummary } from "@/types/prep";

export function DashboardWorkspace({ packs }: { packs: PrepPackSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredPacks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let next = packs.filter((pack) => {
      const matchesQuery =
        !normalizedQuery ||
        pack.companyName.toLowerCase().includes(normalizedQuery) ||
        pack.role.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || pack.status === status;
      return matchesQuery && matchesStatus;
    });

    next = [...next].sort((left, right) => {
      if (sortBy === "questions") {
        return right.totalQuestions - left.totalQuestions;
      }

      if (sortBy === "company") {
        return left.companyName.localeCompare(right.companyName);
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return next;
  }, [packs, query, status, sortBy]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] bg-white/85 p-5 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by company or role"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
            >
              <option value="recent">Most recent</option>
              <option value="questions">Most questions</option>
              <option value="company">Company A-Z</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
          <p>{filteredPacks.length} prep pack{filteredPacks.length === 1 ? "" : "s"} visible</p>
          {(query || status !== "all" || sortBy !== "recent") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setSortBy("recent");
              }}
              className="rounded-full bg-sand px-4 py-2 font-semibold text-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredPacks.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-white/75 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">No matching packs</p>
          <p className="mt-3 text-sm leading-7 text-ink/65">
            Try a different company, role, or status filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredPacks.map((pack) => (
            <PrepPackCard key={pack._id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}
