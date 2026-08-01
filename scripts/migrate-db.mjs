import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createConnection, root } from "./db-utils.mjs";

const connection = await createConnection({
  multipleStatements: true,
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const sqlDir = path.join(root, "sql");
  const files = (await readdir(sqlDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const [existing] = await connection.execute(
      "SELECT id FROM schema_migrations WHERE filename = ? LIMIT 1",
      [file],
    );

    if (existing.length) {
      console.log(`Skipping ${file}`);
      continue;
    }

    const sql = await readFile(path.join(sqlDir, file), "utf8");

    await connection.query(sql);
    await connection.execute(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [file],
    );
    console.log(`Applied ${file}`);
  }
} finally {
  await connection.end();
}
