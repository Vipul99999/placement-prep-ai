import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Sign Up</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Create a placement prep workspace.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Your account keeps company-wise prep packs, study notes, bookmarks, and progress synced
          to one profile. New accounts must verify email before AI-powered actions are unlocked.
        </p>
        <div className="mt-8">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-6 text-sm text-ink/70">
          Already have an account? <Link href="/login" className="font-semibold text-ocean">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
