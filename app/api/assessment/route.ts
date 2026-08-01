import { NextResponse } from "next/server";

import { fetchPublishedAssessment } from "@/lib/assessment-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      assessment: await fetchPublishedAssessment(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load assessment.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
