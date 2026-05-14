import { getOptionalEnv } from "@/lib/env";
import { getDb } from "@/lib/mongodb";
import { sendAlertNotification, sendMonitoringEvent } from "@/lib/monitoring";

type DailyUsageDoc = {
  userId: string;
  dateKey: string;
  prepPacksCreated?: number;
  generatedQuestionCount?: number;
  detailedAnswersGenerated?: number;
  analysisCalls?: number;
  roadmapCalls?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

type UsageField = "prepPacksCreated" | "generatedQuestionCount" | "detailedAnswersGenerated" | "analysisCalls" | "roadmapCalls";

type UsageIncrement = Partial<Record<UsageField, number>>;

function readPositiveEnv(name: string, fallback: number) {
  const value = Number(getOptionalEnv(name));
  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getExpiryDate() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
}

async function getUsageDoc(userId: string) {
  const db = await getDb();
  return db.collection<DailyUsageDoc>("aiUsageDaily").findOne({
    userId,
    dateKey: getTodayKey()
  });
}

async function upsertUsage(userId: string, increment: UsageIncrement) {
  const db = await getDb();
  const now = new Date();
  await db.collection("aiUsageDaily").updateOne(
    {
      userId,
      dateKey: getTodayKey()
    },
    {
      $inc: increment,
      $set: {
        updatedAt: now,
        expiresAt: getExpiryDate()
      },
      $setOnInsert: {
        userId,
        dateKey: getTodayKey(),
        prepPacksCreated: 0,
        generatedQuestionCount: 0,
        detailedAnswersGenerated: 0,
        analysisCalls: 0,
        roadmapCalls: 0,
        createdAt: now
      }
    },
    { upsert: true }
  );
}

function getLimits() {
  return {
    prepPacksCreated: readPositiveEnv("DAILY_PREP_PACK_LIMIT", 4),
    generatedQuestionCount: readPositiveEnv("DAILY_GENERATED_QUESTION_LIMIT", 180),
    detailedAnswersGenerated: readPositiveEnv("DAILY_DETAILED_ANSWER_LIMIT", 40)
  };
}

async function maybeSendBudgetWarning(args: {
  userId: string;
  field: keyof ReturnType<typeof getLimits>;
  used: number;
  limit: number;
}) {
  const usagePercent = Math.round((args.used / args.limit) * 100);
  if (usagePercent < 80) {
    return;
  }

  await sendMonitoringEvent({
    source: "cost-controls",
    event: "daily_budget_warning",
    level: usagePercent >= 100 ? "error" : "warning",
    message: `User reached ${usagePercent}% of daily ${args.field} budget`,
    metadata: {
      userId: args.userId,
      field: args.field,
      used: args.used,
      limit: args.limit
    }
  });

  if (usagePercent >= 100) {
    await sendAlertNotification({
      title: `Daily AI budget exhausted for ${args.field}`,
      severity: "warning",
      kind: "daily_ai_budget_exhausted",
      metadata: {
        userId: args.userId,
        field: args.field,
        used: args.used,
        limit: args.limit
      }
    });
  }
}

export async function assertCanCreatePrepPackToday(userId: string) {
  const limits = getLimits();
  const usage = await getUsageDoc(userId);
  const used = usage?.prepPacksCreated ?? 0;

  if (used >= limits.prepPacksCreated) {
    throw new Error("Daily prep-pack limit reached. Try again tomorrow.");
  }

  await maybeSendBudgetWarning({
    userId,
    field: "prepPacksCreated",
    used,
    limit: limits.prepPacksCreated
  });
}

export async function recordPrepPackCreationUsage(userId: string) {
  await upsertUsage(userId, {
    prepPacksCreated: 1,
    analysisCalls: 1,
    roadmapCalls: 1
  });
}

export async function reserveQuestionGenerationBudget(userId: string, count: number) {
  const limits = getLimits();
  const usage = await getUsageDoc(userId);
  const used = usage?.generatedQuestionCount ?? 0;

  if (used + count > limits.generatedQuestionCount) {
    throw new Error("Daily AI question-generation limit reached. Try again tomorrow.");
  }

  await upsertUsage(userId, {
    generatedQuestionCount: count
  });
  await maybeSendBudgetWarning({
    userId,
    field: "generatedQuestionCount",
    used: used + count,
    limit: limits.generatedQuestionCount
  });
}

export async function releaseQuestionGenerationBudget(userId: string, count: number) {
  if (count < 1) {
    return;
  }

  await upsertUsage(userId, {
    generatedQuestionCount: -count
  });
}

export async function reserveDetailedAnswerBudget(userId: string) {
  const limits = getLimits();
  const usage = await getUsageDoc(userId);
  const used = usage?.detailedAnswersGenerated ?? 0;

  if (used + 1 > limits.detailedAnswersGenerated) {
    throw new Error("Daily detailed-answer limit reached. Try again tomorrow.");
  }

  await upsertUsage(userId, {
    detailedAnswersGenerated: 1
  });
  await maybeSendBudgetWarning({
    userId,
    field: "detailedAnswersGenerated",
    used: used + 1,
    limit: limits.detailedAnswersGenerated
  });
}

export async function releaseDetailedAnswerBudget(userId: string) {
  await upsertUsage(userId, {
    detailedAnswersGenerated: -1
  });
}
