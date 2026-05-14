import { MongoClient } from "mongodb";
import { requireEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB || "placement_prep_ai";
let clientPromise = global.__mongoClientPromise__;

function getClientPromise() {
  if (!clientPromise) {
    const mongoUri = requireEnv("MONGODB_URI");
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();

    if (process.env.NODE_ENV !== "production") {
      global.__mongoClientPromise__ = clientPromise;
    }
  }

  return clientPromise;
}

let indexesPromise: Promise<void> | null = null;

async function ensureIndexes() {
  if (indexesPromise) {
    return indexesPromise;
  }

  indexesPromise = (async () => {
    const mongoClient = await getClientPromise();
    const db = mongoClient.db(dbName);

    await Promise.all([
      db.collection("questions").createIndexes([
        { key: { fingerprint: 1 }, name: "fingerprint_unique", unique: true },
        { key: { category: 1 }, name: "category_idx" },
        { key: { tags: 1 }, name: "tags_idx" },
        { key: { difficulty: 1 }, name: "difficulty_idx" },
        { key: { roleTypes: 1 }, name: "roleTypes_idx" },
        { key: { usageCount: -1 }, name: "usageCount_idx" }
      ]),
      db.collection("prepPackQuestions").createIndexes([
        { key: { prepPackId: 1 }, name: "prepPackId_idx" },
        { key: { prepPackId: 1, category: 1 }, name: "prepPack_category_idx" },
        {
          key: { prepPackId: 1, questionId: 1 },
          name: "prepPack_question_unique",
          unique: true
        }
      ]),
      db.collection("prepPacks").createIndexes([
        { key: { userId: 1 }, name: "userId_idx" },
        { key: { createdAt: -1 }, name: "createdAt_idx" },
        { key: { companyName: 1 }, name: "companyName_idx" },
        { key: { role: 1 }, name: "role_idx" }
      ]),
      db.collection("users").createIndexes([
        { key: { email: 1 }, name: "email_unique", unique: true },
        { key: { createdAt: -1 }, name: "users_createdAt_idx" },
        { key: { emailVerifiedAt: 1 }, name: "users_emailVerified_idx" }
      ]),
      db.collection("passwordResetTokens").createIndexes([
        { key: { tokenHash: 1 }, name: "tokenHash_unique", unique: true },
        { key: { userId: 1 }, name: "passwordReset_userId_idx" },
        { key: { expiresAt: 1 }, name: "passwordReset_expiry_idx", expireAfterSeconds: 0 }
      ]),
      db.collection("emailVerificationTokens").createIndexes([
        { key: { tokenHash: 1 }, name: "emailVerify_tokenHash_unique", unique: true },
        { key: { userId: 1 }, name: "emailVerify_userId_idx" },
        { key: { expiresAt: 1 }, name: "emailVerify_expiry_idx", expireAfterSeconds: 0 }
      ]),
      db.collection("emailChangeTokens").createIndexes([
        { key: { tokenHash: 1 }, name: "emailChange_tokenHash_unique", unique: true },
        { key: { userId: 1 }, name: "emailChange_userId_idx" },
        { key: { expiresAt: 1 }, name: "emailChange_expiry_idx", expireAfterSeconds: 0 }
      ]),
      db.collection("resumeUploads").createIndexes([
        { key: { userId: 1, createdAt: -1 }, name: "resume_user_created_idx" }
      ]),
      db.collection("auditLogs").createIndexes([
        { key: { createdAt: -1 }, name: "audit_createdAt_idx" },
        { key: { actorUserId: 1, createdAt: -1 }, name: "audit_actor_idx" },
        { key: { action: 1, createdAt: -1 }, name: "audit_action_idx" }
      ]),
      db.collection("rateLimitBuckets").createIndexes([
        { key: { expiresAt: 1 }, name: "rateLimit_expiry_idx", expireAfterSeconds: 0 },
        { key: { scope: 1, bucketStart: 1 }, name: "rateLimit_scope_bucket_idx" }
      ]),
      db.collection("securityAlerts").createIndexes([
        { key: { status: 1, updatedAt: -1 }, name: "securityAlerts_status_idx" },
        { key: { type: 1, status: 1 }, name: "securityAlerts_type_status_idx" }
      ]),
      db.collection("userSessions").createIndexes([
        { key: { userId: 1, createdAt: -1 }, name: "userSessions_user_created_idx" },
        { key: { sessionId: 1 }, name: "userSessions_session_unique", unique: true }
      ]),
      db.collection("questionFeedback").createIndexes([
        { key: { userId: 1, prepPackId: 1, questionId: 1 }, name: "questionFeedback_unique", unique: true },
        { key: { questionId: 1, updatedAt: -1 }, name: "questionFeedback_question_idx" }
      ]),
      db.collection("mockInterviewRatings").createIndexes([
        { key: { userId: 1, prepPackId: 1, questionId: 1 }, name: "mockRatings_unique", unique: true },
        { key: { prepPackId: 1, updatedAt: -1 }, name: "mockRatings_prep_idx" }
      ]),
      db.collection("jobDescriptions").createIndex({ hash: 1 }, { unique: true, name: "hash_unique" }),
      db.collection("generationJobs").createIndexes([
        { key: { prepPackId: 1, category: 1 }, name: "job_lookup_idx" },
        { key: { status: 1, updatedAt: -1 }, name: "job_status_idx" },
        { key: { status: 1, nextAttemptAt: 1 }, name: "job_retry_idx" }
      ]),
      db.collection("userPreferences").createIndexes([
        { key: { userId: 1 }, name: "userPreferences_user_unique", unique: true }
      ]),
      db.collection("supportTickets").createIndexes([
        { key: { userId: 1, createdAt: -1 }, name: "support_user_created_idx" },
        { key: { status: 1, updatedAt: -1 }, name: "support_status_updated_idx" }
      ]),
      db.collection("productFeedback").createIndexes([
        { key: { userId: 1, createdAt: -1 }, name: "feedback_user_created_idx" },
        { key: { sentiment: 1, createdAt: -1 }, name: "feedback_sentiment_created_idx" }
      ]),
      db.collection("aiUsageDaily").createIndexes([
        { key: { userId: 1, dateKey: 1 }, name: "aiUsage_user_day_unique", unique: true },
        { key: { expiresAt: 1 }, name: "aiUsage_expiry_idx", expireAfterSeconds: 0 }
      ])
    ]);
  })();

  return indexesPromise;
}

export async function getDb() {
  await ensureIndexes();
  const mongoClient = await getClientPromise();
  return mongoClient.db(dbName);
}
