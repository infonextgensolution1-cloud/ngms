import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { execute, row } from "@/lib/server/db";
import { requestIpHash } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid enquiry data." }, { status: 400 });
    if (clean(body.website, 200)) return NextResponse.json({ ok: true, duplicate: true });
    const customer = clean(body.customer_name, 160);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 254).toLowerCase();
    const service = clean(body.service, 160);
    const area = clean(body.area, 160);
    const details = clean(body.details, 4000);
    const submissionKey = clean(body.submissionKey, 80);
    if (customer.length < 2 || !service || area.length < 2 || details.length < 10 || (!phone && !email)) {
      return NextResponse.json({ ok: false, error: "Please complete your name, contact details, service, area and job description." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    if (submissionKey) {
      const existing = await row("SELECT reference FROM enquiries WHERE submission_key=? LIMIT 1", [submissionKey]);
      if (existing) return NextResponse.json({ ok: true, duplicate: true, reference: existing.reference });
    }

    const ipHash = requestIpHash(request);
    const recent = await row(
      "SELECT COUNT(*) AS total FROM public_intake_attempts WHERE ip_hash=? AND attempted_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)",
      [ipHash],
    );
    if (Number(recent?.total ?? 0) >= 12) return NextResponse.json({ ok: false, error: "Too many requests. Please contact NGMS directly on WhatsApp." }, { status: 429 });
    await execute("INSERT INTO public_intake_attempts (ip_hash) VALUES (?)", [ipHash]);

    const id = randomUUID();
    const reference = "NGMS-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + randomUUID().slice(0,6).toUpperCase();
    await execute(
      "INSERT INTO enquiries (id,reference,customer_name,phone,email,service,area,details,status,submission_key,source) VALUES (?,?,?,?,?,?,?,?,'New',?,'website')",
      [id,reference,customer,phone,email,service,area,details,submissionKey || null],
    );
    return NextResponse.json({ ok: true, reference }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Your request could not be saved. Please contact NGMS on WhatsApp or telephone." }, { status: 500 });
  }
}
