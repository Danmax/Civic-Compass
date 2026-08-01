import { NextResponse } from "next/server";
import { createUserSession, findUserForLogin, normalizeEmail, safeUser, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = email ? await findUserForLogin(email) : null;
    const valid = user ? await verifyPassword(password, user.password_hash) : false;

    if (!user || !valid) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    await createUserSession(user.id);

    return NextResponse.json({ ok: true, user: safeUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
