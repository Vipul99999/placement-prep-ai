import type { Metadata } from "next";
import { CreatePrepForm } from "@/components/create/create-prep-form";
import { getAuthSession } from "@/lib/auth";
import { SITE_DESCRIPTION } from "@/lib/site";
import { getUserPreferences } from "@/lib/support";

export const metadata: Metadata = {
  title: "Create Prep Pack",
  description: `Build a company-wise prep pack with structured questions, roadmaps, and mock interview support. ${SITE_DESCRIPTION}`
};

export default async function CreatePage() {
  const session = await getAuthSession();
  let preferences = null;

  if (session?.user?.id) {
    try {
      preferences = await getUserPreferences(session.user.id);
    } catch {
      preferences = null;
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-[2rem] bg-white/80 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Create</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Generate a prep pack that actually feels usable.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Enter the company, role, and job description. The app will analyze the input, reuse good
          questions from the global bank, and generate only what is missing.
        </p>
        {!session?.user?.id ? (
          <div className="mt-6 rounded-2xl border border-sky/20 bg-sky/10 px-4 py-3 text-sm text-ink/80">
            You can explore the full form first. Sign in only when you are ready to generate and save your prep pack.
          </div>
        ) : null}
        {session?.user?.emailVerified === false ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Verify your email before generating a prep pack. You can still prepare the inputs now and submit once
            verification is complete.
          </div>
        ) : null}
        <div className="mt-8">
          <CreatePrepForm initialPreferences={preferences} />
        </div>
      </div>
    </main>
  );
}
