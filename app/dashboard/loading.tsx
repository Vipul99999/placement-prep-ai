import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function DashboardLoading() {
  return <PageSkeleton title="Loading dashboard" subtitle="Gathering your prep packs and progress." sections={4} />;
}

