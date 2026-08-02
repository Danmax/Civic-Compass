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
  status: string;
};

function normalizeStatus(value: unknown) {
  return typeof value === "string" && STATUSES.has(value) ? value : null;
}

function normalizeSeverity(value: unknown) {
  return typeof value === "string" && SEVERITIES.has(value) ? value : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdminUser();

  if (response || !user) {
    return response;
  }

  const { id } = await params;
  const body = await request.json() as {
    status?: unknown;
    severity?: unknown;
    assignToSelf?: unknown;
    note?: unknown;
  };
  const status = normalizeStatus(body.status);
  const severity = normalizeSeverity(body.severity);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : null;

  if (!status && !severity && body.assignToSelf !== true) {
    return NextResponse.json({ ok: false, error: "No supported update fields provided." }, { status: 400 });
  }

  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<ReviewRow[]>(
      "SELECT id, status FROM bias_review_items WHERE public_id = ? LIMIT 1 FOR UPDATE",
      [id],
    );
    const item = rows[0];

    if (!item) {
      await connection.rollback();
      return NextResponse.json({ ok: false, error: "Review item not found." }, { status: 404 });
    }

    await connection.execute(
      `UPDATE bias_review_items
       SET status = COALESCE(?, status),
           severity = COALESCE(?, severity),
           assigned_to_user_id = CASE WHEN ? THEN ? ELSE assigned_to_user_id END,
           resolved_by_user_id = CASE WHEN ? IN ('approved', 'resolved') THEN ? ELSE resolved_by_user_id END,
           resolved_at = CASE WHEN ? IN ('approved', 'resolved') THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [status, severity, body.assignToSelf === true, user.id, status, user.id, status, item.id],
    );

    await connection.execute(
      `INSERT INTO bias_review_audit_events
        (public_id, review_item_id, user_id, action, old_status, new_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        item.id,
        user.id,
        status ? "status_update" : body.assignToSelf === true ? "assign_to_self" : "severity_update",
        item.status,
        status ?? item.status,
        note,
      ],
    );

    await connection.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : "Unable to update review item.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  } finally {
    connection.release();
  }
}
