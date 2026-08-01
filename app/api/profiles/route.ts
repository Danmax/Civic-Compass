import { createHash, randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getDbPool } from "@/lib/db";
import { validateAssessmentPayload } from "@/lib/assessment";
import { insertAnonymousProfileResponses } from "@/lib/profile-responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hashUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return null;
  }

  return createHash("sha256").update(userAgent).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const profile = validateAssessmentPayload(await request.json());
    const publicId = randomUUID();
    const connection = await getDbPool().getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO assessment_profiles
          (public_id, mode, answered_count, skipped_count, confidence, answers_json, importance_json, scores_json, accuracy_rating, user_agent_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          publicId,
          profile.mode,
          profile.answeredCount,
          profile.skippedCount,
          profile.confidence,
          JSON.stringify(profile.answers),
          JSON.stringify(profile.importance),
          JSON.stringify(profile.scores),
          profile.accuracyRating,
          hashUserAgent(request.headers.get("user-agent")),
        ],
      );
      const insertId = "insertId" in result ? result.insertId : 0;

      await insertAnonymousProfileResponses(connection, insertId, profile.answers, profile.importance);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      ok: true,
      id: publicId,
      confidence: profile.confidence,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";
    const status = message.startsWith("Missing required environment variable") ? 500 : 400;

    return NextResponse.json({
      ok: false,
      error: message,
    }, { status });
  }
}
