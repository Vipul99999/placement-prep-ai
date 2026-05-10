"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNav({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-ink/50">Checking session...</span>;
  }

  if (!session?.user) {
    return (
      <div className={`flex ${compact ? "flex-col items-stretch" : "items-center"} gap-3`}>
        <Link href="/help" className="text-sm font-medium text-ink/70">
          Help
        </Link>
        <Link href="/login" className="text-sm font-medium text-ink/70">
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex ${compact ? "flex-col items-stretch" : "items-center"} gap-3`}>
      <span className={`${compact ? "text-sm" : "hidden text-sm sm:inline"} text-ink/70`}>
        {session.user.name || session.user.email}
      </span>
      <Link
        href="/help"
        className="rounded-full bg-white/80 px-4 py-2 text-center text-sm font-semibold text-ink"
      >
        Help
      </Link>
      <Link
        href="/account"
        className="rounded-full bg-white/80 px-4 py-2 text-center text-sm font-semibold text-ink"
      >
        Account
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink"
      >
        Log Out
      </button>
    </div>
  );
}
