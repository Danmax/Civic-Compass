import { NextResponse } from "next/server";
import {
  clearUserSession,
  findUserByIdWithPassword,
  getCurrentUser,
  hashPassword,
  safeUser,
  validatePassword,
  verifyPassword,
} from "@/lib/auth";
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
    const body = await request.json() as {
      displayName?: unknown;
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const hasPasswordChange = body.currentPassword !== undefined || body.newPassword !== undefined;

    if (body.displayName !== undefined && (displayName.length < 2 || displayName.length > 120)) {
      return NextResponse.json(
        { ok: false, error: "Display name must be 2 to 120 characters." },
        { status: 400 },
      );
    }

    if (body.displayName !== undefined) {
      await getDbPool().execute(
        "UPDATE users SET display_name = ? WHERE id = ?",
        [displayName, user.id],
      );
    }

    if (hasPasswordChange) {
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword = validatePassword(body.newPassword);
      const storedUser = await findUserByIdWithPassword(user.id);

      if (!storedUser || !(await verifyPassword(currentPassword, storedUser.password_hash))) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 401 });
      }

      await getDbPool().execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [await hashPassword(newPassword), user.id],
      );
      await getDbPool().execute(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
        [user.id],
      );
    }

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

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const storedUser = await findUserByIdWithPassword(user.id);

    if (!storedUser || !(await verifyPassword(password, storedUser.password_hash))) {
      return NextResponse.json({ ok: false, error: "Password is incorrect." }, { status: 401 });
    }

    await getDbPool().execute("DELETE FROM users WHERE id = ?", [user.id]);
    await clearUserSession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete account.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
