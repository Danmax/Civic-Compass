import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

export const root = process.cwd();

export async function loadEnvFile(fileName) {
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

export function requireEnv(name, aliases = []) {
  const keys = [name, ...aliases];
  const value = keys.map((key) => process.env[key]).find(Boolean);

  if (!value) {
    throw new Error(`Missing required environment variable: ${keys.join(" or ")}`);
  }

  return value;
}

export function optionalEnv(name, aliases = []) {
  return [name, ...aliases].map((key) => process.env[key]).find(Boolean);
}

export function getConnectionTarget() {
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

export async function loadDbEnv() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");
}

export async function createConnection(options = {}) {
  await loadDbEnv();

  return mysql.createConnection({
    ...getConnectionTarget(),
    database: requireEnv("DB_NAME", ["DB_DATABASE", "MYSQL_DATABASE", "MYSQL_DB", "DATABASE_NAME"]),
    user: requireEnv("DB_USER", ["MYSQL_USER", "DATABASE_USER"]),
    password: requireEnv("DB_PASSWORD", ["DB_PASS", "MYSQL_PASSWORD", "DATABASE_PASSWORD"]),
    ...options,
  });
}
