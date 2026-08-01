import "server-only";

import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

let pool: Pool | undefined;

function requireEnv(name: string, aliases: string[] = []) {
  const keys = [name, ...aliases];
  const value = keys.map((key) => process.env[key]).find(Boolean);

  if (!value) {
    throw new Error(`Missing required environment variable: ${keys.join(" or ")}`);
  }

  return value;
}

function optionalEnv(name: string, aliases: string[] = []) {
  return [name, ...aliases].map((key) => process.env[key]).find(Boolean);
}

function getSslConfig(): PoolOptions["ssl"] {
  const ssl = process.env.DB_SSL?.toLowerCase();

  if (ssl !== "true") {
    return undefined;
  }

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

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

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getConnectionTarget(),
      database: requireEnv("DB_NAME", ["DB_DATABASE", "MYSQL_DATABASE", "MYSQL_DB", "DATABASE_NAME"]),
      user: requireEnv("DB_USER", ["MYSQL_USER", "DATABASE_USER"]),
      password: requireEnv("DB_PASSWORD", ["DB_PASS", "MYSQL_PASSWORD", "DATABASE_PASSWORD"]),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
      queueLimit: 0,
      ssl: getSslConfig(),
    });
  }

  return pool;
}

export async function pingDatabase() {
  const [rows] = await getDbPool().query("SELECT 1 AS ok");

  return rows;
}
