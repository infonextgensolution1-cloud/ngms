import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHmac, timingSafeEqual, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { row, execute } from "@/lib/server/db";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "ngms_session";
const SESSION_HOURS = 10;

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "staff";
};

type TokenPayload = { sub: string; sid: string; exp: number; iat: number };

function secret(): Buffer {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 48) {
    throw new Error("SESSION_SECRET must be configured with at least 48 characters.");
  }
  return Buffer.from(value, "utf8");
}

function b64(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encodeToken(payload: TokenPayload): string {
  const header = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64(JSON.stringify(payload));
  const unsigned = header + "." + body;
  return unsigned + "." + sign(unsigned);
}

function decodeToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = parts[0] + "." + parts[1];
  const expected = Buffer.from(sign(unsigned));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as TokenPayload;
    if (!payload.sub || !payload.sid || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 200) {
    throw new Error("Password must be between 12 and 200 characters.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return "scrypt$" + salt.toString("base64url") + "$" + derived.toString("base64url");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, saltText, hashText] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createStaffSession(user: StaffUser, userAgent: string, ipHash: string): Promise<string> {
  const sid = randomBytes(24).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const expires = now + SESSION_HOURS * 60 * 60;
  await execute(
    "INSERT INTO staff_sessions (id,user_id,expires_at,user_agent,ip_hash) VALUES (?,?,?,?,?)",
    [sid, user.id, new Date(expires * 1000).toISOString().slice(0, 19).replace("T", " "), userAgent.slice(0, 255), ipHash],
  );
  return encodeToken({ sub: user.id, sid, iat: now, exp: expires });
}

export async function revokeStaffSession(token: string): Promise<void> {
  const payload = decodeToken(token);
  if (payload) {
    await execute("UPDATE staff_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [payload.sid]);
  }
}

export async function getSessionUser(): Promise<StaffUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;

  const result = await row(
    `SELECT u.id,u.name,u.email,u.role
     FROM staff_sessions s
     JOIN staff_users u ON u.id=s.user_id
     WHERE s.id=? AND s.user_id=? AND s.revoked_at IS NULL
       AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active=1
     LIMIT 1`,
    [payload.sid, payload.sub],
  );
  if (!result) return null;
  return {
    id: String(result.id),
    name: String(result.name),
    email: String(result.email),
    role: result.role as StaffUser["role"],
  };
}

export async function requireStaff(): Promise<StaffUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Sign in is required.", 401);
  return user;
}

export async function requireAdmin(): Promise<StaffUser> {
  const user = await requireStaff();
  if (!["owner", "admin", "manager"].includes(user.role)) throw new AuthError("Your account does not have permission for this action.", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) throw new AuthError("A same-origin browser request is required.", 403);
  try {
    if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
      throw new AuthError("Cross-origin request blocked.", 403);
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Invalid request origin.", 403);
  }
}

export function requestIpHash(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  return createHmac("sha256", secret()).update(ip).digest("hex");
}
