import "server-only";

import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

type DimensionRow = RowDataPacket & {
  public_id: string;
  dimension_key: string;
  name: string;
  low_label: string;
  high_label: string;
  explanation: string;
};

type CategoryRow = RowDataPacket & {
  id: number;
  public_id: string;
  category_key: string;
  name: string;
  short_label: string;
  description: string;
  history: string;
  viewpoints: string;
  debate: string;
};

type ReadingRow = RowDataPacket & {
  public_id: string;
  category_id: number;
  title: string;
  url: string | null;
};

type AnswerRow = RowDataPacket & {
  public_id: string;
  label: string;
  short_label: string;
  answer_value: number;
};

type ImportanceRow = RowDataPacket & {
  public_id: string;
  label: string;
  multiplier: string | number;
};

type QuestionRow = RowDataPacket & {
  id: number;
  public_id: string;
  question_number: number;
  category_key: string;
  statement: string;
  context: string;
  value_label: string;
};

type WeightRow = RowDataPacket & {
  public_id: string;
  question_id: number;
  dimension_key: string;
  weight: string | number;
};

export async function fetchPublishedAssessment() {
  const pool = getDbPool();
  const [versionRows] = await pool.execute<(RowDataPacket & { id: number; public_id: string; version_key: string; title: string })[]>(
    `SELECT id, public_id, version_key, title
     FROM assessment_versions
     WHERE status = 'published'
     ORDER BY published_at DESC, id DESC
     LIMIT 1`,
  );
  const version = versionRows[0];

  if (!version) {
    throw new Error("No published assessment version found.");
  }

  const [
    [dimensionRows],
    [categoryRows],
    [readingRows],
    [answerRows],
    [importanceRows],
    [questionRows],
    [weightRows],
  ] = await Promise.all([
    pool.execute<DimensionRow[]>(
      `SELECT public_id, dimension_key, name, low_label, high_label, explanation
       FROM assessment_dimensions
       ORDER BY display_order ASC`,
    ),
    pool.execute<CategoryRow[]>(
      `SELECT id, public_id, category_key, name, short_label, description, history, viewpoints, debate
       FROM assessment_categories
       ORDER BY display_order ASC`,
    ),
    pool.execute<ReadingRow[]>(
      `SELECT public_id, category_id, title, url
       FROM assessment_category_readings
       ORDER BY display_order ASC`,
    ),
    pool.execute<AnswerRow[]>(
      `SELECT public_id, label, short_label, answer_value
       FROM assessment_answer_choices
       ORDER BY display_order ASC`,
    ),
    pool.execute<ImportanceRow[]>(
      `SELECT public_id, label, multiplier
       FROM assessment_importance_choices
       ORDER BY display_order ASC`,
    ),
    pool.execute<QuestionRow[]>(
      `SELECT assessment_questions.id, assessment_questions.public_id, question_number, category_key, statement, context, value_label
       FROM assessment_questions
       INNER JOIN assessment_categories ON assessment_categories.id = assessment_questions.category_id
       WHERE version_id = ? AND is_active = TRUE
       ORDER BY assessment_questions.display_order ASC`,
      [version.id],
    ),
    pool.execute<WeightRow[]>(
      `SELECT assessment_question_weights.public_id, assessment_questions.id AS question_id, dimension_key, weight
       FROM assessment_question_weights
       INNER JOIN assessment_questions ON assessment_questions.id = assessment_question_weights.question_id
       INNER JOIN assessment_dimensions ON assessment_dimensions.id = assessment_question_weights.dimension_id
       WHERE assessment_questions.version_id = ?
       ORDER BY assessment_question_weights.id ASC`,
      [version.id],
    ),
  ]);
  const readingsByCategoryId = new Map<number, { id: string; title: string; url: string | null }[]>();
  const weightsByQuestionId = new Map<number, { id: string; dimension: string; weight: number }[]>();

  readingRows.forEach((row) => {
    readingsByCategoryId.set(row.category_id, [
      ...(readingsByCategoryId.get(row.category_id) ?? []),
      { id: row.public_id, title: row.title, url: row.url },
    ]);
  });

  weightRows.forEach((row) => {
    weightsByQuestionId.set(row.question_id, [
      ...(weightsByQuestionId.get(row.question_id) ?? []),
      { id: row.public_id, dimension: row.dimension_key, weight: Number(row.weight) },
    ]);
  });

  return {
    version: {
      id: version.public_id,
      key: version.version_key,
      title: version.title,
    },
    dimensions: Object.fromEntries(dimensionRows.map((row) => [row.dimension_key, {
      id: row.public_id,
      name: row.name,
      low: row.low_label,
      high: row.high_label,
      explanation: row.explanation,
    }])),
    categories: Object.fromEntries(categoryRows.map((row) => [row.category_key, {
      id: row.public_id,
      name: row.name,
      short: row.short_label,
      description: row.description,
      history: row.history,
      viewpoints: row.viewpoints,
      debate: row.debate,
      reading: (readingsByCategoryId.get(row.id) ?? []).map((reading) => reading.title),
      readings: readingsByCategoryId.get(row.id) ?? [],
    }])),
    answers: answerRows.map((row) => ({
      id: row.public_id,
      label: row.label,
      short: row.short_label,
      value: row.answer_value,
    })),
    importance: importanceRows.map((row) => ({
      id: row.public_id,
      label: row.label,
      value: Number(row.multiplier),
    })),
    questions: questionRows.map((row) => ({
      uuid: row.public_id,
      id: row.question_number,
      category: row.category_key,
      statement: row.statement,
      context: row.context,
      value: row.value_label,
      weights: weightsByQuestionId.get(row.id) ?? [],
    })),
  };
}
