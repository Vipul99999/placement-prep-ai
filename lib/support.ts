import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  OnboardingState,
  ProductFeedbackSummary,
  SupportTicketSummary,
  TargetDifficulty,
  UserPreferences
} from "@/types/prep";

const defaultPreferences: UserPreferences = {
  defaultPreparationDays: 15,
  defaultDifficulty: "Mixed",
  weeklyGoalSessions: 4,
  emailProductUpdates: true,
  emailStudyReminders: true
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const db = await getDb();
  const item = await db.collection("userPreferences").findOne<Partial<UserPreferences> & { userId?: ObjectId }>({
    userId: new ObjectId(userId)
  });

  return {
    ...defaultPreferences,
    ...(item ?? {})
  };
}

export async function updateUserPreferences(input: {
  userId: string;
  defaultPreparationDays: 7 | 15 | 30;
  defaultDifficulty: TargetDifficulty;
  weeklyGoalSessions: number;
  emailProductUpdates: boolean;
  emailStudyReminders: boolean;
}) {
  const db = await getDb();
  const now = new Date();
  await db.collection("userPreferences").updateOne(
    { userId: new ObjectId(input.userId) },
    {
      $set: {
        userId: new ObjectId(input.userId),
        defaultPreparationDays: input.defaultPreparationDays,
        defaultDifficulty: input.defaultDifficulty,
        weeklyGoalSessions: input.weeklyGoalSessions,
        emailProductUpdates: input.emailProductUpdates,
        emailStudyReminders: input.emailStudyReminders,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const db = await getDb();
  const [user, prepPacks, uploads, startedPractice] = await Promise.all([
    db.collection("users").findOne<{ emailVerifiedAt?: Date | null }>({ _id: new ObjectId(userId) }),
    db.collection("prepPacks").countDocuments({ userId }),
    db.collection("resumeUploads").countDocuments({ userId }),
    db.collection("prepPackQuestions").countDocuments({
      practiceStatus: { $in: ["learning", "mastered"] },
      prepPackId: {
        $in: (
          await db.collection("prepPacks").find({ userId }, { projection: { _id: 1 } }).toArray()
        ).map((item) => item._id)
      }
    })
  ]);

  const flags = [
    Boolean(user?.emailVerifiedAt),
    prepPacks > 0,
    uploads > 0,
    startedPractice > 0
  ];

  return {
    hasVerifiedEmail: flags[0],
    hasPrepPack: flags[1],
    hasResumeUpload: flags[2],
    hasStartedPractice: flags[3],
    percentComplete: Math.round((flags.filter(Boolean).length / flags.length) * 100)
  };
}

export async function createSupportTicket(input: {
  userId: string;
  email: string;
  topic: string;
  message: string;
}) {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection("supportTickets").insertOne({
    userId: input.userId,
    email: input.email,
    topic: input.topic,
    message: input.message,
    status: "open",
    createdAt: now,
    updatedAt: now
  });

  return result.insertedId.toString();
}

export async function createProductFeedback(input: {
  userId: string;
  email: string;
  area: string;
  sentiment: "love_it" | "needs_work" | "bug";
  message: string;
}) {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection("productFeedback").insertOne({
    userId: input.userId,
    email: input.email,
    area: input.area,
    sentiment: input.sentiment,
    message: input.message,
    createdAt: now,
    updatedAt: now
  });

  return result.insertedId.toString();
}

export async function listUserSupportTickets(userId: string): Promise<SupportTicketSummary[]> {
  const db = await getDb();
  const rows = await db.collection("supportTickets").find({ userId }).sort({ createdAt: -1 }).limit(10).toArray();
  return JSON.parse(JSON.stringify(rows, (_, value) => (value instanceof ObjectId ? value.toString() : value)));
}

export async function listUserFeedback(userId: string): Promise<ProductFeedbackSummary[]> {
  const db = await getDb();
  const rows = await db.collection("productFeedback").find({ userId }).sort({ createdAt: -1 }).limit(10).toArray();
  return JSON.parse(JSON.stringify(rows, (_, value) => (value instanceof ObjectId ? value.toString() : value)));
}

