import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = new Set(["draft", "in_review", "approved", "published", "archived", "rejected"]);

type QuestionRow = RowDataPacket & {
  id: number;
  workflow_status: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdminUser();
  if (response || !user) return response;

  const { id } = await params;
  const body = await request.json() as { status?: unknown; note?: unknown };
  const status = typeof body.status === "string" && STATUSES.has(body.status) ? body.status : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : null;

  if (!status) return NextResponse.json({ ok: false, error: "Valid status is required." }, { status: 400 });

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

    await connection.execute(
      "UPDATE assessment_questions SET workflow_status = ?, is_active = ?, updated_by_user_id = ? WHERE id = ?",
      [status, status === "published", user.id, question.id],
    );
    await connection.execute(
      `INSERT INTO question_audit_events (public_id, question_id, user_id, action, old_status, new_status, note)
       VALUES (?, ?, ?, 'status_update', ?, ?, ?)`,
      [randomUUID(), question.id, user.id, question.workflow_status, status, note],
    );
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : "Unable to update question status.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  } finally {
    connection.release();
  }
}
