import { NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { transaction, row } from "@/lib/server/db";
import { assertSameOrigin, hashPassword } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && a.length >= 32 && timingSafeEqual(a, b);
}

export async function GET() {
  try {
    const state = await row("SELECT completed_at FROM setup_state WHERE id=1");
    const count = await row("SELECT COUNT(*) AS total FROM staff_users");
    return NextResponse.json({ available: !state?.completed_at && Number(count?.total ?? 0) === 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ available: false, error: "Database is not configured." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const expected = process.env.NGMS_SETUP_TOKEN || "";
    if (expected.length < 32) return NextResponse.json({ error: "Admin bootstrap is not enabled. Configure NGMS_SETUP_TOKEN on the server." }, { status: 503 });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const provided = typeof body?.setup_token === "string" ? body.setup_token : "";
    if (!tokenMatches(provided, expected)) return NextResponse.json({ error: "Setup token is invalid." }, { status: 403 });

    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 160) : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a name and valid email address." }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const userId = randomUUID();

    await transaction(async connection => {
      const [states] = await connection.execute("SELECT completed_at FROM setup_state WHERE id=1 FOR UPDATE");
      const state = (states as Array<{completed_at:string|null}>)[0];
      const [users] = await connection.execute("SELECT COUNT(*) AS total FROM staff_users");
      const count = (users as Array<{total:number}>)[0];
      if (state?.completed_at || Number(count?.total ?? 0) > 0) throw new Error("Initial administrator has already been created.");
      await connection.execute(
        "INSERT INTO staff_users (id,name,email,password_hash,role,is_active) VALUES (?,?,?,?,'owner',1)",
        [userId,name,email,passwordHash],
      );
      await connection.execute("UPDATE setup_state SET completed_at=UTC_TIMESTAMP(),completed_by=? WHERE id=1", [userId]);
      await connection.execute(
        "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json) VALUES (UUID(),?,'bootstrap','staff_user',?,'{}')",
        [userId,userId],
      );
    });
    return NextResponse.json({ ok: true, message: "Administrator created. Sign in to NGMS Business Control." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Administrator setup failed.";
    return NextResponse.json({ error: message.includes("already been created") ? message : "Administrator setup could not be completed." }, { status: message.includes("already been created") ? 409 : 500 });
  }
}
