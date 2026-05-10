import Link from "next/link";
import { verifyEmailWithToken } from "@/lib/user";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let status: "success" | "error" = "success";
  let message = "Your email is verified. You can sign in and start preparing.";

  if (!token?.trim()) {
    status = "error";
    message = "This verification link is missing a token.";
  } else {
    try {
      await verifyEmailWithToken(token);
    } catch (error) {
      status = "error";
      message = error instanceof Error ? error.message : "Unable to verify email";
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Email Verification</p>
        <h1 className="mt-2 text-4xl font-black text-ink">
          {status === "success" ? "Your email is verified." : "Verification could not be completed."}
        </h1>
        <p className="mt-4 text-sm leading-7 text-ink/70">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={status === "success" ? "/login" : "/verify-email/sent"}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            {status === "success" ? "Go to Login" : "Request New Link"}
          </Link>
          <Link href="/" className="rounded-full bg-sand px-5 py-3 text-sm font-semibold text-ink">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
