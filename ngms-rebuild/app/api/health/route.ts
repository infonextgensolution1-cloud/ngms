import { NextResponse } from "next/server";
import { row } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await row("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, application: "ngms-hostafrica", database: "connected" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, application: "ngms-hostafrica", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
