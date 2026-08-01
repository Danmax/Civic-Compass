import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

import { createConnection, root } from "./db-utils.mjs";

const require = createRequire(import.meta.url);
const VERSION_KEY = "2026.2";
const VERSION_TITLE = "Civic Compass 2026.2";
const DIMENSION_ORDER = ["economic", "social", "liberty", "global", "justice", "markets", "identity", "change", "trust", "faith"];
const CATEGORY_ORDER = ["economy", "immigration", "justice", "family", "equal", "rights", "institutions"];

function stableUuid(input) {
  const hash = createHash("sha1").update(`civic-compass:${input}`).digest();

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.subarray(0, 16).toString("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function loadAssessmentData() {
  const sourcePath = path.join(root, "app/data.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const sandbox = {
    exports: {},
    require,
    module: { exports: {} },
  };

  vm.runInNewContext(compiled, sandbox, { filename: sourcePath });

  return Object.keys(sandbox.module.exports).length ? sandbox.module.exports : sandbox.exports;
}

async function getId(connection, query, params) {
  const [rows] = await connection.execute(query, params);

  if (!rows[0]?.id) {
    throw new Error(`Missing seeded row for query: ${query}`);
  }

  return rows[0].id;
}

const connection = await createConnection({ multipleStatements: true });

try {
  const { ANSWERS, CATEGORIES, DIMENSIONS, IMPORTANCE, QUESTIONS } = await loadAssessmentData();

  await connection.beginTransaction();

  await connection.execute(
    `INSERT INTO assessment_versions (public_id, version_key, title, status, published_at)
     VALUES (?, ?, ?, 'published', NOW())
     ON DUPLICATE KEY UPDATE title = VALUES(title), status = 'published'`,
    [stableUuid(`version:${VERSION_KEY}`), VERSION_KEY, VERSION_TITLE],
  );
  const versionId = await getId(
    connection,
    "SELECT id FROM assessment_versions WHERE version_key = ? LIMIT 1",
    [VERSION_KEY],
  );

  for (const [index, key] of DIMENSION_ORDER.entries()) {
    const dimension = DIMENSIONS[key];

    await connection.execute(
      `INSERT INTO assessment_dimensions
        (public_id, dimension_key, name, low_label, high_label, explanation, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        low_label = VALUES(low_label),
        high_label = VALUES(high_label),
        explanation = VALUES(explanation),
        display_order = VALUES(display_order)`,
      [stableUuid(`dimension:${key}`), key, dimension.name, dimension.low, dimension.high, dimension.explanation, index + 1],
    );
  }

  for (const [index, key] of CATEGORY_ORDER.entries()) {
    const category = CATEGORIES[key];

    await connection.execute(
      `INSERT INTO assessment_categories
        (public_id, category_key, name, short_label, description, history, viewpoints, debate, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        short_label = VALUES(short_label),
        description = VALUES(description),
        history = VALUES(history),
        viewpoints = VALUES(viewpoints),
        debate = VALUES(debate),
        display_order = VALUES(display_order)`,
      [stableUuid(`category:${key}`), key, category.name, category.short, category.description, category.history, category.viewpoints, category.debate, index + 1],
    );
    const categoryId = await getId(
      connection,
      "SELECT id FROM assessment_categories WHERE category_key = ? LIMIT 1",
      [key],
    );

    for (const [readingIndex, title] of category.reading.entries()) {
      await connection.execute(
        `INSERT INTO assessment_category_readings (public_id, category_id, title, url, display_order)
         VALUES (?, ?, ?, NULL, ?)
         ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
        [stableUuid(`reading:${key}:${title}`), categoryId, title, readingIndex + 1],
      );
    }
  }

  for (const [index, answer] of ANSWERS.entries()) {
    await connection.execute(
      `INSERT INTO assessment_answer_choices (public_id, label, short_label, answer_value, display_order)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        short_label = VALUES(short_label),
        display_order = VALUES(display_order)`,
      [stableUuid(`answer:${answer.value}`), answer.label, answer.short, answer.value, index + 1],
    );
  }

  for (const [index, importance] of IMPORTANCE.entries()) {
    await connection.execute(
      `INSERT INTO assessment_importance_choices (public_id, label, multiplier, display_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        display_order = VALUES(display_order)`,
      [stableUuid(`importance:${importance.value}`), importance.label, importance.value, index + 1],
    );
  }

  for (const [index, question] of QUESTIONS.entries()) {
    const categoryId = await getId(
      connection,
      "SELECT id FROM assessment_categories WHERE category_key = ? LIMIT 1",
      [question.category],
    );

    await connection.execute(
      `INSERT INTO assessment_questions
        (public_id, version_id, question_number, category_id, statement, context, value_label, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)
       ON DUPLICATE KEY UPDATE
        category_id = VALUES(category_id),
        statement = VALUES(statement),
        context = VALUES(context),
        value_label = VALUES(value_label),
        is_active = TRUE,
        display_order = VALUES(display_order)`,
      [stableUuid(`question:${VERSION_KEY}:${question.id}`), versionId, question.id, categoryId, question.statement, question.context, question.value, index + 1],
    );
    const questionId = await getId(
      connection,
      "SELECT id FROM assessment_questions WHERE version_id = ? AND question_number = ? LIMIT 1",
      [versionId, question.id],
    );

    await connection.execute(
      "DELETE FROM assessment_question_weights WHERE question_id = ?",
      [questionId],
    );

    for (const weight of question.weights) {
      const dimensionId = await getId(
        connection,
        "SELECT id FROM assessment_dimensions WHERE dimension_key = ? LIMIT 1",
        [weight.dimension],
      );

      await connection.execute(
        "INSERT INTO assessment_question_weights (public_id, question_id, dimension_id, weight) VALUES (?, ?, ?, ?)",
        [stableUuid(`weight:${VERSION_KEY}:${question.id}:${weight.dimension}`), questionId, dimensionId, weight.weight],
      );
    }
  }

  await connection.commit();
  console.log(`Seeded ${VERSION_KEY}: ${QUESTIONS.length} questions`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
