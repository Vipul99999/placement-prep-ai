import Link from "next/link";
import { QuickFeedbackCard } from "@/components/feedback/quick-feedback-card";
import { SupportForm } from "@/components/support/support-form";
import { getAuthSession } from "@/lib/auth";

const faqs = [
  {
    question: "Why does generation happen category by category?",
    answer: "It keeps the app faster, lowers timeout risk, and lets us reuse high-quality questions before calling AI again."
  },
  {
    question: "Why do I need a verified email for AI actions?",
    answer: "It protects the platform from abuse and gives us a safer way to support you if something breaks."
  },
  {
    question: "Can I delete my prep data later?",
    answer: "Yes. You can export or delete your account, prep packs, and resume uploads from the account page."
  }
];

export default async function HelpPage() {
  const session = await getAuthSession();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.85rem] bg-gradient-to-br from-ink via-ocean to-sky p-8 text-white shadow-glow">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Help Center</p>
          <h1 className="mt-3 text-4xl font-black">Support that feels human, not hidden.</h1>
          <p className="mt-4 text-sm leading-7 text-white/80">
            If prep generation feels off, uploads fail, or something in the workspace feels confusing, send it here.
          </p>

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl bg-white/12 p-4">
                <p className="text-sm font-bold">{faq.question}</p>
                <p className="mt-2 text-sm text-white/80">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Contact Support</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Send a real issue report</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              The more precise your topic and message are, the faster we can help.
            </p>
            <div className="mt-6">
              {session?.user?.id ? (
                <SupportForm />
              ) : (
                <div className="rounded-[1.5rem] bg-snow p-5">
                  <p className="text-sm leading-7 text-ink/70">
                    Sign in to send a support ticket tied to your account and prep workspace.
                  </p>
                  <div className="mt-4">
                    <Link href="/login" className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
                      Log In For Support
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {session?.user?.id ? (
            <QuickFeedbackCard area="Help Center" />
          ) : (
            <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Feedback</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Want to shape the product?</h2>
              <p className="mt-4 text-sm leading-7 text-ink/70">
                Sign in and share what feels strong, weak, or confusing. Product feedback is connected to real usage context.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
