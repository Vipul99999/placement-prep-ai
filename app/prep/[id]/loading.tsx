import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function PrepLoading() {
  return <PageSkeleton title="Loading prep pack" subtitle="Pulling your categories, roadmap, and question progress." sections={4} />;
}

