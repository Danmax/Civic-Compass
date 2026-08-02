import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = new Set(["open", "in_review", "approved", "needs_revision", "resolved"]);
const SEVERITIES = new Set(["low", "medium", "high"]);

type ReviewRow = RowDataPacket & {
  id: number;
  public_id: string;
  status: string;
  severity: string;
  trigger_source: string;
  trigger_summary: string;
  question_number: number;
  question_public_id: string;
  statement: string;
  context: string;
  category_key: string;
  category_name: string;
  assigned_to_name: string | null;
  created_by_name: string | null;
  comment_count: number;
  created_at: Date;
  updated_at: Date;
};

type QuestionRow = RowDataPacket & {
  id: number;
};

function normalizeStatus(value: unknown) {
  return typeof value === "string" && STATUSES.has(value) ? value : null;
}

function normalizeSeverity(value: unknown) {
  return typeof value === "string" && SEVERITIES.has(value) ? value : null;
}

function mapReview(row: ReviewRow) {
  return {
    id: row.public_id,
    status: row.status,
    severity: row.severity,
    triggerSource: row.trigger_source,
    triggerSummary: row.trigger_summary,
    question: {
      id: row.question_public_id,
      number: row.question_number,
      statement: row.statement,
      context: row.context,
      category: {
        key: row.category_key,
        name: row.category_name,
      },
    },
    assignedTo: row.assigned_to_name,
    createdBy: row.created_by_name,
    commentCount: Number(row.comment_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { response } = await requireAdminUser();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const status = normalizeStatus(searchParams.get("status"));
  const params: string[] = [];
  const where = status ? "WHERE bias_review_items.status = ?" : "";

  if (status) {
    params.push(status);
  }

  const [rows] = await getDbPool().execute<ReviewRow[]>(
    `SELECT bias_review_items.id,
            bias_review_items.public_id,
            bias_review_items.status,
            bias_review_items.severity,
            bias_review_items.trigger_source,
            bias_review_items.trigger_summary,
            assessment_questions.question_number,
            assessment_questions.public_id AS question_public_id,
            assessment_questions.statement,
            assessment_questions.context,
            assessment_categories.category_key,
            assessment_categories.name AS category_name,
            assigned.display_name AS assigned_to_name,
            creator.display_name AS created_by_name,
            COUNT(bias_review_comments.id) AS comment_count,
            bias_review_items.created_at,
            bias_review_items.updated_at
     FROM bias_review_items
     INNER JOIN assessment_questions ON assessment_questions.id = bias_review_items.question_id
     INNER JOIN assessment_categories ON assessment_categories.id = assessment_questions.category_id
     LEFT JOIN users assigned ON assigned.id = bias_review_items.assigned_to_user_id
     LEFT JOIN users creator ON creator.id = bias_review_items.created_by_user_id
     LEFT JOIN bias_review_comments ON bias_review_comments.review_item_id = bias_review_items.id
     ${where}
     GROUP BY bias_review_items.id
     ORDER BY FIELD(bias_review_items.severity, 'high', 'medium', 'low'),
              FIELD(bias_review_items.status, 'open', 'needs_revision', 'in_review', 'approved', 'resolved'),
              bias_review_items.updated_at DESC
     LIMIT 100`,
    params,
  );

  return NextResponse.json({
    ok: true,
    items: rows.map(mapReview),
  });
}

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json() as {
      questionNumber?: unknown;
      severity?: unknown;
      triggerSummary?: unknown;
      triggerSource?: unknown;
    };
    const questionNumber = Number(body.questionNumber);
    const severity = normalizeSeverity(body.severity) ?? "medium";
    const triggerSource = body.triggerSource === "response_signal" ? "response_signal" : "manual";
    const triggerSummary = typeof body.triggerSummary === "string" && body.triggerSummary.trim()
      ? body.triggerSummary.trim().slice(0, 255)
      : "Manual review requested";

    if (!Number.isInteger(questionNumber) || questionNumber < 1) {
      return NextResponse.json({ ok: false, error: "Valid questionNumber is required." }, { status: 400 });
    }

    const [questionRows] = await getDbPool().execute<QuestionRow[]>(
      `SELECT id
       FROM assessment_questions
       WHERE question_number = ? AND is_active = TRUE
       ORDER BY id DESC
       LIMIT 1`,
      [questionNumber],
    );
    const question = questionRows[0];

    if (!question) {
      return NextResponse.json({ ok: false, error: "Question not found." }, { status: 404 });
    }

    const publicId = randomUUID();

    await getDbPool().execute(
      `INSERT INTO bias_review_items
        (public_id, question_id, status, severity, trigger_source, trigger_summary, created_by_user_id)
       VALUES (?, ?, 'open', ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        severity = VALUES(severity),
        trigger_summary = VALUES(trigger_summary),
        updated_at = CURRENT_TIMESTAMP`,
      [publicId, question.id, severity, triggerSource, triggerSummary, user.id],
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create review item.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
