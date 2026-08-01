import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { getCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProfileDetailRow = RowDataPacket & {
  public_id: string;
  title: string;
  mode: "quick" | "full";
  answered_count: number;
  skipped_count: number;
  confidence: number;
  answers_json: string | object;
  importance_json: string | object;
  scores_json: string | object;
  created_at: Date;
  updated_at: Date;
};

function parseJsonField(value: string | object) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const [rows] = await getDbPool().execute<ProfileDetailRow[]>(
    `SELECT public_id, title, mode, answered_count, skipped_count, confidence,
            answers_json, importance_json, scores_json, created_at, updated_at
     FROM user_assessment_profiles
     WHERE public_id = ? AND user_id = ?
     LIMIT 1`,
    [id, user.id],
  );

  if (!rows[0]) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }

  const row = rows[0];

  return NextResponse.json({
    ok: true,
    profile: {
      id: row.public_id,
      title: row.title,
      mode: row.mode,
      answeredCount: row.answered_count,
      skippedCount: row.skipped_count,
      confidence: row.confidence,
      answers: parseJsonField(row.answers_json),
      importance: parseJsonField(row.importance_json),
      scores: parseJsonField(row.scores_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const [result] = await getDbPool().execute(
    "DELETE FROM user_assessment_profiles WHERE public_id = ? AND user_id = ?",
    [id, user.id],
  );
  const affectedRows = "affectedRows" in result ? result.affectedRows : 0;

  if (!affectedRows) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
