import { createHmac, pbkdf2Sync, randomBytes } from "crypto";

const SECRET = process.env.SESSION_SECRET || "washington-pos-secret-key-2024";
export const SESSION_COOKIE = "pos_session";

// Password hashing
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return verify === hash;
}

// Session cookie signing
export function signSession(userId: number): string {
  const payload = String(userId);
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(cookie: string): number | null {
  const dotIdx = cookie.indexOf(".");
  if (dotIdx === -1) return null;
  const payload = cookie.slice(0, dotIdx);
  const sig = cookie.slice(dotIdx + 1);
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  const id = parseInt(payload);
  return isNaN(id) ? null : id;
}
