import { NextResponse } from "next/server";
import { getCurrentUser, safeUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UserRow = RowDataPacket & {
  id: number;
  public_id: string;
  email: string;
  display_name: string;
  role: "user" | "researcher" | "admin";
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json() as { displayName?: unknown };
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

    if (displayName.length < 2 || displayName.length > 120) {
      return NextResponse.json(
        { ok: false, error: "Display name must be 2 to 120 characters." },
        { status: 400 },
      );
    }

    await getDbPool().execute(
      "UPDATE users SET display_name = ? WHERE id = ?",
      [displayName, user.id],
    );

    const [rows] = await getDbPool().execute<UserRow[]>(
      "SELECT id, public_id, email, display_name, role FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: safeUser(rows[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update account.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
