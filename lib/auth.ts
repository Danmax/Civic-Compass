import "server-only";

import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "civic_session";
const SESSION_DAYS = 30;

export type AuthUser = {
  id: number;
  publicId: string;
  email: string;
  displayName: string;
  role: "user" | "researcher" | "admin";
};

type UserRow = RowDataPacket & {
  id: number;
  public_id: string;
  email: string;
  display_name: string;
  role: AuthUser["role"];
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function safeUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    publicId: row.public_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);

  return `scrypt:${salt}:${(derived as Buffer).toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const derived = await scrypt(password, salt, expected.length);
  const actual = derived as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await getDbPool().execute(
    "INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await getDbPool().execute(
      "UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL",
      [hashSessionToken(token)],
    );
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [rows] = await getDbPool().execute<UserRow[]>(
    `SELECT users.id, users.public_id, users.email, users.display_name, users.role
     FROM user_sessions
     INNER JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.token_hash = ?
       AND user_sessions.revoked_at IS NULL
       AND user_sessions.expires_at > NOW()
     LIMIT 1`,
    [hashSessionToken(token)],
  );

  return rows[0] ? safeUser(rows[0]) : null;
}

export function validateSignupInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be an object.");
  }

  const body = input as { email?: unknown; password?: unknown; displayName?: unknown };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (password.length < 10) {
    throw new Error("Use a password of at least 10 characters.");
  }

  if (displayName.length < 2 || displayName.length > 120) {
    throw new Error("Display name must be 2 to 120 characters.");
  }

  return { email, password, displayName };
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 10) {
    throw new Error("Use a password of at least 10 characters.");
  }

  return password;
}

export async function createUser(email: string, password: string, displayName: string) {
  const publicId = randomUUID();
  const passwordHash = await hashPassword(password);

  await getDbPool().execute(
    "INSERT INTO users (public_id, email, display_name, password_hash) VALUES (?, ?, ?, ?)",
    [publicId, email, displayName, passwordHash],
  );

  const [rows] = await getDbPool().execute<UserRow[]>(
    "SELECT id, public_id, email, display_name, role FROM users WHERE public_id = ? LIMIT 1",
    [publicId],
  );

  if (!rows[0]) {
    throw new Error("Unable to create user.");
  }

  return safeUser(rows[0]);
}

export async function findUserForLogin(email: string) {
  const [rows] = await getDbPool().execute<(UserRow & { password_hash: string })[]>(
    "SELECT id, public_id, email, display_name, role, password_hash FROM users WHERE email = ? LIMIT 1",
    [normalizeEmail(email)],
  );

  return rows[0] ?? null;
}

export async function findUserByIdWithPassword(userId: number) {
  const [rows] = await getDbPool().execute<(UserRow & { password_hash: string })[]>(
    "SELECT id, public_id, email, display_name, role, password_hash FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  return rows[0] ?? null;
}
