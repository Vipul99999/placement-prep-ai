import Link from "next/link";
import { verifyEmailChangeToken } from "@/lib/user";

export default async function VerifyEmailChangePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let success = false;
  let message = "This verification link is invalid or has expired.";

  if (token) {
    try {
      await verifyEmailChangeToken(token);
      success = true;
      message = "Your email address has been updated. Sign in again if you were logged out on another device.";
    } catch (error) {
      message = error instanceof Error ? error.message : message;
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-[2rem] bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Email Change</p>
        <h1 className="mt-3 text-4xl font-black text-ink">
          {success ? "Your new email is confirmed" : "This email change could not be completed"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/account" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            Back to account
          </Link>
          <Link href="/login" className="rounded-full bg-sand px-5 py-3 text-sm font-semibold text-ink">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
