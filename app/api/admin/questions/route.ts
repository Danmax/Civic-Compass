import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = new Set(["draft", "in_review", "approved", "published", "archived", "rejected"]);
const CATEGORY_KEYS = new Set(["economy", "immigration", "justice", "family", "equal", "rights", "institutions"]);

type QuestionRow = RowDataPacket & {
  id: number;
  public_id: string;
  question_number: number;
  statement: string;
  context: string;
  value_label: string;
  is_active: number;
  workflow_status: string;
  category_key: string;
  category_name: string;
  response_count: number;
  skipped_count: number;
  average_strength: string | number | null;
  bias_review_status: string | null;
  comment_count: number;
  updated_at: Date;
};

type CategoryRow = RowDataPacket & { id: number };
type VersionRow = RowDataPacket & { id: number };

function normalizeStatus(status: unknown) {
  return typeof status === "string" && STATUSES.has(status) ? status : null;
}

function mapQuestion(row: QuestionRow) {
  const responseCount = Number(row.response_count ?? 0);
  const skippedCount = Number(row.skipped_count ?? 0);
  const averageStrength = row.average_strength === null ? null : Number(row.average_strength);

  return {
    id: row.public_id,
    number: row.question_number,
    statement: row.statement,
    context: row.context,
    value: row.value_label,
    active: Boolean(row.is_active),
    status: row.workflow_status,
    category: {
      key: row.category_key,
      name: row.category_name,
    },
    health: {
      responseCount,
      skippedCount,
      skipRate: responseCount ? Number(((skippedCount / responseCount) * 100).toFixed(1)) : 0,
      averageStrength: averageStrength === null ? null : Number(averageStrength.toFixed(2)),
      polarization: averageStrength === null ? 0 : Math.round((averageStrength / 3) * 100),
    },
    biasReviewStatus: row.bias_review_status,
    commentCount: Number(row.comment_count ?? 0),
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { response } = await requireAdminUser();

  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const params: string[] = [];
  const where = status ? "WHERE assessment_questions.workflow_status = ?" : "";

  if (status) params.push(status);

  const [rows] = await getDbPool().execute<QuestionRow[]>(
    `SELECT assessment_questions.id,
            assessment_questions.public_id,
            assessment_questions.question_number,
            assessment_questions.statement,
            assessment_questions.context,
            assessment_questions.value_label,
            assessment_questions.is_active,
            assessment_questions.workflow_status,
            assessment_questions.updated_at,
            assessment_categories.category_key,
            assessment_categories.name AS category_name,
            COALESCE(response_stats.response_count, 0) AS response_count,
            COALESCE(response_stats.skipped_count, 0) AS skipped_count,
            response_stats.average_strength,
            latest_bias.status AS bias_review_status,
            COUNT(question_review_comments.id) AS comment_count
     FROM assessment_questions
     INNER JOIN assessment_categories ON assessment_categories.id = assessment_questions.category_id
     LEFT JOIN (
       SELECT question_number,
              COUNT(*) AS response_count,
              SUM(answer_value IS NULL) AS skipped_count,
              AVG(ABS(answer_value)) AS average_strength
       FROM (
        SELECT question_number, answer_value FROM assessment_profile_responses
        UNION ALL
        SELECT question_number, answer_value FROM user_assessment_profile_responses
       ) responses
       GROUP BY question_number
     ) response_stats ON response_stats.question_number = assessment_questions.question_number
     LEFT JOIN bias_review_items latest_bias ON latest_bias.question_id = assessment_questions.id
       AND latest_bias.id = (
        SELECT MAX(id) FROM bias_review_items WHERE question_id = assessment_questions.id
       )
     LEFT JOIN question_review_comments ON question_review_comments.question_id = assessment_questions.id
     ${where}
     GROUP BY assessment_questions.id
     ORDER BY assessment_questions.display_order ASC, assessment_questions.question_number ASC
     LIMIT 200`,
    params,
  );

  return NextResponse.json({ ok: true, questions: rows.map(mapQuestion) });
}

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();

  if (response || !user) return response;

  try {
    const body = await request.json() as {
      statement?: unknown;
      context?: unknown;
      category?: unknown;
      value?: unknown;
    };
    const statement = typeof body.statement === "string" ? body.statement.trim() : "";
    const context = typeof body.context === "string" ? body.context.trim() : "";
    const category = typeof body.category === "string" && CATEGORY_KEYS.has(body.category) ? body.category : "";
    const value = typeof body.value === "string" ? body.value.trim() : "";

    if (statement.length < 12 || context.length < 8 || !category || value.length < 2) {
      return NextResponse.json({ ok: false, error: "Statement, context, category, and value label are required." }, { status: 400 });
    }

    const pool = getDbPool();
    const [[version]] = await pool.execute<VersionRow[]>(
      "SELECT id FROM assessment_versions WHERE status = 'published' ORDER BY id DESC LIMIT 1",
    );
    const [[categoryRow]] = await pool.execute<CategoryRow[]>(
      "SELECT id FROM assessment_categories WHERE category_key = ? LIMIT 1",
      [category],
    );

    if (!version || !categoryRow) {
      return NextResponse.json({ ok: false, error: "Assessment version or category not found." }, { status: 404 });
    }

    const [[maxRow]] = await pool.query<(RowDataPacket & { next_number: number; next_order: number })[]>(
      "SELECT COALESCE(MAX(question_number), 0) + 1 AS next_number, COALESCE(MAX(display_order), 0) + 1 AS next_order FROM assessment_questions",
    );
    const publicId = randomUUID();

    const [result] = await pool.execute(
      `INSERT INTO assessment_questions
        (public_id, version_id, question_number, category_id, statement, context, value_label, is_active, workflow_status, display_order, created_by_user_id, updated_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, 'draft', ?, ?, ?)`,
      [publicId, version.id, maxRow.next_number, categoryRow.id, statement, context, value, maxRow.next_order, user.id, user.id],
    );
    const questionId = "insertId" in result ? result.insertId : 0;

    await pool.execute(
      `INSERT INTO question_audit_events (public_id, question_id, user_id, action, new_status, note)
       VALUES (?, ?, ?, 'create', 'draft', ?)`,
      [randomUUID(), questionId, user.id, "Draft question created"],
    );

    return NextResponse.json({ ok: true, id: publicId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create question.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
