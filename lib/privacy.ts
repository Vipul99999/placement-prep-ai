import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function exportUserData(userId: string) {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);

  const [user, prepPacks, prepPackQuestions, resumeUploads, auditLogs] = await Promise.all([
    db.collection("users").findOne({ _id: userObjectId }, { projection: { passwordHash: 0 } }),
    db.collection("prepPacks").find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection("prepPackQuestions").aggregate([
      {
        $lookup: {
          from: "prepPacks",
          localField: "prepPackId",
          foreignField: "_id",
          as: "prepPack"
        }
      },
      { $unwind: "$prepPack" },
      { $match: { "prepPack.userId": userId } },
      {
        $lookup: {
          from: "questions",
          localField: "questionId",
          foreignField: "_id",
          as: "question"
        }
      },
      { $unwind: { path: "$question", preserveNullAndEmptyArrays: true } }
    ]).toArray(),
    db.collection("resumeUploads").find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection("auditLogs").find({ actorUserId: userId }).sort({ createdAt: -1 }).limit(200).toArray()
  ]);

  return JSON.parse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user,
        prepPacks,
        prepPackQuestions,
        resumeUploads,
        auditLogs
      },
      (_, value) => {
        if (value instanceof ObjectId) {
          return value.toString();
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }
    )
  );
}

export async function deletePrepPackDeep(prepPackId: string, userId: string) {
  const db = await getDb();
  const prepObjectId = new ObjectId(prepPackId);
  const pack = await db.collection("prepPacks").findOne({ _id: prepObjectId, userId });

  if (!pack) {
    throw new Error("Prep pack not found");
  }

  await Promise.all([
    db.collection("prepPackQuestions").deleteMany({ prepPackId: prepObjectId }),
    db.collection("generationJobs").deleteMany({ prepPackId: prepObjectId }),
    db.collection("mockInterviewRatings").deleteMany({ prepPackId: prepObjectId }),
    db.collection("questionFeedback").deleteMany({ prepPackId: prepObjectId }),
    db.collection("prepPacks").deleteOne({ _id: prepObjectId, userId })
  ]);
}

export async function deleteUserAccountDeep(userId: string) {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);
  const prepPacks = await db.collection("prepPacks").find({ userId }, { projection: { _id: 1 } }).toArray();
  const prepPackIds = prepPacks.map((item) => item._id);

  const tasks = [
    db.collection("prepPacks").deleteMany({ userId }),
    db.collection("resumeUploads").deleteMany({ userId }),
    db.collection("passwordResetTokens").deleteMany({ userId: userObjectId }),
    db.collection("emailVerificationTokens").deleteMany({ userId: userObjectId }),
    db.collection("emailChangeTokens").deleteMany({ userId: userObjectId }),
    db.collection("userSessions").deleteMany({ userId: userObjectId }),
    db.collection("mockInterviewRatings").deleteMany({ userId }),
    db.collection("questionFeedback").deleteMany({ userId }),
    db.collection("auditLogs").deleteMany({ actorUserId: userId }),
    db.collection("users").deleteOne({ _id: userObjectId })
  ];

  if (prepPackIds.length) {
    tasks.push(db.collection("prepPackQuestions").deleteMany({ prepPackId: { $in: prepPackIds } }));
    tasks.push(db.collection("generationJobs").deleteMany({ prepPackId: { $in: prepPackIds } }));
  }

  await Promise.all(tasks);
}
