import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Login</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Pick up your prep where you left off.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Sign in to keep your prep packs, bookmarks, notes, and progress tied to your account.
        </p>
        <div className="mt-8">
          <AuthForm mode="login" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70">
          <p>
            New here? <Link href="/signup" className="font-semibold text-ocean">Create an account</Link>
          </p>
          <Link href="/forgot-password" className="font-semibold text-accent">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
