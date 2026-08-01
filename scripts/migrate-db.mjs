import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const root = process.cwd();

async function loadEnvFile(fileName) {
  try {
    const source = await readFile(path.join(root, fileName), "utf8");

    source.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        return;
      }

      const [key, ...valueParts] = trimmed.split("=");

      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function requireEnv(name, aliases = []) {
  const keys = [name, ...aliases];
  const value = keys.map((key) => process.env[key]).find(Boolean);

  if (!value) {
    throw new Error(`Missing required environment variable: ${keys.join(" or ")}`);
  }

  return value;
}

function optionalEnv(name, aliases = []) {
  return [name, ...aliases].map((key) => process.env[key]).find(Boolean);
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

function getConnectionTarget() {
  const socketPath = optionalEnv("DB_SOCKET", ["MYSQL_SOCKET"]);

  if (socketPath) {
    return {
      socketPath,
    };
  }

  return {
    host: requireEnv("DB_HOST", ["MYSQL_HOST", "DATABASE_HOST"]),
    port: Number(optionalEnv("DB_PORT", ["MYSQL_PORT", "DATABASE_PORT"]) ?? 3306),
  };
}

const connection = await mysql.createConnection({
  ...getConnectionTarget(),
  database: requireEnv("DB_NAME", ["DB_DATABASE", "MYSQL_DATABASE", "MYSQL_DB", "DATABASE_NAME"]),
  user: requireEnv("DB_USER", ["MYSQL_USER", "DATABASE_USER"]),
  password: requireEnv("DB_PASSWORD", ["DB_PASS", "MYSQL_PASSWORD", "DATABASE_PASSWORD"]),
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
