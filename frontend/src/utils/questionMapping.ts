// ========================================
// RAW SERVER QUESTION SHAPE
// - Matches what backend /api/question returns
// ========================================
export interface ServerQuestion {
  questionId: number;
  title: string;
  correctAns: string;
  otherAns: string | null;
  prompt: string | null;
  courseId: number;
}

// ========================================
// QUESTION TYPE USED BY THE UI
// - Derived from the answer choices
// ========================================
export type QuestionType = "true_false" | "multiple_choice";

// ========================================
// HELPER: Create a unique ID for a choice
// - Uses crypto.randomUUID when available
// - Falls back to a random string in older browsers
// ========================================
const createChoiceId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `choice-${Math.random().toString(36).slice(2, 10)}`;

// ========================================
// HELPER: Normalize questionId into a number
// ========================================
const extractQuestionId = (raw: ServerQuestion): number => Number(raw.questionId);

// ========================================
// HELPER: Turn DB otherAns string into string[]
// - DB stores other answers as "A{|}B{|}C"
// - This splits on "{|}" and trims entries
// ========================================
const normalizeOtherAnswers = (otherAns: string | null): string[] =>
  !otherAns
    ? []
    : otherAns
        .split("{|}")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

// ========================================
// HELPER: Infer question type from choices
// - If exactly 2 choices and they are "true"/"false",
//   treat as true_false, otherwise multiple_choice
// ========================================
const inferQuestionType = (choices: string[]): QuestionType => {
  if (choices.length === 2) {
    const normalized = choices.map((label) => label.trim().toLowerCase());
    if (normalized.includes("true") && normalized.includes("false")) {
      return "true_false";
    }
  }
  return "multiple_choice";
};

import type { InstructorQuestion } from "../components/QuizCardInstructorComponent";

// ========================================
// ADAPTER: Map ServerQuestion -> InstructorQuestion
// - Converts DB shape into UI-friendly question
// - Builds choices array with IDs
// - Picks a correctChoiceId
// - Derives type and default values
// ========================================
export const mapServerQuestion = (raw: ServerQuestion): InstructorQuestion => {
  // ----- Basic identifiers -----
  const questionId = extractQuestionId(raw);

  // ----- Prompt normalization (null if empty) -----
  const promptText =
    typeof raw.prompt === "string" && raw.prompt.trim().length > 0
      ? raw.prompt
      : null;

  // ----- Build flat list of choice labels -----
  const otherAnswers = normalizeOtherAnswers(raw.otherAns);
  const allChoices = [raw.correctAns, ...otherAnswers];

  // ----- Turn labels into choice objects with unique IDs -----
  const choiceEntries =
    allChoices.length > 0
      ? allChoices.map((label) => ({
          id: createChoiceId(),
          label: String(label),
        }))
      : [{ id: createChoiceId(), label: "" }];

  // ----- Mark first choice (correctAns) as correct -----
  const correctChoiceId = choiceEntries[0].id;

  // ----- Infer question type from choices -----
  const questionType = inferQuestionType(allChoices);

  // ----- Fallback title/description if missing -----
  const questionText =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title
      : `Question ${questionId}`;

  // ----- Final UI question object used by components -----
  return {
    id: questionId,
    title: questionText,
    description: questionText,
    prompt: promptText,
    points: 1,
    choices: choiceEntries,
    type: questionType,
    correctChoiceId,
    isPersisted: true,
  };
};