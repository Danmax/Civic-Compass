import "server-only";

import type { PoolConnection } from "mysql2/promise";

import type { AnswerMap, ImportanceMap } from "@/lib/assessment";

export async function insertAnonymousProfileResponses(
  connection: PoolConnection,
  profileId: number,
  answers: AnswerMap,
  importance: ImportanceMap,
) {
  await insertProfileResponses(
    connection,
    "assessment_profile_responses",
    "assessment_profile_id",
    profileId,
    answers,
    importance,
  );
}

export async function insertUserProfileResponses(
  connection: PoolConnection,
  profileId: number,
  answers: AnswerMap,
  importance: ImportanceMap,
) {
  await insertProfileResponses(
    connection,
    "user_assessment_profile_responses",
    "user_assessment_profile_id",
    profileId,
    answers,
    importance,
  );
}

async function insertProfileResponses(
  connection: PoolConnection,
  table: "assessment_profile_responses" | "user_assessment_profile_responses",
  profileColumn: "assessment_profile_id" | "user_assessment_profile_id",
  profileId: number,
  answers: AnswerMap,
  importance: ImportanceMap,
) {
  const rows = Object.entries(answers).map(([questionId, answer]) => [
    profileId,
    Number(questionId),
    answer,
    importance[Number(questionId)] ?? 1,
  ]);

  if (!rows.length) {
    return;
  }

  await connection.query(
    `INSERT INTO ${table} (${profileColumn}, question_number, answer_value, importance_multiplier)
     VALUES ?`,
    [rows],
  );
}
