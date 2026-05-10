import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Reset Password</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Create a fresh password.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Set a new password and return to your placement prep without losing your saved progress.
        </p>
        <div className="mt-8">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Reset token missing or invalid. Start again from the forgot-password page.
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-ink/70">
          Need a new link? <Link href="/forgot-password" className="font-semibold text-ocean">Request another reset</Link>
        </p>
      </div>
    </main>
  );
}
