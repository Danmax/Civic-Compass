import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await pingDatabase();

    return NextResponse.json({
      ok: true,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
