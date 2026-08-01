import "server-only";

import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

let pool: Pool | undefined;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv("DB_HOST"),
      port: Number(process.env.DB_PORT ?? 3306),
      database: requireEnv("DB_NAME"),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
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
