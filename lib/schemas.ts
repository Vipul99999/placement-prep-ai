export const analysisSchema = {
  type: "object",
  required: [
    "companyName",
    "role",
    "summary",
    "primarySkills",
    "secondarySkills",
    "coreSubjects",
    "softSkills",
    "interviewRounds",
    "recommendedCategories"
  ],
  properties: {
    companyName: { type: "string" },
    role: { type: "string" },
    summary: { type: "string" },
    primarySkills: { type: "array", items: { type: "string" } },
    secondarySkills: { type: "array", items: { type: "string" } },
    coreSubjects: { type: "array", items: { type: "string" } },
    softSkills: { type: "array", items: { type: "string" } },
    interviewRounds: { type: "array", items: { type: "string" } },
    recommendedCategories: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "type", "importance", "recommendedQuestionCount", "reason"],
        properties: {
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["technical", "cs-core", "hr", "aptitude", "company", "project"]
          },
          importance: { type: "string", enum: ["high", "medium", "low"] },
          recommendedQuestionCount: { type: "number" },
          reason: { type: "string" }
        }
      }
    }
  }
};

export const questionGenerationSchema = {
  type: "object",
  required: ["category", "questions"],
  properties: {
    category: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "question",
          "difficulty",
          "subtopic",
          "answerShort",
          "answerDetailed",
          "interviewerIntent",
          "answerOpening",
          "answerFramework",
          "revisionChecklist",
          "example",
          "followUps",
          "commonMistakes",
          "tags"
        ],
        properties: {
          question: { type: "string" },
          difficulty: { type: "string" },
          subtopic: { type: "string" },
          answerShort: { type: "string" },
          answerDetailed: { type: "string" },
          interviewerIntent: { type: "string" },
          answerOpening: { type: "string" },
          answerFramework: { type: "array", items: { type: "string" } },
          revisionChecklist: { type: "array", items: { type: "string" } },
          example: { type: "string" },
          followUps: { type: "array", items: { type: "string" } },
          commonMistakes: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
};

export const roadmapSchema = {
  type: "object",
  required: ["days"],
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        required: ["day", "title", "topics", "tasks", "estimatedHours"],
        properties: {
          day: { type: "number" },
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          tasks: { type: "array", items: { type: "string" } },
          estimatedHours: { type: "number" }
        }
      }
    }
  }
};

export const detailedAnswerSchema = {
  type: "object",
  required: ["answerDetailed"],
  properties: {
    answerDetailed: { type: "string" }
  }
};
