import type { PracticeStatus } from "@/types/prep";

export function getNextReviewDate(args: {
  practiceStatus: PracticeStatus;
  reviewStreak: number;
  from?: Date;
}) {
  const from = args.from ?? new Date();
  const streak = Math.max(args.reviewStreak, 0);

  const intervalDays =
    args.practiceStatus === "mastered"
      ? Math.min(21, Math.max(3, 3 * Math.max(streak, 1)))
      : args.practiceStatus === "learning"
        ? Math.min(7, Math.max(1, streak))
        : 1;

  return {
    intervalDays,
    nextReviewAt: new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  };
}
