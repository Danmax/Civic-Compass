import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { getCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = RowDataPacket & {
  count: number;
};

type ModeRow = RowDataPacket & {
  mode: "quick" | "full";
  count: number;
};

type AverageRow = RowDataPacket & {
  average: string | number | null;
};

type RatingRow = RowDataPacket & {
  accuracy_rating: string;
  count: number;
};

type QuestionStatRow = RowDataPacket & {
  question_number: number;
  total: number;
  skipped: number;
  average_strength: string | number | null;
};

type BiasStatusRow = RowDataPacket & {
  status: string;
  count: number;
};

async function count(query: string) {
  const [rows] = await getDbPool().query<CountRow[]>(query);

  return Number(rows[0]?.count ?? 0);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "admin" && user.role !== "researcher") {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
  }

  const [
    users,
    accountProfiles,
    anonymousProfiles,
    recentUsers,
    recentAccountProfiles,
    recentAnonymousProfiles,
    savedResponses,
    anonymousResponses,
    questionCount,
    biasReviewItems,
    openBiasReviewItems,
    highSeverityBiasReviewItems,
  ] = await Promise.all([
    count("SELECT COUNT(*) AS count FROM users"),
    count("SELECT COUNT(*) AS count FROM user_assessment_profiles"),
    count("SELECT COUNT(*) AS count FROM assessment_profiles"),
    count("SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    count("SELECT COUNT(*) AS count FROM user_assessment_profiles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    count("SELECT COUNT(*) AS count FROM assessment_profiles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    count("SELECT COUNT(*) AS count FROM user_assessment_profile_responses"),
    count("SELECT COUNT(*) AS count FROM assessment_profile_responses"),
    count("SELECT COUNT(*) AS count FROM assessment_questions WHERE is_active = TRUE"),
    count("SELECT COUNT(*) AS count FROM bias_review_items"),
    count("SELECT COUNT(*) AS count FROM bias_review_items WHERE status IN ('open', 'in_review', 'needs_revision')"),
    count("SELECT COUNT(*) AS count FROM bias_review_items WHERE severity = 'high' AND status IN ('open', 'in_review', 'needs_revision')"),
  ]);
  const [modeRows] = await getDbPool().query<ModeRow[]>(
    `SELECT mode, COUNT(*) AS count
     FROM user_assessment_profiles
     GROUP BY mode`,
  );
  const [confidenceRows] = await getDbPool().query<AverageRow[]>(
    `SELECT AVG(confidence) AS average
     FROM (
      SELECT confidence FROM assessment_profiles
      UNION ALL
      SELECT confidence FROM user_assessment_profiles
     ) profile_confidence`,
  );
  const [ratingRows] = await getDbPool().query<RatingRow[]>(
    `SELECT accuracy_rating, COUNT(*) AS count
     FROM assessment_profiles
     WHERE accuracy_rating IS NOT NULL AND accuracy_rating <> ''
     GROUP BY accuracy_rating
     ORDER BY count DESC`,
  );
  const [questionRows] = await getDbPool().query<QuestionStatRow[]>(
    `SELECT question_number,
            COUNT(*) AS total,
            SUM(answer_value IS NULL) AS skipped,
            AVG(ABS(answer_value)) AS average_strength
     FROM (
      SELECT question_number, answer_value FROM assessment_profile_responses
      UNION ALL
      SELECT question_number, answer_value FROM user_assessment_profile_responses
     ) response_rows
     GROUP BY question_number
     ORDER BY question_number ASC`,
  );
  const [biasStatusRows] = await getDbPool().query<BiasStatusRow[]>(
    `SELECT status, COUNT(*) AS count
     FROM bias_review_items
     GROUP BY status`,
  );
  const totalProfiles = accountProfiles + anonymousProfiles;
  const totalResponses = savedResponses + anonymousResponses;
  const averageConfidence = confidenceRows[0]?.average === null
    ? null
    : Math.round(Number(confidenceRows[0]?.average ?? 0));

  return NextResponse.json({
    ok: true,
    metrics: {
      users,
      accountProfiles,
      anonymousProfiles,
      totalProfiles,
      recentUsers,
      recentAccountProfiles,
      recentAnonymousProfiles,
      savedResponses,
      anonymousResponses,
      totalResponses,
      questionCount,
      averageConfidence,
      biasReviewItems,
      openBiasReviewItems,
      highSeverityBiasReviewItems,
      biasReviewByStatus: Object.fromEntries(biasStatusRows.map((row) => [row.status, Number(row.count)])),
      accountProfilesByMode: Object.fromEntries(modeRows.map((row) => [row.mode, Number(row.count)])),
      accuracyRatings: ratingRows.map((row) => ({
        rating: row.accuracy_rating,
        count: Number(row.count),
      })),
      questionStats: questionRows.map((row) => ({
        questionNumber: row.question_number,
        total: Number(row.total),
        skipped: Number(row.skipped),
        skipRate: Number(row.total) ? Number(((Number(row.skipped) / Number(row.total)) * 100).toFixed(1)) : 0,
        averageStrength: row.average_strength === null ? null : Number(Number(row.average_strength).toFixed(2)),
      })),
    },
  });
}
