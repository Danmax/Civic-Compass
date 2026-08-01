import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await clearUserSession();

  return NextResponse.json({ ok: true });
}
