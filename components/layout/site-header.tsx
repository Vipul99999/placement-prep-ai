"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthNav } from "@/components/auth/auth-nav";

const signedInNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "Create" },
  { href: "/help", label: "Help" }
];

const publicNavItems = [
  { href: "/create", label: "Try Demo Flow" },
  { href: "/help", label: "Help" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const navItems = session?.user ? signedInNavItems : publicNavItems;

  return (
    <header className="glass rounded-[1.75rem] border border-white/80 px-4 py-4 shadow-sm sm:rounded-full sm:px-5 sm:py-3">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-sky to-ocean text-sm font-black text-white shadow-lg">
            P
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight text-ink sm:text-xl">
              <span className="bg-gradient-to-r from-ink via-ocean to-sky bg-clip-text text-transparent">
                PlacementPrep
              </span>{" "}
              <span className="text-accent">AI</span>
            </p>
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45 sm:block">
              Company-wise prep studio
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-5 sm:flex">
          {status !== "loading" ? (
            <nav className="flex items-center gap-2 text-sm font-semibold text-ink/70">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as never}
                  className={
                    pathname === item.href
                      ? "rounded-full bg-ink px-4 py-2 text-white"
                      : "rounded-full px-4 py-2 transition hover:bg-white/70"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <AuthNav />
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-white/80 px-3 text-ink shadow-sm sm:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span className="text-sm font-bold">{open ? "Close" : "Menu"}</span>
        </button>
      </div>

      {open ? (
        <div className="mt-4 border-t border-black/5 pt-4 sm:hidden">
          {status !== "loading" ? (
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as never}
                  onClick={() => setOpen(false)}
                  className={
                    pathname === item.href
                      ? "rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
                      : "rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-ink/75"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="mt-4 rounded-2xl bg-white/70 p-3">
            <AuthNav compact />
          </div>
        </div>
      ) : null}
    </header>
  );
}
