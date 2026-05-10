"use client";

import { getPasswordStrength } from "@/lib/password";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const percentage = Math.max(12, Math.min(100, (strength.score / 5) * 100));

  return (
    <div className="rounded-2xl bg-sand p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean">Password strength</p>
        <span className="text-sm font-semibold text-ink/70">{strength.label}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={
            strength.label === "Weak"
              ? "h-full rounded-full bg-red-500"
              : strength.label === "Fair"
                ? "h-full rounded-full bg-amber-500"
                : strength.label === "Good"
                  ? "h-full rounded-full bg-sky"
                  : "h-full rounded-full bg-ocean"
          }
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-ink/60 sm:grid-cols-2">
        <Check label="10+ characters" ok={strength.checks.minLength} />
        <Check label="Uppercase letter" ok={strength.checks.upper} />
        <Check label="Lowercase letter" ok={strength.checks.lower} />
        <Check label="Number" ok={strength.checks.number} />
        <Check label="Symbol" ok={strength.checks.symbol} />
      </div>
    </div>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return <span className={ok ? "text-emerald-700" : "text-ink/50"}>{ok ? "Yes" : "No"} - {label}</span>;
}
