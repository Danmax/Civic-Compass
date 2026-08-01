import { createHash, randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getDbPool } from "@/lib/db";
import { validateAssessmentPayload } from "@/lib/assessment";

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

    await getDbPool().execute(
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
