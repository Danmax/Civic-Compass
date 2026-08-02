import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReviewRow = RowDataPacket & {
  id: number;
  status: string;
};

type CommentRow = RowDataPacket & {
  public_id: string;
  comment_text: string;
  display_name: string;
  created_at: Date;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdminUser();

  if (response) {
    return response;
  }

  const { id } = await params;
  const [rows] = await getDbPool().execute<CommentRow[]>(
    `SELECT bias_review_comments.public_id,
            bias_review_comments.comment_text,
            users.display_name,
            bias_review_comments.created_at
     FROM bias_review_comments
     INNER JOIN bias_review_items ON bias_review_items.id = bias_review_comments.review_item_id
     INNER JOIN users ON users.id = bias_review_comments.user_id
     WHERE bias_review_items.public_id = ?
     ORDER BY bias_review_comments.created_at ASC`,
    [id],
  );

  return NextResponse.json({
    ok: true,
    comments: rows.map((row) => ({
      id: row.public_id,
      comment: row.comment_text,
      author: row.display_name,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdminUser();

  if (response || !user) {
    return response;
  }

  const { id } = await params;
  const body = await request.json() as { comment?: unknown };
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (comment.length < 2) {
    return NextResponse.json({ ok: false, error: "Comment is required." }, { status: 400 });
  }

  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<ReviewRow[]>(
      "SELECT id, status FROM bias_review_items WHERE public_id = ? LIMIT 1",
      [id],
    );
    const item = rows[0];

    if (!item) {
      await connection.rollback();
      return NextResponse.json({ ok: false, error: "Review item not found." }, { status: 404 });
    }

    await connection.execute(
      "INSERT INTO bias_review_comments (public_id, review_item_id, user_id, comment_text) VALUES (?, ?, ?, ?)",
      [randomUUID(), item.id, user.id, comment],
    );
    await connection.execute(
      `INSERT INTO bias_review_audit_events
        (public_id, review_item_id, user_id, action, old_status, new_status, note)
       VALUES (?, ?, ?, 'comment', ?, ?, ?)`,
      [randomUUID(), item.id, user.id, item.status, item.status, comment],
    );

    await connection.commit();

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : "Unable to add comment.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  } finally {
    connection.release();
  }
}
