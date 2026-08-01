import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { validateAssessmentPayload } from "@/lib/assessment";
import { getCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { insertUserProfileResponses } from "@/lib/profile-responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProfileRow = RowDataPacket & {
  public_id: string;
  title: string;
  mode: "quick" | "full";
  answered_count: number;
  skipped_count: number;
  confidence: number;
  scores_json: string | object;
  created_at: Date;
};

function parseJsonField(value: string | object) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const [rows] = await getDbPool().execute<ProfileRow[]>(
    `SELECT public_id, title, mode, answered_count, skipped_count, confidence, scores_json, created_at
     FROM user_assessment_profiles
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 25`,
    [user.id],
  );

  return NextResponse.json({
    ok: true,
    profiles: rows.map((row) => ({
      id: row.public_id,
      title: row.title,
      mode: row.mode,
      answeredCount: row.answered_count,
      skippedCount: row.skipped_count,
      confidence: row.confidence,
      scores: parseJsonField(row.scores_json),
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Log in before saving to your account." }, { status: 401 });
  }

  try {
    const body = await request.json() as { title?: unknown };
    const profile = validateAssessmentPayload(body);
    const title = typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 140)
      : `${profile.mode === "quick" ? "Quick" : "Full"} assessment`;
    const publicId = randomUUID();
    const connection = await getDbPool().getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO user_assessment_profiles
          (public_id, user_id, title, mode, answered_count, skipped_count, confidence, answers_json, importance_json, scores_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          publicId,
          user.id,
          title,
          profile.mode,
          profile.answeredCount,
          profile.skippedCount,
          profile.confidence,
          JSON.stringify(profile.answers),
          JSON.stringify(profile.importance),
          JSON.stringify(profile.scores),
        ],
      );
      const insertId = "insertId" in result ? result.insertId : 0;

      await insertUserProfileResponses(connection, insertId, profile.answers, profile.importance);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: publicId,
        title,
        mode: profile.mode,
        answeredCount: profile.answeredCount,
        skippedCount: profile.skippedCount,
        confidence: profile.confidence,
        scores: profile.scores,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
