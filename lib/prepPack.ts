import { ObjectId } from "mongodb";
import { logAuditEvent } from "@/lib/audit";
import { preparePrepInputForAI } from "@/lib/ai-safety";
import { invalidateCache, withCache } from "@/lib/cache";
import {
  recordPrepPackCreationUsage,
  releaseQuestionGenerationBudget,
  reserveQuestionGenerationBudget
} from "@/lib/cost-controls";
import { getDb } from "@/lib/mongodb";
import { analyzeInput, generateQuestionsForCategory, generateRoadmap } from "@/lib/gemini";
import { createJDHash } from "@/lib/hash";
import {
  findReusableQuestions,
  getCategoryQuestionCounts,
  insertUniqueQuestions,
  linkQuestionsToPrepPack,
  recordQuestionFeedback
} from "@/lib/questionBank";
import type { AnalysisResult, PrepAnalytics, PrepInput, QuestionFeedback, RecommendedCategory } from "@/types/prep";
import { assertValidObjectId } from "@/lib/validators";
import { getNextReviewDate } from "@/lib/spacedRepetition";
import { getResumeUpload } from "@/lib/uploads";
import { sendAlertNotification } from "@/lib/monitoring";

const INITIAL_CATEGORY_COUNT = 10;

function invalidateUserPrepCaches(userId: string, prepPackId?: string) {
  invalidateCache(`dashboard:${userId}`);
  invalidateCache(`prep-list:${userId}`);
  if (prepPackId) {
    invalidateCache(`prep:${prepPackId}`);
    invalidateCache(`prep-analytics:${prepPackId}:${userId}`);
  }
}

async function enqueueCategoryJobs(args: {
  prepPackId: ObjectId;
  analysis: AnalysisResult;
  difficulty: string;
}) {
  const db = await getDb();
  const now = new Date();

  if (!args.analysis.recommendedCategories.length) {
    return;
  }

  await db.collection("generationJobs").insertMany(
    args.analysis.recommendedCategories.map((category) => ({
      prepPackId: args.prepPackId,
      category: category.name,
      requestedCount: Math.min(Math.max(8, Math.min(category.recommendedQuestionCount, INITIAL_CATEGORY_COUNT)), 15),
      reusedCount: 0,
      generatedCount: 0,
        difficulty: args.difficulty,
        status: "pending",
        error: "",
        attemptCount: 0,
        maxAttempts: 3,
        nextAttemptAt: now,
        lastFailureAt: null,
        createdAt: now,
        updatedAt: now
      }))
  );
}

export async function queueCategoryGenerationJob(args: {
  prepPackId: string;
  category: string;
  count: number;
  difficulty: string;
}) {
  assertValidObjectId(args.prepPackId, "prep pack id");
  const db = await getDb();
  const now = new Date();
  const existingPending = await db.collection("generationJobs").findOne({
    prepPackId: new ObjectId(args.prepPackId),
    category: args.category,
    difficulty: args.difficulty,
    status: { $in: ["pending", "running"] }
  });

  if (existingPending) {
    await db.collection("generationJobs").updateOne(
      { _id: existingPending._id },
      {
        $set: {
          requestedCount: Math.max(existingPending.requestedCount ?? 0, Math.min(Math.max(1, args.count), 25)),
          updatedAt: now
        }
      }
    );
    return;
  }

  await db.collection("generationJobs").insertOne({
    prepPackId: new ObjectId(args.prepPackId),
    category: args.category,
    requestedCount: Math.min(Math.max(1, args.count), 25),
    reusedCount: 0,
    generatedCount: 0,
    difficulty: args.difficulty,
    status: "pending",
    error: "",
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: now,
    lastFailureAt: null,
    createdAt: now,
    updatedAt: now
  });
}

export async function createPrepPack(input: PrepInput, userId: string) {
  const db = await getDb();
  const resumeUpload =
    input.resumeUploadId ? await getResumeUpload({ resumeUploadId: input.resumeUploadId, userId }) : null;
  const enrichedInputRaw: PrepInput = {
    ...input,
    resumeText: input.resumeText || resumeUpload?.extractedText || undefined,
    resumeFileName: input.resumeFileName || resumeUpload?.fileName || undefined,
    projectHighlights: input.projectHighlights?.length
      ? input.projectHighlights
      : (resumeUpload?.projectHighlights ?? [])
  };
  const prepared = preparePrepInputForAI(enrichedInputRaw);
  const enrichedInput = prepared.safeInput;
  const analysis = await analyzeInput(enrichedInput);
  const jdHash = createJDHash(input.jobDescription);
  const now = new Date();

  await db.collection("jobDescriptions").updateOne(
    { hash: jdHash },
    {
      $setOnInsert: {
        hash: jdHash,
        fullText: input.jobDescription,
        createdAt: now
      }
    },
    { upsert: true }
  );

  const roadmap = await generateRoadmap({
    companyName: enrichedInput.companyName,
    role: enrichedInput.role,
    preparationDays: enrichedInput.preparationDays,
    analysis,
    resumeText: enrichedInput.resumeText,
    projectHighlights: enrichedInput.projectHighlights
  });

  const prepPackInsert = await db.collection("prepPacks").insertOne({
    userId,
    companyName: enrichedInput.companyName,
    role: enrichedInput.role,
    jobDescriptionHash: jdHash,
    jobDescriptionPreview: enrichedInput.jobDescription.slice(0, 1000),
    experienceLevel: enrichedInput.experienceLevel,
    preparationDays: enrichedInput.preparationDays,
    knownSkills: enrichedInput.knownSkills,
    difficulty: enrichedInput.difficulty,
    resumeUploadId: enrichedInput.resumeUploadId || "",
    resumeFileName: enrichedInput.resumeFileName || "",
    projectHighlights: enrichedInput.projectHighlights || [],
    status: "generating",
    analysis,
    categoryPlan: analysis.recommendedCategories,
    roadmap: roadmap.days,
    totalQuestions: 0,
    createdAt: now,
    updatedAt: now
  });

  await enqueueCategoryJobs({
    prepPackId: prepPackInsert.insertedId,
    analysis,
    difficulty: enrichedInput.difficulty
  });
  await recordPrepPackCreationUsage(userId);

  await logAuditEvent({
    actorUserId: userId,
    action: "prep_pack_created",
    entityType: "prepPack",
    entityId: prepPackInsert.insertedId.toString(),
    metadata: {
      companyName: enrichedInput.companyName,
      role: enrichedInput.role,
      usedResumeUpload: Boolean(enrichedInput.resumeUploadId),
      queuedCategories: analysis.recommendedCategories.length
    }
  });

  invalidateUserPrepCaches(userId);

  return prepPackInsert.insertedId.toString();
}

async function runCategoryGeneration(args: {
  prepPackId: ObjectId;
  userId: string;
  prepPack: PrepInput;
  analysis: AnalysisResult;
  category: RecommendedCategory;
  count: number;
  difficulty: string;
}) {
  const db = await getDb();
  const prepPackId = args.prepPackId;
  const existingLinks = await db
    .collection("prepPackQuestions")
    .find(
      { prepPackId, category: args.category.name },
      { projection: { questionId: 1 } }
    )
    .toArray();

  const reusable = await findReusableQuestions({
    category: args.category.name,
    difficulty: args.difficulty,
    role: args.prepPack.role,
    companyName: args.prepPack.companyName,
    tags: [...args.analysis.primarySkills, ...args.analysis.secondarySkills],
    limit: args.count,
    excludeQuestionIds: existingLinks.map((item) => item.questionId.toString())
  });

  const reusableIds = reusable.map((item) => item._id as ObjectId);
  await linkQuestionsToPrepPack(prepPackId, reusableIds, args.category.name);

  const missingCount = Math.max(args.count - reusableIds.length, 0);
  let generatedIds: ObjectId[] = [];

  if (missingCount > 0) {
    await reserveQuestionGenerationBudget(args.userId, missingCount);
    let generated: Awaited<ReturnType<typeof generateQuestionsForCategory>>;
    try {
      generated = await generateQuestionsForCategory({
        companyName: args.prepPack.companyName,
        role: args.prepPack.role,
        category: args.category,
        analysis: args.analysis,
        preparationDays: args.prepPack.preparationDays,
        difficulty: args.difficulty,
        count: missingCount,
        resumeText: args.prepPack.resumeText,
        projectHighlights: args.prepPack.projectHighlights
      });
    } catch (error) {
      await releaseQuestionGenerationBudget(args.userId, missingCount);
      throw error;
    }

    generatedIds = await insertUniqueQuestions(
      generated.questions.map((question) => ({
        category: args.category.name,
        subtopic: question.subtopic,
        difficulty: question.difficulty,
        question: question.question,
        answerShort: question.answerShort,
        answerDetailed: "",
        example: question.example || "",
        followUps: question.followUps ?? [],
        commonMistakes: question.commonMistakes ?? [],
        tags: [...new Set([args.category.name, ...question.tags])],
        roleTypes: [args.prepPack.role],
        companyTypes: [args.prepPack.companyName],
        sourceType: "ai-generated"
      }))
    );

    await linkQuestionsToPrepPack(prepPackId, generatedIds, args.category.name);
  }

  return {
    reusedCount: reusableIds.length,
    generatedCount: generatedIds.length
  };
}

export async function hydrateCategory(args: {
  prepPackId: ObjectId;
  userId: string;
  prepPack: PrepInput;
  analysis: AnalysisResult;
  category: RecommendedCategory;
  count: number;
  difficulty: string;
}) {
  const db = await getDb();
  const now = new Date();
  const jobInsert = await db.collection("generationJobs").insertOne({
    prepPackId: args.prepPackId,
    category: args.category.name,
    requestedCount: args.count,
    reusedCount: 0,
    generatedCount: 0,
    difficulty: args.difficulty,
    status: "running",
    error: "",
    createdAt: now,
    updatedAt: now
  });

  try {
    const result = await runCategoryGeneration(args);
    await db.collection("generationJobs").updateOne(
      { _id: jobInsert.insertedId },
      {
        $set: {
          ...result,
          status: "completed",
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    await db.collection("generationJobs").updateOne(
      { _id: jobInsert.insertedId },
      {
        $set: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown generation error",
          updatedAt: new Date()
        }
      }
    );
    throw error;
  }
}

async function finalizePrepPackStatus(prepPackId: ObjectId) {
  const db = await getDb();
  const [counts, jobs] = await Promise.all([
    getCategoryQuestionCounts(prepPackId),
    db.collection("generationJobs").find({ prepPackId }).toArray()
  ]);

  const totalQuestions = counts.reduce((sum, item) => sum + item.totalQuestions, 0);
  const hasRunning = jobs.some((job) => job.status === "running" || job.status === "pending");
  const hasFailed = jobs.some((job) => job.status === "failed");

  await db.collection("prepPacks").updateOne(
    { _id: prepPackId },
    {
      $set: {
        totalQuestions,
        status: hasRunning ? "generating" : totalQuestions > 0 ? "completed" : hasFailed ? "failed" : "completed",
        generationHealth: hasFailed ? "partial_failure" : "healthy",
        updatedAt: new Date()
      }
    }
  );
  const prepPack = await db.collection("prepPacks").findOne({ _id: prepPackId }, { projection: { userId: 1 } });
  if (prepPack?.userId) {
    invalidateUserPrepCaches(prepPack.userId, prepPackId.toString());
  }
}

export async function processPrepPackGenerationJobs(args: {
  prepPackId: string;
  userId: string;
  limit?: number;
}) {
  assertValidObjectId(args.prepPackId, "prep pack id");
  const db = await getDb();
  const prepObjectId = new ObjectId(args.prepPackId);
  const limit = args.limit ?? 2;
  const prepPack = await db.collection("prepPacks").findOne({
    _id: prepObjectId,
    userId: args.userId
  });

  if (!prepPack) {
    throw new Error("Prep pack not found");
  }

  let processed = 0;
  const now = new Date();

  while (processed < limit) {
    const job = await db.collection<any>("generationJobs").findOneAndUpdate(
      {
        prepPackId: prepObjectId,
        status: "pending",
        nextAttemptAt: { $lte: now }
      },
      {
        $set: {
          status: "running",
          error: "",
          updatedAt: new Date()
        },
        $inc: {
          attemptCount: 1
        }
      },
      {
        sort: { createdAt: 1 },
        returnDocument: "after"
      }
    );

    if (!job) {
      break;
    }

    const category = prepPack.categoryPlan.find((item: RecommendedCategory) => item.name === job.category);
    if (!category) {
      await db.collection("generationJobs").updateOne(
        { _id: job._id },
        {
          $set: {
            status: "failed",
            error: "Category not found in prep pack plan",
            updatedAt: new Date()
          }
        }
      );
      processed += 1;
      continue;
    }

    try {
      const result = await runCategoryGeneration({
        prepPackId: prepObjectId,
        userId: args.userId,
        prepPack: {
          companyName: prepPack.companyName,
          role: prepPack.role,
          jobDescription: prepPack.jobDescriptionPreview,
          experienceLevel: prepPack.experienceLevel,
          preparationDays: prepPack.preparationDays,
          knownSkills: prepPack.knownSkills,
          difficulty: prepPack.difficulty,
          resumeUploadId: prepPack.resumeUploadId,
          resumeFileName: prepPack.resumeFileName,
          resumeText: prepPack.resumeText,
          projectHighlights: prepPack.projectHighlights
        },
        analysis: prepPack.analysis,
        category,
        count: job.requestedCount,
        difficulty: job.difficulty || prepPack.difficulty
      });

      await db.collection("generationJobs").updateOne(
        { _id: job._id },
        {
          $set: {
            ...result,
            status: "completed",
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      const attemptCount = Number(job.attemptCount ?? 1);
      const maxAttempts = Number(job.maxAttempts ?? 3);
      const isBudgetLimitError =
        error instanceof Error &&
        (error.message.includes("Daily AI question-generation limit reached") ||
          error.message.includes("Daily detailed-answer limit reached") ||
          error.message.includes("Daily prep-pack limit reached"));
      const shouldRetry = !isBudgetLimitError && attemptCount < maxAttempts;
      const retryDelayMs = Math.min(60_000, 5_000 * Math.pow(2, Math.max(0, attemptCount - 1)));
      await db.collection("generationJobs").updateOne(
        { _id: job._id },
        {
          $set: {
            error: error instanceof Error ? error.message : "Unknown generation error",
            status: shouldRetry ? "pending" : "failed",
            lastFailureAt: new Date(),
            nextAttemptAt: new Date(Date.now() + retryDelayMs),
            updatedAt: new Date()
          }
        }
      );
      if (!shouldRetry) {
        await sendAlertNotification({
          title: `Category generation exhausted retries for ${job.category}`,
          severity: "error",
          kind: "generation_job_failed",
          metadata: {
            prepPackId: args.prepPackId,
            category: job.category,
            attempts: attemptCount,
            error: error instanceof Error ? error.message : "Unknown generation error"
          }
        });
      }
    }

    processed += 1;
  }

  await finalizePrepPackStatus(prepObjectId);
  return getGenerationSummary(args.prepPackId);
}

export async function processAnyQueuedGenerationJobs(limit = 5) {
  const db = await getDb();
  const pendingJobs = await db
    .collection("generationJobs")
    .aggregate<{ prepPackId: ObjectId; userId: string }>([
      { $match: { status: "pending", nextAttemptAt: { $lte: new Date() } } },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: "prepPacks",
          localField: "prepPackId",
          foreignField: "_id",
          as: "prepPack"
        }
      },
      { $unwind: "$prepPack" },
      {
        $group: {
          _id: "$prepPackId",
          prepPackId: { $first: "$prepPackId" },
          userId: { $first: "$prepPack.userId" }
        }
      },
      { $limit: limit }
    ])
    .toArray();

  const results = [];
  for (const item of pendingJobs) {
    results.push(
      await processPrepPackGenerationJobs({
        prepPackId: item.prepPackId.toString(),
        userId: item.userId,
        limit: 3
      })
    );
  }

  return results;
}

export async function getPrepPackDetail(id: string, userId: string) {
  assertValidObjectId(id, "prep pack id");
  return withCache(`prep:${id}:${userId}`, 15_000, async () => {
    const db = await getDb();
    const prepPack = await db.collection("prepPacks").findOne({
      _id: new ObjectId(id),
      userId
    });
    if (!prepPack) {
      return null;
    }

    const [categorySummary, analytics, generationSummary] = await Promise.all([
      getCategoryQuestionCounts(id),
      getPrepPackAnalytics(id, userId),
      getGenerationSummary(id)
    ]);

    return {
      ...serializeDocument(prepPack),
      categorySummary,
      analytics,
      generationSummary
    };
  });
}

export async function getPrepPackQuestions(args: {
  prepPackId: string;
  userId: string;
  category: string;
  page: number;
  limit: number;
}) {
  assertValidObjectId(args.prepPackId, "prep pack id");
  const db = await getDb();
  const skip = (args.page - 1) * args.limit;
  const prepPackId = new ObjectId(args.prepPackId);
  const prepPack = await db.collection("prepPacks").findOne({ _id: prepPackId, userId: args.userId });

  if (!prepPack) {
    throw new Error("Prep pack not found");
  }

  const [rows, total] = await Promise.all([
    db
      .collection("prepPackQuestions")
      .aggregate([
        {
          $match: {
            prepPackId,
            category: args.category
          }
        },
        { $sort: { order: 1 } },
        { $skip: skip },
        { $limit: args.limit },
        {
          $lookup: {
            from: "questions",
            localField: "questionId",
            foreignField: "_id",
            as: "question"
          }
        },
        { $unwind: "$question" }
      ])
      .toArray(),
    db.collection("prepPackQuestions").countDocuments({
      prepPackId,
      category: args.category
    })
  ]);

  return {
    items: rows.map((row) => ({
      joinId: row._id.toString(),
      questionId: row.question._id.toString(),
      category: row.category,
      order: row.order,
      isBookmarked: row.isBookmarked,
      userNotes: row.userNotes,
      practiceStatus: row.practiceStatus,
      reviewStreak: row.reviewStreak ?? 0,
      lastReviewedAt: row.lastReviewedAt,
      nextReviewAt: row.nextReviewAt,
      lastFeedback: row.lastFeedback,
      question: serializeDocument(row.question)
    })),
    total,
    page: args.page,
    limit: args.limit,
    totalPages: Math.max(1, Math.ceil(total / args.limit))
  };
}

export async function listPrepPacks(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const skip = (page - 1) * limit;
  const search = options?.search?.trim();
  const status = options?.status?.trim();
  const allowedStatuses = new Set(["draft", "generating", "completed", "failed"]);
  if (status && !allowedStatuses.has(status)) {
    throw new Error("Invalid prep-pack status filter");
  }

  const cacheKey = `prep-list:${userId}:${page}:${limit}:${search ?? ""}:${status ?? ""}`;
  return withCache(cacheKey, 15_000, async () => {
    const db = await getDb();
    const filter: Record<string, unknown> = { userId };
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } }
      ];
    }

    const [packs, total] = await Promise.all([
      db
        .collection("prepPacks")
        .find(filter, {
          projection: {
            userId: 1,
            companyName: 1,
            role: 1,
            experienceLevel: 1,
            preparationDays: 1,
            difficulty: 1,
            status: 1,
            totalQuestions: 1,
            createdAt: 1,
            updatedAt: 1
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("prepPacks").countDocuments(filter)
    ]);

    return {
      items: packs.map((pack) => serializeDocument(pack)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    };
  });
}

export async function getGenerationSummary(prepPackId: string | ObjectId) {
  const db = await getDb();
  const prepObjectId = typeof prepPackId === "string" ? new ObjectId(prepPackId) : prepPackId;
  const rows = await db
    .collection("generationJobs")
    .find({ prepPackId: prepObjectId })
    .sort({ createdAt: 1 })
    .toArray();

  return rows.map((row) => ({
    category: row.category,
    status: row.status,
    requestedCount: row.requestedCount,
    reusedCount: row.reusedCount,
    generatedCount: row.generatedCount,
    error: row.error || "",
    attemptCount: row.attemptCount ?? 0,
    nextAttemptAt: row.nextAttemptAt?.toISOString?.() || ""
  }));
}

export async function getMockInterviewQuestions(prepPackId: string, userId: string, count: number) {
  assertValidObjectId(prepPackId, "prep pack id");
  const db = await getDb();
  const prepPack = await db.collection("prepPacks").findOne({
    _id: new ObjectId(prepPackId),
    userId
  });

  if (!prepPack) {
    throw new Error("Prep pack not found");
  }

  const rows = await db
    .collection("prepPackQuestions")
    .aggregate([
      { $match: { prepPackId: new ObjectId(prepPackId) } },
      { $sample: { size: count } },
      {
        $lookup: {
          from: "questions",
          localField: "questionId",
          foreignField: "_id",
          as: "question"
        }
      },
      { $unwind: "$question" }
    ])
    .toArray();

  return rows.map((row) => ({
    questionId: row.question._id.toString(),
    category: row.category,
    difficulty: row.question.difficulty,
    question: row.question.question,
    answerShort: row.question.answerShort,
    answerDetailed: row.question.answerDetailed,
    followUps: row.question.followUps
  }));
}

export async function saveMockInterviewRating(args: {
  prepPackId: string;
  userId: string;
  questionId: string;
  rating: "needs-work" | "okay" | "strong";
}) {
  assertValidObjectId(args.prepPackId, "prep pack id");
  assertValidObjectId(args.questionId, "question id");
  const db = await getDb();
  const now = new Date();
  await db.collection("mockInterviewRatings").updateOne(
    {
      userId: args.userId,
      prepPackId: new ObjectId(args.prepPackId),
      questionId: new ObjectId(args.questionId)
    },
    {
      $set: {
        rating: args.rating,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );
  invalidateUserPrepCaches(args.userId, args.prepPackId);
}

export async function updatePrepPackQuestionState(args: {
  prepPackId: string;
  joinId: string;
  userId: string;
  isBookmarked?: boolean;
  userNotes?: string;
  practiceStatus?: "not_started" | "learning" | "mastered";
  markReviewed?: boolean;
  feedback?: QuestionFeedback;
}) {
  assertValidObjectId(args.prepPackId, "prep pack id");
  assertValidObjectId(args.joinId, "question state id");
  const db = await getDb();
  const prepPack = await db.collection("prepPacks").findOne({
    _id: new ObjectId(args.prepPackId),
    userId: args.userId
  });

  if (!prepPack) {
    throw new Error("Prep pack not found");
  }

  const update: Record<string, unknown> = {};
  if (typeof args.isBookmarked === "boolean") {
    update.isBookmarked = args.isBookmarked;
  }
  if (typeof args.userNotes === "string") {
    update.userNotes = args.userNotes;
  }
  if (args.practiceStatus) {
    update.practiceStatus = args.practiceStatus;
  }

  const existing = await db.collection("prepPackQuestions").findOne<{
    reviewStreak?: number;
    practiceStatus?: "not_started" | "learning" | "mastered";
    questionId?: ObjectId;
  }>({
    _id: new ObjectId(args.joinId),
    prepPackId: new ObjectId(args.prepPackId)
  });

  if (!existing) {
    throw new Error("Question state not found");
  }

  const now = new Date();
  if (args.markReviewed || args.practiceStatus) {
    const reviewStreak = (existing.reviewStreak ?? 0) + 1;
    const reviewStatus = args.practiceStatus ?? existing.practiceStatus ?? "learning";
    const schedule = getNextReviewDate({
      practiceStatus: reviewStatus,
      reviewStreak,
      from: now
    });

    update.reviewStreak = reviewStreak;
    update.lastReviewedAt = now;
    update.nextReviewAt = schedule.nextReviewAt;
    update.reviewIntervalDays = schedule.intervalDays;
  }

  const result = await db.collection("prepPackQuestions").updateOne(
    {
      _id: new ObjectId(args.joinId),
      prepPackId: new ObjectId(args.prepPackId)
    },
    {
      $set: {
        ...update,
        updatedAt: now
      }
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Question state not found");
  }

  if (args.feedback) {
    await recordQuestionFeedback({
      userId: args.userId,
      prepPackId: args.prepPackId,
      questionId: existing.questionId as ObjectId,
      joinId: args.joinId,
      feedback: args.feedback
    });
  }

  invalidateUserPrepCaches(args.userId, args.prepPackId);
}

export async function getPrepPackAnalytics(prepPackId: string, userId: string): Promise<PrepAnalytics> {
  assertValidObjectId(prepPackId, "prep pack id");
  return withCache(`prep-analytics:${prepPackId}:${userId}`, 15_000, async () => {
    const db = await getDb();
    const prepPack = await db.collection("prepPacks").findOne({
      _id: new ObjectId(prepPackId),
      userId
    });

    if (!prepPack) {
      throw new Error("Prep pack not found");
    }

    const rows = await db
      .collection("prepPackQuestions")
      .aggregate<{
        _id: string;
        total: number;
        bookmarked: number;
        learning: number;
        mastered: number;
        notStarted: number;
        dueReviews: number;
        activeStreaks: number;
      }>([
        { $match: { prepPackId: new ObjectId(prepPackId) } },
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            bookmarked: { $sum: { $cond: ["$isBookmarked", 1, 0] } },
            learning: { $sum: { $cond: [{ $eq: ["$practiceStatus", "learning"] }, 1, 0] } },
            mastered: { $sum: { $cond: [{ $eq: ["$practiceStatus", "mastered"] }, 1, 0] } },
            notStarted: { $sum: { $cond: [{ $eq: ["$practiceStatus", "not_started"] }, 1, 0] } },
            dueReviews: { $sum: { $cond: [{ $lte: ["$nextReviewAt", new Date()] }, 1, 0] } },
            activeStreaks: { $sum: { $cond: [{ $gt: ["$reviewStreak", 0] }, 1, 0] } }
          }
        }
      ])
      .toArray();

    const totalQuestions = rows.reduce((sum, row) => sum + row.total, 0);
    const bookmarkedQuestions = rows.reduce((sum, row) => sum + row.bookmarked, 0);
    const learningQuestions = rows.reduce((sum, row) => sum + row.learning, 0);
    const masteredQuestions = rows.reduce((sum, row) => sum + row.mastered, 0);
    const notStartedQuestions = rows.reduce((sum, row) => sum + row.notStarted, 0);
    const dueReviewCount = rows.reduce((sum, row) => sum + row.dueReviews, 0);
    const activeReviewStreaks = rows.reduce((sum, row) => sum + row.activeStreaks, 0);
    const categoriesStarted = rows.filter((row) => row.learning + row.mastered > 0).length;
    const categoriesMastered = rows.filter((row) => row.total > 0 && row.mastered === row.total).length;

    return {
      totalQuestions,
      bookmarkedQuestions,
      notStartedQuestions,
      learningQuestions,
      masteredQuestions,
      completionRate: totalQuestions === 0 ? 0 : Math.round((masteredQuestions / totalQuestions) * 100),
      categoriesStarted,
      categoriesMastered,
      dueReviewCount,
      activeReviewStreaks
    };
  });
}

export async function getDashboardAnalytics(userId: string) {
  return withCache(`dashboard:${userId}`, 15_000, async () => {
    const db = await getDb();
    const prepPacks = await db
      .collection("prepPacks")
      .find({ userId }, { projection: { _id: 1, totalQuestions: 1, status: 1, companyName: 1, role: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    const prepPackIds = prepPacks.map((pack) => pack._id);

    const progressRows = prepPackIds.length
      ? await db
          .collection("prepPackQuestions")
          .aggregate<{
            _id: ObjectId;
            bookmarked: number;
            learning: number;
            mastered: number;
            dueReviews: number;
          }>([
            { $match: { prepPackId: { $in: prepPackIds } } },
            {
              $group: {
                _id: "$prepPackId",
                bookmarked: { $sum: { $cond: ["$isBookmarked", 1, 0] } },
                learning: { $sum: { $cond: [{ $eq: ["$practiceStatus", "learning"] }, 1, 0] } },
                mastered: { $sum: { $cond: [{ $eq: ["$practiceStatus", "mastered"] }, 1, 0] } },
                dueReviews: { $sum: { $cond: [{ $lte: ["$nextReviewAt", new Date()] }, 1, 0] } }
              }
            }
          ])
          .toArray()
      : [];

    const totals = progressRows.reduce(
      (acc, row) => {
        acc.bookmarked += row.bookmarked;
        acc.learning += row.learning;
        acc.mastered += row.mastered;
        acc.dueReviews += row.dueReviews;
        return acc;
      },
      { bookmarked: 0, learning: 0, mastered: 0, dueReviews: 0 }
    );

    const queuedJobs = await db.collection("generationJobs").countDocuments({
      prepPackId: { $in: prepPackIds },
      status: { $in: ["pending", "running"] }
    });

    return {
      totalPrepPacks: prepPacks.length,
      completedPrepPacks: prepPacks.filter((pack) => pack.status === "completed").length,
      totalQuestions: prepPacks.reduce((sum, pack) => sum + (pack.totalQuestions ?? 0), 0),
      bookmarkedQuestions: totals.bookmarked,
      learningQuestions: totals.learning,
      masteredQuestions: totals.mastered,
      dueReviewCount: totals.dueReviews,
      queuedJobs
    };
  });
}

export function serializeDocument<T extends Record<string, any>>(doc: T): any {
  return JSON.parse(
    JSON.stringify(doc, (_, value) => {
      if (value instanceof ObjectId) {
        return value.toString();
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      return value;
    })
  );
}
