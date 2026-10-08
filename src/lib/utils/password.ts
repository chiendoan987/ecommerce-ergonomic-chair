import crypto from "node:crypto";

/**
 * Hash a plain text password using PBKDF2 with SHA-512 and a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored hash (or plain text fallback).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Backward-compatibility / easy fallback for plain seeded passwords
  if (password === storedHash) return true;

  if (!storedHash.includes(":")) return false;

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return key === hash;
}
