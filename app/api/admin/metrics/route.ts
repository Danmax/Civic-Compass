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
  ] = await Promise.all([
    count("SELECT COUNT(*) AS count FROM users"),
    count("SELECT COUNT(*) AS count FROM user_assessment_profiles"),
    count("SELECT COUNT(*) AS count FROM assessment_profiles"),
    count("SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    count("SELECT COUNT(*) AS count FROM user_assessment_profiles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    count("SELECT COUNT(*) AS count FROM assessment_profiles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
  ]);
  const [modeRows] = await getDbPool().query<ModeRow[]>(
    `SELECT mode, COUNT(*) AS count
     FROM user_assessment_profiles
     GROUP BY mode`,
  );

  return NextResponse.json({
    ok: true,
    metrics: {
      users,
      accountProfiles,
      anonymousProfiles,
      recentUsers,
      recentAccountProfiles,
      recentAnonymousProfiles,
      accountProfilesByMode: Object.fromEntries(modeRows.map((row) => [row.mode, Number(row.count)])),
    },
  });
}
