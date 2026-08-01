import { DIMENSIONS, QUESTIONS, type DimensionKey } from "@/app/data";

export type AnswerMap = Record<number, number | null>;
export type ImportanceMap = Record<number, number>;
export type QuizMode = "quick" | "full";
export type DimensionScores = Record<DimensionKey, number>;

const ALLOWED_ANSWERS = new Set([-3, -2, -1, 0, 1, 2, 3]);
const ALLOWED_IMPORTANCE = new Set([1, 1.2, 1.4]);
const QUESTION_IDS = new Set(QUESTIONS.map((question) => question.id));

export function scoreAssessment(answers: AnswerMap, importance: ImportanceMap) {
  const totals = Object.fromEntries(Object.keys(DIMENSIONS).map((key) => [key, 0])) as DimensionScores;
  const max = Object.fromEntries(Object.keys(totals).map((key) => [key, 0])) as DimensionScores;

  QUESTIONS.forEach((question) => {
    const answer = answers[question.id];

    if (answer === undefined || answer === null) {
      return;
    }

    question.weights.forEach(({ dimension, weight }) => {
      const multiplier = importance[question.id] ?? 1;
      max[dimension] += Math.abs(3 * multiplier * weight);
      totals[dimension] += answer * multiplier * weight;
    });
  });

  const scores = Object.fromEntries(
    Object.entries(totals).map(([key, value]) => {
      const dimension = key as DimensionKey;
      return [dimension, Math.round((value / (max[dimension] || 1)) * 100)];
    }),
  ) as DimensionScores;

  return scores;
}

export function validateAssessmentPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = payload as {
    mode?: unknown;
    answers?: unknown;
    importance?: unknown;
    accuracyRating?: unknown;
  };

  if (body.mode !== "quick" && body.mode !== "full") {
    throw new Error("Mode must be quick or full.");
  }

  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    throw new Error("Answers must be an object.");
  }

  if (!body.importance || typeof body.importance !== "object" || Array.isArray(body.importance)) {
    throw new Error("Importance must be an object.");
  }

  const answers = Object.fromEntries(
    Object.entries(body.answers as Record<string, unknown>).map(([key, value]) => {
      const questionId = Number(key);

      if (!Number.isInteger(questionId) || !QUESTION_IDS.has(questionId)) {
        throw new Error(`Unknown question id: ${key}`);
      }

      if (value !== null && (typeof value !== "number" || !Number.isInteger(value) || !ALLOWED_ANSWERS.has(value))) {
        throw new Error(`Invalid answer for question ${questionId}.`);
      }

      return [questionId, value as number | null];
    }),
  ) as AnswerMap;

  const importance = Object.fromEntries(
    Object.entries(body.importance as Record<string, unknown>).map(([key, value]) => {
      const questionId = Number(key);

      if (!Number.isInteger(questionId) || !QUESTION_IDS.has(questionId)) {
        throw new Error(`Unknown question id: ${key}`);
      }

      if (typeof value !== "number" || !ALLOWED_IMPORTANCE.has(value)) {
        throw new Error(`Invalid importance for question ${questionId}.`);
      }

      return [questionId, value];
    }),
  ) as ImportanceMap;

  const accuracyRating = typeof body.accuracyRating === "string"
    ? body.accuracyRating.slice(0, 64)
    : null;
  const answeredValues = Object.values(answers);
  const answeredCount = answeredValues.filter((value) => typeof value === "number").length;
  const skippedCount = answeredValues.filter((value) => value === null).length;
  const uncertainCount = answeredValues.filter((value) => value === 0 || value === null).length;
  const confidence = Math.max(
    0,
    Math.min(100, Math.round(72 + (answeredCount / QUESTIONS.length) * 23 - uncertainCount * 0.35)),
  );

  return {
    mode: body.mode,
    answers,
    importance,
    accuracyRating,
    answeredCount,
    skippedCount,
    confidence,
    scores: scoreAssessment(answers, importance),
  };
}
