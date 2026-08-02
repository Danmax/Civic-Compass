import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 }),
    };
  }

  if (user.role !== "admin" && user.role !== "researcher") {
    return {
      user: null,
      response: NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
