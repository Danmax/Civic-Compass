import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORY_KEYS = new Set(["economy", "immigration", "justice", "family", "equal", "rights", "institutions"]);

type QuestionRow = RowDataPacket & {
  id: number;
  workflow_status: string;
};

type CategoryRow = RowDataPacket & { id: number };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdminUser();
  if (response || !user) return response;

  const { id } = await params;
  const body = await request.json() as {
    statement?: unknown;
    context?: unknown;
    category?: unknown;
    value?: unknown;
  };

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (typeof body.statement === "string") {
    const statement = body.statement.trim();
    if (statement.length < 12) return NextResponse.json({ ok: false, error: "Statement is too short." }, { status: 400 });
    fields.push("statement = ?");
    values.push(statement);
  }

  if (typeof body.context === "string") {
    const context = body.context.trim();
    if (context.length < 8) return NextResponse.json({ ok: false, error: "Context is too short." }, { status: 400 });
    fields.push("context = ?");
    values.push(context);
  }

  if (typeof body.value === "string") {
    const value = body.value.trim();
    if (value.length < 2) return NextResponse.json({ ok: false, error: "Value label is too short." }, { status: 400 });
    fields.push("value_label = ?");
    values.push(value);
  }

  if (typeof body.category === "string") {
    if (!CATEGORY_KEYS.has(body.category)) return NextResponse.json({ ok: false, error: "Invalid category." }, { status: 400 });
    const [[categoryRow]] = await getDbPool().execute<CategoryRow[]>(
      "SELECT id FROM assessment_categories WHERE category_key = ? LIMIT 1",
      [body.category],
    );
    if (!categoryRow) return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
    fields.push("category_id = ?");
    values.push(categoryRow.id);
  }

  if (!fields.length) return NextResponse.json({ ok: false, error: "No supported update fields provided." }, { status: 400 });

  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<QuestionRow[]>(
      "SELECT id, workflow_status FROM assessment_questions WHERE public_id = ? LIMIT 1 FOR UPDATE",
      [id],
    );
    const question = rows[0];
    if (!question) {
      await connection.rollback();
      return NextResponse.json({ ok: false, error: "Question not found." }, { status: 404 });
    }

    values.push(user.id, question.id);
    await connection.execute(
      `UPDATE assessment_questions SET ${fields.join(", ")}, updated_by_user_id = ? WHERE id = ?`,
      values,
    );
    await connection.execute(
      `INSERT INTO question_audit_events (public_id, question_id, user_id, action, old_status, new_status, note)
       VALUES (?, ?, ?, 'update', ?, ?, 'Question fields updated')`,
      [randomUUID(), question.id, user.id, question.workflow_status, question.workflow_status],
    );
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : "Unable to update question.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  } finally {
    connection.release();
  }
}
