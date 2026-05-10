import mammoth from "mammoth";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const MAX_RESUME_TEXT_LENGTH = 20000;

function extractProjectHighlights(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const projectCandidates = lines.filter((line) =>
    /project|built|developed|created|dashboard|portal|app|system/i.test(line)
  );

  return [...new Set(projectCandidates)].slice(0, 8);
}

export async function extractTextFromResume(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (lowerName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  return buffer.toString("utf8");
}

export async function saveResumeUpload(input: {
  userId: string;
  fileName: string;
  extractedText: string;
}) {
  const db = await getDb();
  const cappedText = input.extractedText.slice(0, MAX_RESUME_TEXT_LENGTH);
  const projectHighlights = extractProjectHighlights(cappedText);
  const now = new Date();

  const result = await db.collection("resumeUploads").insertOne({
    userId: input.userId,
    fileName: input.fileName,
    extractedText: cappedText,
    extractedTextPreview: cappedText.slice(0, 800),
    projectHighlights,
    createdAt: now,
    updatedAt: now
  });

  return {
    _id: result.insertedId.toString(),
    fileName: input.fileName,
    extractedTextPreview: cappedText.slice(0, 800),
    projectHighlights
  };
}

export async function listResumeUploads(userId: string) {
  const db = await getDb();
  const rows = await db
    .collection("resumeUploads")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();

  return rows.map((row) => ({
    _id: row._id.toString(),
    fileName: row.fileName,
    extractedTextPreview: row.extractedTextPreview,
    projectHighlights: row.projectHighlights ?? [],
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString()
  }));
}

export async function getResumeUpload(input: { resumeUploadId: string; userId: string }) {
  if (!ObjectId.isValid(input.resumeUploadId)) {
    return null;
  }

  const db = await getDb();
  const upload = await db.collection("resumeUploads").findOne({
    _id: new ObjectId(input.resumeUploadId),
    userId: input.userId
  });

  return upload;
}

export async function deleteResumeUpload(input: { resumeUploadId: string; userId: string }) {
  if (!ObjectId.isValid(input.resumeUploadId)) {
    throw new Error("Invalid resume upload id");
  }

  const db = await getDb();
  await db.collection("resumeUploads").deleteOne({
    _id: new ObjectId(input.resumeUploadId),
    userId: input.userId
  });
}
