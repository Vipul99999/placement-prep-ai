export type ExperienceLevel = "Fresher" | "Intern" | "1 Year" | "2 Years";
export type TargetDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Mixed";
export type PrepStatus = "draft" | "generating" | "completed" | "failed";
export type CategoryType =
  | "technical"
  | "cs-core"
  | "hr"
  | "aptitude"
  | "company"
  | "project";
export type Importance = "high" | "medium" | "low";
export type PracticeStatus = "not_started" | "learning" | "mastered";
export type GenerationStatus = "pending" | "running" | "completed" | "failed";
export type QuestionFeedback = "helpful" | "irrelevant" | "too_easy" | "too_repetitive";

export interface PrepInput {
  companyName: string;
  role: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  preparationDays: number;
  knownSkills: string[];
  difficulty: TargetDifficulty;
  resumeUploadId?: string;
  resumeFileName?: string;
  resumeText?: string;
  projectHighlights?: string[];
}

export interface RecommendedCategory {
  name: string;
  type: CategoryType;
  importance: Importance;
  recommendedQuestionCount: number;
  reason: string;
}

export interface AnalysisResult {
  companyName: string;
  role: string;
  summary: string;
  primarySkills: string[];
  secondarySkills: string[];
  coreSubjects: string[];
  softSkills: string[];
  interviewRounds: string[];
  recommendedCategories: RecommendedCategory[];
}

export interface RoadmapDay {
  day: number;
  title: string;
  topics: string[];
  tasks: string[];
  estimatedHours: number;
}

export interface StoredQuestion {
  _id?: string;
  fingerprint: string;
  category: string;
  subtopic: string;
  difficulty: string;
  question: string;
  answerShort: string;
  answerDetailed?: string;
  example?: string;
  followUps: string[];
  commonMistakes: string[];
  tags: string[];
  roleTypes: string[];
  companyTypes: string[];
  sourceType: "ai-generated";
  qualityScore: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrepPackSummary {
  _id: string;
  userId: string;
  companyName: string;
  role: string;
  experienceLevel: ExperienceLevel;
  preparationDays: number;
  difficulty: TargetDifficulty;
  status: PrepStatus;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  category: string;
  totalQuestions: number;
}

export interface GenerationSummaryItem {
  category: string;
  status: GenerationStatus;
  requestedCount: number;
  reusedCount: number;
  generatedCount: number;
  error?: string;
  attemptCount?: number;
  nextAttemptAt?: string;
}

export interface PrepPackDetail extends PrepPackSummary {
  analysis: AnalysisResult;
  categoryPlan: RecommendedCategory[];
  roadmap: RoadmapDay[];
  jobDescriptionPreview: string;
  resumeFileName?: string;
  projectHighlights?: string[];
  categorySummary: CategorySummary[];
  analytics: PrepAnalytics;
  generationSummary: GenerationSummaryItem[];
}

export interface QuestionPageItem {
  joinId: string;
  questionId: string;
  category: string;
  order: number;
  isBookmarked: boolean;
  userNotes: string;
  practiceStatus: PracticeStatus;
  reviewStreak?: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  lastFeedback?: QuestionFeedback;
  question: StoredQuestion;
}

export interface PrepAnalytics {
  totalQuestions: number;
  bookmarkedQuestions: number;
  notStartedQuestions: number;
  learningQuestions: number;
  masteredQuestions: number;
  completionRate: number;
  categoriesStarted: number;
  categoriesMastered: number;
  dueReviewCount: number;
  activeReviewStreaks: number;
}

export interface ResumeUploadSummary {
  _id: string;
  fileName: string;
  extractedTextPreview: string;
  projectHighlights: string[];
  createdAt: string;
}

export interface AccountSessionSummary {
  _id: string;
  sessionId: string;
  userAgent: string;
  deviceLabel: string;
  lastSeenAt: string;
  createdAt: string;
  revokedAt?: string;
  current?: boolean;
}

export interface UserPreferences {
  defaultPreparationDays: 7 | 15 | 30;
  defaultDifficulty: TargetDifficulty;
  weeklyGoalSessions: number;
  emailProductUpdates: boolean;
  emailStudyReminders: boolean;
}

export interface OnboardingState {
  hasVerifiedEmail: boolean;
  hasPrepPack: boolean;
  hasResumeUpload: boolean;
  hasStartedPractice: boolean;
  percentComplete: number;
}

export interface SupportTicketSummary {
  _id: string;
  topic: string;
  message: string;
  status: "open" | "in_review" | "resolved";
  createdAt: string;
}

export interface ProductFeedbackSummary {
  _id: string;
  area: string;
  sentiment: "love_it" | "needs_work" | "bug";
  message: string;
  createdAt: string;
}
