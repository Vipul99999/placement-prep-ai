import { ObjectId } from "mongodb";
import type { PrepInput, PracticeStatus, QuestionFeedback, TargetDifficulty } from "@/types/prep";

const EXPERIENCE_LEVELS = new Set(["Fresher", "Intern", "1 Year", "2 Years"]);
const DIFFICULTIES = new Set(["Beginner", "Intermediate", "Advanced", "Mixed"]);
const PRACTICE_STATUSES = new Set<PracticeStatus>(["not_started", "learning", "mastered"]);
const QUESTION_FEEDBACK = new Set<QuestionFeedback>(["helpful", "irrelevant", "too_easy", "too_repetitive"]);

export function validateEmail(email: string, label = "Email") {
  const value = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 160) {
    throw new Error(`${label} must be a valid email address`);
  }

  return value;
}

export function validatePassword(password: string, label = "Password") {
  const value = password.trim();
  if (value.length < 8 || value.length > 128) {
    throw new Error(`${label} must be between 8 and 128 characters`);
  }

  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasUppercase = /[A-Z]/.test(value);

  if (!hasLetter || !hasNumber || !hasUppercase) {
    throw new Error(`${label} must include an uppercase letter, a lowercase letter, and a number`);
  }

  return value;
}

export function assertValidObjectId(value: string, label = "id") {
  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

export function validatePrepInput(input: PrepInput) {
  const companyName = input.companyName?.trim();
  const role = input.role?.trim();
  const jobDescription = input.jobDescription?.trim();

  if (!companyName || companyName.length > 80) {
    throw new Error("Company name is required and must be under 80 characters");
  }

  if (!role || role.length > 120) {
    throw new Error("Role is required and must be under 120 characters");
  }

  if (!jobDescription || jobDescription.length < 30 || jobDescription.length > 12000) {
    throw new Error("Job description must be between 30 and 12000 characters");
  }

  if (!EXPERIENCE_LEVELS.has(input.experienceLevel)) {
    throw new Error("Invalid experience level");
  }

  if (![7, 15, 30].includes(input.preparationDays)) {
    throw new Error("Preparation days must be 7, 15, or 30");
  }

  if (!DIFFICULTIES.has(input.difficulty)) {
    throw new Error("Invalid difficulty");
  }

  if (!Array.isArray(input.knownSkills)) {
    throw new Error("Known skills must be an array");
  }

  const normalizedSkills = [...new Set(input.knownSkills.map((skill) => skill.trim()).filter(Boolean))].slice(
    0,
    20
  );

  const projectHighlights = Array.isArray(input.projectHighlights)
    ? [...new Set(input.projectHighlights.map((item) => item.trim()).filter(Boolean))].slice(0, 12)
    : [];
  const resumeUploadId = input.resumeUploadId?.trim() || undefined;

  if (resumeUploadId) {
    assertValidObjectId(resumeUploadId, "resume upload id");
  }

  return {
    ...input,
    companyName,
    role,
    jobDescription,
    knownSkills: normalizedSkills,
    resumeUploadId,
    resumeFileName: input.resumeFileName?.trim().slice(0, 180) || undefined,
    resumeText: input.resumeText?.trim().slice(0, 16000) || undefined,
    projectHighlights
  };
}

export function validateGenerationInput(input: { category?: string; count?: number; difficulty?: string }) {
  const category = input.category?.trim();
  if (!category || category.length > 100) {
    throw new Error("Category is required and must be under 100 characters");
  }

  const count = Number(input.count);
  if (!Number.isFinite(count) || count < 1 || count > 25) {
    throw new Error("Count must be between 1 and 25");
  }

  const difficulty = input.difficulty?.trim() || "Mixed";
  if (!DIFFICULTIES.has(difficulty)) {
    throw new Error("Invalid difficulty");
  }

  return {
    category,
    count: Math.floor(count),
    difficulty
  };
}

export function validateQuestionStateInput(input: {
  isBookmarked?: boolean;
  userNotes?: string;
  practiceStatus?: string;
  markReviewed?: boolean;
  feedback?: string;
}) {
  const result: {
    isBookmarked?: boolean;
    userNotes?: string;
    practiceStatus?: PracticeStatus;
    markReviewed?: boolean;
    feedback?: QuestionFeedback;
  } = {};

  if (typeof input.isBookmarked === "boolean") {
    result.isBookmarked = input.isBookmarked;
  }

  if (typeof input.userNotes === "string") {
    result.userNotes = input.userNotes.replace(/\0/g, "").trim().slice(0, 3000);
  }

  if (typeof input.practiceStatus === "string") {
    if (!PRACTICE_STATUSES.has(input.practiceStatus as PracticeStatus)) {
      throw new Error("Invalid practice status");
    }
    result.practiceStatus = input.practiceStatus as PracticeStatus;
  }

  if (typeof input.markReviewed === "boolean") {
    result.markReviewed = input.markReviewed;
  }

  if (typeof input.feedback === "string") {
    if (!QUESTION_FEEDBACK.has(input.feedback as QuestionFeedback)) {
      throw new Error("Invalid feedback value");
    }
    result.feedback = input.feedback as QuestionFeedback;
  }

  if (Object.keys(result).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  return result;
}

export function validateUserPreferencesInput(input: {
  defaultPreparationDays?: number;
  defaultDifficulty?: string;
  weeklyGoalSessions?: number;
  emailProductUpdates?: boolean;
  emailStudyReminders?: boolean;
}) {
  const defaultPreparationDays = Number(input.defaultPreparationDays);
  if (![7, 15, 30].includes(defaultPreparationDays)) {
    throw new Error("Default preparation days must be 7, 15, or 30");
  }

  const defaultDifficulty = input.defaultDifficulty?.trim() || "Mixed";
  if (!DIFFICULTIES.has(defaultDifficulty)) {
    throw new Error("Invalid default difficulty");
  }

  const weeklyGoalSessions = Number(input.weeklyGoalSessions);
  if (!Number.isFinite(weeklyGoalSessions) || weeklyGoalSessions < 1 || weeklyGoalSessions > 14) {
    throw new Error("Weekly goal sessions must be between 1 and 14");
  }

  return {
    defaultPreparationDays: defaultPreparationDays as 7 | 15 | 30,
    defaultDifficulty: defaultDifficulty as TargetDifficulty,
    weeklyGoalSessions: Math.floor(weeklyGoalSessions),
    emailProductUpdates: Boolean(input.emailProductUpdates),
    emailStudyReminders: Boolean(input.emailStudyReminders)
  };
}

export function validateSupportTicketInput(input: { topic?: string; message?: string }) {
  const topic = input.topic?.trim();
  const message = input.message?.trim();

  if (!topic || topic.length > 80) {
    throw new Error("Support topic is required and must be under 80 characters");
  }

  if (!message || message.length < 20 || message.length > 2000) {
    throw new Error("Support message must be between 20 and 2000 characters");
  }

  return { topic, message };
}

export function validateFeedbackInput(input: {
  area?: string;
  sentiment?: string;
  message?: string;
}) {
  const area = input.area?.trim();
  const sentiment = input.sentiment?.trim();
  const message = input.message?.trim();

  if (!area || area.length > 80) {
    throw new Error("Feedback area is required and must be under 80 characters");
  }

  if (!["love_it", "needs_work", "bug"].includes(sentiment || "")) {
    throw new Error("Invalid feedback sentiment");
  }

  if (!message || message.length < 10 || message.length > 1200) {
    throw new Error("Feedback message must be between 10 and 1200 characters");
  }

  return {
    area,
    sentiment: sentiment as "love_it" | "needs_work" | "bug",
    message
  };
}
