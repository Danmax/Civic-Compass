import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { requireAdminUser } from "@/lib/admin-auth";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORY_KEYS = ["economy", "immigration", "justice", "family", "equal", "rights", "institutions"] as const;
const CATEGORY_SET = new Set<string>(CATEGORY_KEYS);
const DEFAULT_MODEL = "gpt-5.6-sol";

type CategoryKey = typeof CATEGORY_KEYS[number];
type ExistingQuestionRow = RowDataPacket & {
  statement: string;
  context: string;
  value_label: string;
};

type GeneratedQuestion = {
  statement: string;
  context: string;
  value: string;
  category: CategoryKey;
  rationale: string;
};

type ResponsesApiBody = {
  output_text?: string;
  output?: {
    content?: {
      type?: string;
      text?: string;
    }[];
  }[];
  error?: {
    message?: string;
  };
};

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function extractResponseText(body: ResponsesApiBody) {
  if (body.output_text) return body.output_text;

  return body.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("")
    .trim() ?? "";
}

function normalizeGeneratedQuestions(value: unknown, category: CategoryKey) {
  if (!value || typeof value !== "object" || !("questions" in value) || !Array.isArray(value.questions)) {
    return [];
  }

  return value.questions
    .map((question): GeneratedQuestion | null => {
      if (!question || typeof question !== "object") return null;

      const candidate = question as Record<string, unknown>;
      const statement = cleanText(candidate.statement, 220);
      const context = cleanText(candidate.context, 240);
      const generatedCategory = cleanText(candidate.category, 40);
      const valueLabel = cleanText(candidate.value, 80);
      const rationale = cleanText(candidate.rationale, 180);

      if (statement.length < 12 || context.length < 8 || valueLabel.length < 2 || generatedCategory !== category) {
        return null;
      }

      return {
        statement,
        context,
        value: valueLabel,
        category,
        rationale,
      };
    })
    .filter(Boolean) as GeneratedQuestion[];
}

export async function POST(request: Request) {
  const { response } = await requireAdminUser();
  if (response) return response;

  const apiKey = getOpenAiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json() as {
      category?: unknown;
      topic?: unknown;
      count?: unknown;
      guidance?: unknown;
    };
    const category = typeof body.category === "string" && CATEGORY_SET.has(body.category)
      ? body.category as CategoryKey
      : null;
    const count = Math.max(1, Math.min(5, Number(body.count) || 3));
    const topic = cleanText(body.topic, 160);
    const guidance = cleanText(body.guidance, 500);

    if (!category) {
      return NextResponse.json({ ok: false, error: "Valid category is required." }, { status: 400 });
    }

    const [existingRows] = await getDbPool().execute<ExistingQuestionRow[]>(
      `SELECT statement, context, value_label
       FROM assessment_questions
       INNER JOIN assessment_categories ON assessment_categories.id = assessment_questions.category_id
       WHERE assessment_categories.category_key = ?
       ORDER BY assessment_questions.display_order ASC
       LIMIT 24`,
      [category],
    );

    const model = process.env.OPENAI_QUESTION_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
    const prompt = {
      category,
      count,
      topic: topic || "balanced civic assessment prompts",
      guidance,
      existingQuestions: existingRows.map((row) => ({
        statement: row.statement,
        context: row.context,
        value: row.value_label,
      })),
    };

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1400,
        input: [
          {
            role: "system",
            content: "Generate neutral, plain-language civic assessment question drafts. Avoid partisan slogans, leading wording, double-barreled statements, stereotypes, and inflammatory framing. Each statement must be suitable for agreement-scale answers and must test one idea only.",
          },
          {
            role: "user",
            content: JSON.stringify(prompt),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "civic_question_generation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["questions"],
              properties: {
                questions: {
                  type: "array",
                  minItems: count,
                  maxItems: count,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["statement", "context", "value", "category", "rationale"],
                    properties: {
                      statement: {
                        type: "string",
                        minLength: 12,
                        maxLength: 220,
                        description: "A neutral agreement-scale civic assessment statement.",
                      },
                      context: {
                        type: "string",
                        minLength: 8,
                        maxLength: 240,
                        description: "Short clarification that narrows scope without steering the answer.",
                      },
                      value: {
                        type: "string",
                        minLength: 2,
                        maxLength: 80,
                        description: "The civic value or principle the question is designed to surface.",
                      },
                      category: {
                        type: "string",
                        enum: [category],
                      },
                      rationale: {
                        type: "string",
                        minLength: 8,
                        maxLength: 180,
                        description: "Why this question fills a useful gap and what bias risk to review.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    const responseBody = await openAiResponse.json() as ResponsesApiBody;

    if (!openAiResponse.ok) {
      return NextResponse.json(
        { ok: false, error: responseBody.error?.message ?? "OpenAI question generation failed." },
        { status: openAiResponse.status },
      );
    }

    const outputText = extractResponseText(responseBody);
    const parsed = JSON.parse(outputText) as unknown;
    const questions = normalizeGeneratedQuestions(parsed, category).slice(0, count);

    if (!questions.length) {
      return NextResponse.json(
        { ok: false, error: "AI response did not include usable question drafts." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, questions, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate question drafts.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
