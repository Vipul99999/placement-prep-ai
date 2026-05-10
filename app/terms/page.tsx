export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Terms</p>
        <h1 className="mt-3 text-4xl font-black text-ink">Terms of Use</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-ink/75">
          <p>PlacementPrep AI provides study guidance and likely interview preparation material, not guaranteed interview questions or hiring promises.</p>
          <p>You are responsible for the content you upload, including resumes and job descriptions, and should avoid submitting confidential third-party information.</p>
          <p>We may throttle abusive usage, restrict unsafe inputs, and suspend access when behavior threatens system safety or other users.</p>
          <p>By using the product, you agree that AI-generated output should be reviewed by you before relying on it in interviews or applications.</p>
        </div>
      </section>
    </main>
  );
}
