import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Forgot Password</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Get back into your prep workspace.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Enter your email and we’ll prepare a reset link. In local development, the link opens
          directly on-screen so the flow stays easy to test.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-sm text-ink/70">
          Remembered it? <Link href="/login" className="font-semibold text-ocean">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
