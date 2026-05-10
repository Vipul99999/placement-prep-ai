import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function CreateLoading() {
  return <PageSkeleton title="Loading create workspace" subtitle="Preparing your prep pack builder." sections={3} />;
}

