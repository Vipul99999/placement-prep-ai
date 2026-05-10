export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Privacy</p>
        <h1 className="mt-3 text-4xl font-black text-ink">Privacy at PlacementPrep AI</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-ink/75">
          <p>We store only the data needed to generate prep packs, save your progress, and keep your account secure.</p>
          <p>Resume uploads, prep packs, notes, bookmarks, and security logs stay in MongoDB and can be removed through your account controls.</p>
          <p>Generated questions are stored in a shared reusable bank, while your personal notes and progress remain tied to your account.</p>
          <p>Operational audit logs and generation-job records are retained for limited periods and cleaned through retention jobs.</p>
        </div>
      </section>
    </main>
  );
}
