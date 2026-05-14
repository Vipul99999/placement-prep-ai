import type { AnalysisResult, PrepInput, RecommendedCategory } from "@/types/prep";

const INJECTION_PATTERN =
  /(ignore (all|any|previous|above) instructions|system prompt|developer message|reveal (your|the) prompt|prompt injection|jailbreak|override (the )?rules|bypass (safety|policy)|act as|do anything now|assistant:|tool:)/i;
const OFF_PURPOSE_PATTERN =
  /(malware|ransomware|phishing|credential theft|sql injection|xss|exploit|ddos|keylogger|backdoor|shellcode|virus|trojan)/i;

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "").replace(/[^\S\n]+/g, " ").trim();
}

function sanitizeLine(line: string) {
  return normalizeWhitespace(line).replace(/[`$<>]/g, "");
}

export function sanitizeUntrustedText(text: string | undefined, maxLength: number) {
  if (!text) {
    return { text: "", removedLines: 0, flagged: false };
  }

  const cleanedLines = text
    .split("\n")
    .map(sanitizeLine)
    .filter(Boolean);

  let removedLines = 0;
  const safeLines = cleanedLines.filter((line) => {
    const blocked = INJECTION_PATTERN.test(line);
    if (blocked) {
      removedLines += 1;
    }
    return !blocked;
  });

  return {
    text: safeLines.join("\n").slice(0, maxLength),
    removedLines,
    flagged: removedLines > 0
  };
}

export function preparePrepInputForAI(input: PrepInput) {
  const jobDescription = sanitizeUntrustedText(input.jobDescription, 8000);
  const resumeText = sanitizeUntrustedText(input.resumeText, 12000);
  const companyName = sanitizeUntrustedText(input.companyName, 120);
  const role = sanitizeUntrustedText(input.role, 160);
  const knownSkills = input.knownSkills
    .map((skill) => sanitizeUntrustedText(skill, 60).text)
    .filter(Boolean)
    .slice(0, 20);
  const projectHighlights = (input.projectHighlights ?? [])
    .map((item) => sanitizeUntrustedText(item, 160).text)
    .filter(Boolean)
    .slice(0, 12);

  return {
    safeInput: {
      ...input,
      companyName: companyName.text,
      role: role.text,
      jobDescription: jobDescription.text,
      resumeText: resumeText.text || undefined,
      knownSkills,
      projectHighlights
    },
    safety: {
      flagged: companyName.flagged || role.flagged || jobDescription.flagged || resumeText.flagged,
      removedLines: companyName.removedLines + role.removedLines + jobDescription.removedLines + resumeText.removedLines
    }
  };
}

function isUnsafeGeneratedText(text: string) {
  return (
    INJECTION_PATTERN.test(text) ||
    OFF_PURPOSE_PATTERN.test(text) ||
    /https?:\/\//i.test(text) ||
    /```/.test(text)
  );
}

function sanitizeGeneratedText(text: string, maxLength: number) {
  const sanitized = normalizeWhitespace(text).slice(0, maxLength);
  if (!sanitized || isUnsafeGeneratedText(sanitized)) {
    return "";
  }

  return sanitized;
}

export function sanitizeAnalysisResult(input: AnalysisResult): AnalysisResult {
  return {
    ...input,
    companyName: sanitizeGeneratedText(input.companyName, 120),
    role: sanitizeGeneratedText(input.role, 160),
    summary: sanitizeGeneratedText(input.summary, 500),
    primarySkills: input.primarySkills.map((item) => sanitizeGeneratedText(item, 60)).filter(Boolean).slice(0, 8),
    secondarySkills: input.secondarySkills.map((item) => sanitizeGeneratedText(item, 60)).filter(Boolean).slice(0, 8),
    coreSubjects: input.coreSubjects.map((item) => sanitizeGeneratedText(item, 60)).filter(Boolean).slice(0, 8),
    softSkills: input.softSkills.map((item) => sanitizeGeneratedText(item, 60)).filter(Boolean).slice(0, 8),
    interviewRounds: input.interviewRounds.map((item) => sanitizeGeneratedText(item, 80)).filter(Boolean).slice(0, 6),
    recommendedCategories: input.recommendedCategories
      .map((category) => ({
        ...category,
        name: sanitizeGeneratedText(category.name, 80),
        reason: sanitizeGeneratedText(category.reason, 220),
        recommendedQuestionCount: Math.max(8, Math.min(Number(category.recommendedQuestionCount) || 8, 50))
      }))
      .filter((category) => category.name && category.reason)
      .slice(0, 10)
  };
}

export function sanitizeQuestionPayload(input: {
  category: string;
  questions: Array<{
    question: string;
    difficulty: string;
    subtopic: string;
    answerShort: string;
    answerDetailed: string;
    interviewerIntent: string;
    answerOpening: string;
    answerFramework: string[];
    revisionChecklist: string[];
    example: string;
    followUps: string[];
    commonMistakes: string[];
    tags: string[];
  }>;
}) {
  return {
    category: sanitizeGeneratedText(input.category, 80),
    questions: input.questions
      .map((question) => ({
        question: sanitizeGeneratedText(question.question, 220),
        difficulty: sanitizeGeneratedText(question.difficulty, 24) || "Mixed",
        subtopic: sanitizeGeneratedText(question.subtopic, 60),
        answerShort: sanitizeGeneratedText(question.answerShort, 260),
        answerDetailed: sanitizeGeneratedText(question.answerDetailed, 900),
        interviewerIntent: sanitizeGeneratedText(question.interviewerIntent, 220),
        answerOpening: sanitizeGeneratedText(question.answerOpening, 220),
        answerFramework: question.answerFramework
          .map((item) => sanitizeGeneratedText(item, 160))
          .filter(Boolean)
          .slice(0, 5),
        revisionChecklist: question.revisionChecklist
          .map((item) => sanitizeGeneratedText(item, 140))
          .filter(Boolean)
          .slice(0, 5),
        example: sanitizeGeneratedText(question.example, 260),
        followUps: question.followUps.map((item) => sanitizeGeneratedText(item, 160)).filter(Boolean).slice(0, 4),
        commonMistakes: question.commonMistakes
          .map((item) => sanitizeGeneratedText(item, 160))
          .filter(Boolean)
          .slice(0, 4),
        tags: question.tags.map((item) => sanitizeGeneratedText(item, 40)).filter(Boolean).slice(0, 6)
      }))
      .filter(
        (question) =>
          question.question &&
          question.subtopic &&
          question.answerShort &&
          question.interviewerIntent &&
          question.answerOpening &&
          question.answerFramework.length > 0 &&
          question.revisionChecklist.length > 0 &&
          question.followUps.length > 0 &&
          question.commonMistakes.length > 0
      )
  };
}

export function sanitizeRoadmapPayload(input: {
  days: Array<{
    day: number;
    title: string;
    topics: string[];
    tasks: string[];
    estimatedHours: number;
  }>;
}) {
  return {
    days: input.days
      .map((day, index) => ({
        day: Number(day.day) || index + 1,
        title: sanitizeGeneratedText(day.title, 120),
        topics: day.topics.map((item) => sanitizeGeneratedText(item, 80)).filter(Boolean).slice(0, 5),
        tasks: day.tasks.map((item) => sanitizeGeneratedText(item, 120)).filter(Boolean).slice(0, 4),
        estimatedHours: Math.max(1, Math.min(Number(day.estimatedHours) || 2, 8))
      }))
      .filter((day) => day.title && day.topics.length > 0 && day.tasks.length > 0)
  };
}

export function sanitizeDetailedAnswerPayload(input: { answerDetailed: string }) {
  return {
    answerDetailed:
      sanitizeGeneratedText(input.answerDetailed, 1400) ||
      "Focus on the core concept, give a simple definition, explain when to use it, and add one practical example."
  };
}

export function createFallbackQuestions(args: {
  category: RecommendedCategory;
  role: string;
  difficulty: string;
  count: number;
}) {
  const category = args.category.name;
  return {
    category,
    questions: Array.from({ length: args.count }, (_, index) => ({
      question: `What should a ${args.role} candidate explain about ${category} in an interview? (${index + 1})`,
      difficulty: args.difficulty === "Mixed" ? (index % 2 === 0 ? "Beginner" : "Intermediate") : args.difficulty,
      subtopic: category,
      answerShort: `${category} matters because it affects how you design, build, debug, and explain your work clearly.`,
      answerDetailed: `Start with the basic definition of ${category}, explain where it appears in practical work for a ${args.role} role, mention one tradeoff, and add a small real-world example.`,
      interviewerIntent: `The interviewer wants to check whether you understand ${category} clearly and can connect it to practical work.`,
      answerOpening: `A good way to start is: ${category} is important because it directly affects how I build and explain reliable work in this role.`,
      answerFramework: [
        `Define ${category} in one clear sentence.`,
        `Explain where it appears in real ${args.role} work.`,
        `Mention one tradeoff, edge case, or debugging challenge.`,
        `Close with a simple example from project or internship work.`
      ],
      revisionChecklist: [
        `Know the definition and why it matters.`,
        `Prepare one project example using ${category}.`,
        `Be ready for one comparison or tradeoff question.`,
        `Avoid only theory; connect it to implementation.`
      ],
      example: `Share a small example from a project where ${category} improved code quality, performance, reliability, or developer experience.`,
      followUps: [
        `When would you choose one approach over another in ${category}?`,
        `What mistake do beginners make in ${category}?`
      ],
      commonMistakes: [
        `Giving only a definition without a real example from ${category}.`,
        `Ignoring tradeoffs, limitations, or debugging concerns in ${category}.`
      ],
      tags: [category, args.role, "Interview Prep"]
    }))
  };
}
