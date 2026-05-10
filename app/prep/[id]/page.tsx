import { notFound, redirect } from "next/navigation";
import { PrepPackView } from "@/components/prep/prep-pack-view";
import { getAuthSession } from "@/lib/auth";
import { getPrepPackDetail } from "@/lib/prepPack";

export default async function PrepPackPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  let pack = null;
  let error = "";

  try {
    pack = await getPrepPackDetail(id, session.user.id);
  } catch (pageError) {
    error = pageError instanceof Error ? pageError.message : "Unable to load this prep pack";
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-[2rem] bg-white/85 p-8 shadow-lg ring-1 ring-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Prep Pack Unavailable</p>
          <h1 className="mt-2 text-4xl font-black text-ink">We could not load this prep pack right now.</h1>
          <p className="mt-4 text-sm leading-7 text-ink/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!pack) {
    notFound();
  }

  return <PrepPackView pack={pack} />;
}
