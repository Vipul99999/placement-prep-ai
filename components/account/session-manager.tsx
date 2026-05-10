"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { AccountSessionSummary } from "@/types/prep";

export function SessionManager({
  initialSessions
}: {
  initialSessions: AccountSessionSummary[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  function revoke(sessionId: string, isCurrent: boolean) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/account/sessions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to revoke session");
        }

        setSessions((current) =>
          current.map((item) =>
            item.sessionId === sessionId
              ? { ...item, revokedAt: new Date().toISOString(), current: false }
              : item
          )
        );

        showToast({
          title: isCurrent ? "Current session signed out" : "Session revoked",
          tone: "success"
        });

        if (isCurrent) {
          await signOut({ callbackUrl: "/login" });
        } else {
          router.refresh();
        }
      } catch (error) {
        showToast({
          title: "Could not revoke session",
          description: error instanceof Error ? error.message : "Please try again.",
          tone: "error"
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.sessionId} className="rounded-2xl bg-sand p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">{session.deviceLabel}</p>
              <p className="mt-1 text-xs text-ink/55">{session.userAgent}</p>
              <p className="mt-2 text-xs text-ink/50">
                Last seen {new Date(session.lastSeenAt).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {session.current ? (
                <span className="rounded-full bg-ocean px-3 py-1 text-xs font-semibold text-white">Current</span>
              ) : null}
              {session.revokedAt ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/60">Revoked</span>
              ) : (
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => revoke(session.sessionId, Boolean(session.current))}
                >
                  {session.current ? "Sign Out This Device" : "Revoke"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
