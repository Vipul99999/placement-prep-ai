import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export default async function VerificationSentPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Verify Email</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Check your inbox before continuing.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          We sent a verification link so only trusted, real accounts can create prep packs, upload resumes, and use AI generation.
        </p>
        <div className="mt-8">
          <ResendVerificationForm initialEmail={email || ""} />
        </div>
        <p className="mt-6 text-sm text-ink/70">
          Already verified? <Link href="/login" className="font-semibold text-ocean">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
