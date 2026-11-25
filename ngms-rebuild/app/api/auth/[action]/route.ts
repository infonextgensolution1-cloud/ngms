import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { row, execute } from "@/lib/server/db";
import { assertSameOrigin, createStaffSession, getSessionUser, requestIpHash, revokeStaffSession, SESSION_COOKIE, verifyPassword } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ action: string }> };

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 10 * 60 * 60,
  };
}

export async function GET(_request: Request, context: Context) {
  const { action } = await context.params;
  if (action !== "session") return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request, context: Context) {
  const { action } = await context.params;
  try {
    assertSameOrigin(request);
    const store = await cookies();
    if (action === "logout") {
      const token = store.get(SESSION_COOKIE)?.value;
      if (token) await revokeStaffSession(token);
      store.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
      return NextResponse.json({ ok: true });
    }
    if (action !== "login") return NextResponse.json({ error: "Not found." }, { status: 404 });

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 200) {
      return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
    }

    const ipHash = requestIpHash(request);
    const emailHash = createHash("sha256").update(email).digest("hex");
    const recent = await row(
      "SELECT COUNT(*) AS attempts FROM login_attempts WHERE email_hash=? AND ip_hash=? AND attempted_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)",
      [emailHash, ipHash],
    );
    if (Number(recent?.attempts ?? 0) >= 8) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes and try again." }, { status: 429 });
    }

    const user = await row(
      "SELECT id,name,email,role,password_hash,is_active FROM staff_users WHERE email=? LIMIT 1",
      [email],
    );
    const valid = !!user && Number(user.is_active) === 1 && await verifyPassword(password, String(user.password_hash));
    if (!valid || !user) {
      await execute("INSERT INTO login_attempts (email_hash,ip_hash) VALUES (?,?)", [emailHash, ipHash]);
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await execute("UPDATE staff_users SET last_login_at=UTC_TIMESTAMP() WHERE id=?", [user.id]);
    const staff = { id: String(user.id), name: String(user.name), email: String(user.email), role: user.role as "owner"|"admin"|"manager"|"staff" };
    const token = await createStaffSession(staff, request.headers.get("user-agent") || "", ipHash);
    store.set(SESSION_COOKIE, token, cookieOptions());
    await execute(
      "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json,ip_hash) VALUES (UUID(),?,'login','staff_user',?,'{}',?)",
      [staff.id, staff.id, ipHash],
    );
    return NextResponse.json({ ok: true, user: staff }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 500;
    return NextResponse.json({ error: status < 500 && error instanceof Error ? error.message : "Sign-in could not be completed." }, { status });
  }
}
