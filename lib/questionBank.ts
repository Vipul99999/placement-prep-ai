import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { createQuestionFingerprint } from "@/lib/hash";
import type { QuestionFeedback } from "@/types/prep";

interface ReuseParams {
  category: string;
  difficulty?: string;
  role: string;
  companyName: string;
  tags?: string[];
  limit: number;
  excludeQuestionIds?: string[];
}

interface QuestionInsertInput {
  category: string;
  subtopic: string;
  difficulty: string;
  question: string;
  answerShort: string;
  answerDetailed?: string;
  interviewerIntent?: string;
  answerOpening?: string;
  answerFramework?: string[];
  revisionChecklist?: string[];
  example?: string;
  followUps: string[];
  commonMistakes: string[];
  tags: string[];
  roleTypes: string[];
  companyTypes: string[];
  sourceType: "ai-generated";
}

export async function findReusableQuestions(params: ReuseParams) {
  const db = await getDb();
  const query: Record<string, unknown> = {
    category: params.category,
    qualityScore: { $gte: 0.35 }
  };

  if (params.difficulty && params.difficulty !== "Mixed") {
    query.difficulty = params.difficulty;
  }

  const relevanceSignals = [
    ...(params.tags?.length ? [{ tags: { $in: params.tags } }] : []),
    { roleTypes: { $in: [params.role] } },
    { companyTypes: { $in: [params.companyName] } }
  ];

  if (relevanceSignals.length) {
    query.$or = relevanceSignals;
  }

  if (params.excludeQuestionIds?.length) {
    query._id = {
      $nin: params.excludeQuestionIds.map((id) => new ObjectId(id))
    };
  }

  const results = await db
    .collection("questions")
    .find(query)
    .sort({
      qualityScore: -1,
      usageCount: -1,
      createdAt: -1
    })
    .limit(params.limit)
    .toArray();

  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.fingerprint)) {
      return false;
    }
    seen.add(item.fingerprint);
    return true;
  });
}

export async function insertUniqueQuestions(questions: QuestionInsertInput[]) {
  const db = await getDb();
  const results: ObjectId[] = [];
  const now = new Date();
  const normalizedQuestions = questions.map((item) => ({
    ...item,
    fingerprint: createQuestionFingerprint(item.category, item.subtopic, item.question)
  }));
  const existingQuestions = await db
    .collection("questions")
    .find<{
      _id: ObjectId;
      fingerprint: string;
    }>({
      fingerprint: {
        $in: normalizedQuestions.map((item) => item.fingerprint)
      }
    })
    .toArray();
  const existingByFingerprint = new Map(existingQuestions.map((item) => [item.fingerprint, item._id]));

  for (const item of normalizedQuestions) {
    const existingId = existingByFingerprint.get(item.fingerprint);

    if (existingId) {
      await db.collection("questions").updateOne(
        { _id: existingId },
        {
          $set: { updatedAt: now },
          $addToSet: {
            tags: { $each: item.tags },
            roleTypes: { $each: item.roleTypes },
            companyTypes: { $each: item.companyTypes }
          }
        }
      );
      results.push(existingId);
      continue;
    }

    try {
      const insertResult = await db.collection("questions").insertOne({
        ...item,
        sourceType: "ai-generated",
        qualityScore: 0.72,
        usageCount: 0,
        feedbackCount: 0,
        helpfulCount: 0,
        createdAt: now,
        updatedAt: now
      });

      existingByFingerprint.set(item.fingerprint, insertResult.insertedId);
      results.push(insertResult.insertedId);
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        const existing = await db.collection("questions").findOne<{ _id: ObjectId }>({
          fingerprint: item.fingerprint
        });
        if (existing?._id) {
          existingByFingerprint.set(item.fingerprint, existing._id);
          results.push(existing._id);
          continue;
        }
      }
      throw error;
    }
  }

  return results;
}

export async function linkQuestionsToPrepPack(
  prepPackId: string | ObjectId,
  questionIds: ObjectId[],
  category: string
) {
  const db = await getDb();
  const prepObjectId = typeof prepPackId === "string" ? new ObjectId(prepPackId) : prepPackId;
  const existingCount = await db.collection("prepPackQuestions").countDocuments({
    prepPackId: prepObjectId,
    category,
    isHidden: { $ne: true }
  });
  const now = new Date();

  await Promise.all(
    questionIds.map((questionId, index) =>
      db.collection("prepPackQuestions").updateOne(
        {
          prepPackId: prepObjectId,
          questionId
        },
        {
          $set: {
            isHidden: false,
            updatedAt: now
          },
          $setOnInsert: {
            prepPackId: prepObjectId,
            questionId,
            category,
            order: existingCount + index,
            isBookmarked: false,
            userNotes: "",
            practiceStatus: "not_started",
            createdAt: now
          }
        },
        { upsert: true }
      )
    )
  );

  if (questionIds.length) {
    await db.collection("questions").updateMany(
      { _id: { $in: questionIds } },
      {
        $inc: { usageCount: 1 },
        $set: { updatedAt: now }
      }
    );
  }
}

export async function recordQuestionFeedback(input: {
  userId: string;
  prepPackId: string | ObjectId;
  questionId: string | ObjectId;
  joinId: string | ObjectId;
  feedback: QuestionFeedback;
}) {
  const db = await getDb();
  const prepPackObjectId = typeof input.prepPackId === "string" ? new ObjectId(input.prepPackId) : input.prepPackId;
  const questionObjectId = typeof input.questionId === "string" ? new ObjectId(input.questionId) : input.questionId;
  const joinObjectId = typeof input.joinId === "string" ? new ObjectId(input.joinId) : input.joinId;
  const now = new Date();

  await db.collection("questionFeedback").updateOne(
    {
      userId: input.userId,
      prepPackId: prepPackObjectId,
      questionId: questionObjectId
    },
    {
      $set: {
        joinId: joinObjectId,
        feedback: input.feedback,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  const qualityDelta =
    input.feedback === "helpful"
      ? 0.05
      : input.feedback === "inaccurate"
        ? -0.2
      : input.feedback === "irrelevant"
        ? -0.12
        : input.feedback === "too_repetitive"
          ? -0.08
          : -0.05;

  await db.collection("questions").updateOne(
    { _id: questionObjectId },
    [
      {
        $set: {
          feedbackCount: { $add: [{ $ifNull: ["$feedbackCount", 0] }, 1] },
          helpfulCount: {
            $add: [{ $ifNull: ["$helpfulCount", 0] }, input.feedback === "helpful" ? 1 : 0]
          },
          qualityScore: {
            $max: [
              0.1,
              {
                $min: [1, { $add: [{ $ifNull: ["$qualityScore", 0.72] }, qualityDelta] }]
              }
            ]
          },
          updatedAt: now
        }
      }
    ]
  );

  await db.collection("prepPackQuestions").updateOne(
    { _id: joinObjectId },
    {
      $set: {
        lastFeedback: input.feedback,
        updatedAt: now
      }
    }
  );
}

export async function getCategoryQuestionCounts(prepPackId: string | ObjectId) {
  const db = await getDb();
  const prepObjectId = typeof prepPackId === "string" ? new ObjectId(prepPackId) : prepPackId;

  const rows = await db
    .collection("prepPackQuestions")
    .aggregate<{ _id: string; totalQuestions: number }>([
      { $match: { prepPackId: prepObjectId, isHidden: { $ne: true } } },
      { $group: { _id: "$category", totalQuestions: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    .toArray();

  return rows.map((row) => ({
    category: row._id,
    totalQuestions: row.totalQuestions
  }));
}
