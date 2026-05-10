import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { PrivacyControls } from "@/components/account/privacy-controls";
import { PreferencesForm } from "@/components/account/preferences-form";
import { ResumeManager } from "@/components/account/resume-manager";
import { SessionManager } from "@/components/account/session-manager";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { QuickFeedbackCard } from "@/components/feedback/quick-feedback-card";
import { getAuthSession } from "@/lib/auth";
import { ProfileForm } from "@/components/account/profile-form";
import { getUserProfile, listUserSessions } from "@/lib/user";
import { listResumeUploads } from "@/lib/uploads";
import { getUserPreferences, listUserFeedback, listUserSupportTickets } from "@/lib/support";

export default async function AccountPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  const [sessions, uploads, preferences, tickets, feedbackItems] = await Promise.all([
    listUserSessions(session.user.id, session.user.sessionId),
    listResumeUploads(session.user.id),
    getUserPreferences(session.user.id),
    listUserSupportTickets(session.user.id),
    listUserFeedback(session.user.id)
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[1.85rem] bg-gradient-to-br from-ink via-ocean to-sky p-8 text-white shadow-glow">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Account</p>
          <h1 className="mt-3 text-4xl font-black">Keep your prep workspace secure.</h1>
          <p className="mt-4 text-sm leading-7 text-white/80">
            Update your password whenever you need to. This helps protect your prep packs, notes,
            bookmarks, and interview practice progress.
          </p>
          <div className="mt-6 rounded-[1.5rem] bg-white/12 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Signed in as</p>
            <p className="mt-2 text-lg font-bold">{profile.email}</p>
            <p className="mt-3 text-sm text-white/80">
              {profile.emailVerified ? "Email verified" : "Email verification still pending"}
            </p>
          </div>
        </section>

        <div className="space-y-6">
          {!profile.emailVerified ? (
            <section className="rounded-[1.85rem] border border-amber-200 bg-amber-50 p-8 shadow-lg ring-1 ring-amber-100">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Verification Needed</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Verify your email to unlock AI actions</h2>
              <p className="mt-4 text-sm leading-7 text-ink/70">
                Creating prep packs, uploading resumes, and generating detailed answers stay locked until your email is verified.
              </p>
              <div className="mt-6">
                <ResendVerificationForm initialEmail={profile.email} />
              </div>
            </section>
          ) : null}
          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Profile</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Keep your profile tidy</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              A clean display name makes your study workspace feel personal and easier to navigate.
            </p>
            <div className="mt-8">
              <ProfileForm initialName={profile.name} email={profile.email} pendingEmail={profile.pendingEmail} />
            </div>
          </section>

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Preferences</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Set your default study rhythm</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Save the defaults you use most so the product feels personal every time you come back.
            </p>
            <div className="mt-8">
              <PreferencesForm initialPreferences={preferences} />
            </div>
          </section>

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Change Password</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Update your login credentials</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Choose a password that is easy for you to remember but hard for others to guess.
            </p>
            <div className="mt-8">
              <ChangePasswordForm />
            </div>
          </section>

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Sessions</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Manage signed-in devices</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Revoke old devices quickly if you sign in on a shared laptop or change your password.
            </p>
            <div className="mt-8">
              <SessionManager initialSessions={sessions} />
            </div>
          </section>

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Privacy Controls</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Manage your data directly</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Export your study data or permanently delete your account and personal workspace when needed.
            </p>
            <div className="mt-8">
              <PrivacyControls />
            </div>
          </section>

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Resume Uploads</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Clean up extracted resume data</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Remove uploads you no longer want saved in your workspace.
            </p>
            <div className="mt-8">
              <ResumeManager initialUploads={uploads} />
            </div>
          </section>

          <section className="rounded-[1.85rem] border border-sky/20 bg-sky/5 p-8 shadow-lg ring-1 ring-sky/10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">2FA Roadmap</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Optional two-factor auth is planned next</h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              The account model is prepared for stronger login controls. TOTP-based 2FA can be added without changing your saved prep data structure later.
            </p>
          </section>

          <QuickFeedbackCard area="Account" />

          <section className="rounded-[1.85rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Recent Support Activity</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Track help requests and product feedback</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Support Tickets</p>
                {tickets.length === 0 ? (
                  <div className="rounded-2xl bg-snow p-4 text-sm text-ink/65">No support tickets yet.</div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket._id} className="rounded-2xl bg-snow p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-ink">{ticket.topic}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-ink/70">{ticket.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Product Feedback</p>
                {feedbackItems.length === 0 ? (
                  <div className="rounded-2xl bg-snow p-4 text-sm text-ink/65">No feedback shared yet.</div>
                ) : (
                  feedbackItems.map((item) => (
                    <div key={item._id} className="rounded-2xl bg-snow p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-ink">{item.area}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-ink/70">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
