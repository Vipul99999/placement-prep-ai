import crypto from "crypto";

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createQuestionFingerprint(
  category: string,
  subtopic: string,
  question: string
) {
  const normalized = [category, subtopic, normalizeText(question)].join("::");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function createJDHash(jobDescription: string) {
  return crypto.createHash("sha256").update(jobDescription.trim()).digest("hex");
}
