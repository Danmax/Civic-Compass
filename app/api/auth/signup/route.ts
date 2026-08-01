import { NextResponse } from "next/server";
import { createUser, createUserSession, validateSignupInput } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = validateSignupInput(await request.json());
    const user = await createUser(email, password, displayName);
    await createUserSession(user.id);

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    const duplicate = message.includes("Duplicate entry");

    return NextResponse.json(
      { ok: false, error: duplicate ? "An account already exists for that email." : message },
      { status: duplicate ? 409 : 400 },
    );
  }
}
