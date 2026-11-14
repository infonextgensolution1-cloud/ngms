import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { execute, executeOn, row, rows, transaction } from "@/lib/server/db";
import { assertSameOrigin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ token: string }> };

function tokenHash(token: string): string {
  if (!/^[a-f0-9]{64}$/i.test(token)) throw new Error("This quotation link is invalid.");
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(_request: Request, context: Context) {
  try {
    const {token} = await context.params;
    const link = await row(
      "SELECT l.document_id,l.enquiry_id,l.customer_id,l.decision,l.job_id,l.expires_at,l.used_at,d.reference,d.customer_name,d.kind,d.amount_cents,d.subtotal_cents,d.discount_cents,d.vat_enabled,d.vat_rate_basis_points,d.vat_cents,d.status,d.issue_date,d.notes,e.service,e.area FROM quote_public_links l JOIN documents d ON d.id=l.document_id LEFT JOIN enquiries e ON e.id=l.enquiry_id WHERE l.token_hash=? LIMIT 1",
      [tokenHash(token)],
    );
    if (!link || new Date(String(link.expires_at)+"Z").getTime() <= Date.now()) return NextResponse.json({error:"This quotation link is invalid or has expired."},{status:404});
    if (link.kind !== "Quotation") return NextResponse.json({error:"This link is not a quotation."},{status:404});
    const lines = await rows("SELECT description,quantity,unit,unit_price_cents,line_total_cents FROM document_lines WHERE document_id=? ORDER BY sort_order",[link.document_id]);
    return NextResponse.json({
      quote:{
        reference:link.reference,customer_name:link.customer_name,kind:"Quotation",
        amount_cents:Number(link.amount_cents),subtotal_cents:Number(link.subtotal_cents),
        discount_cents:Number(link.discount_cents),vat_enabled:Number(link.vat_enabled),
        vat_rate_basis_points:Number(link.vat_rate_basis_points),vat_cents:Number(link.vat_cents),
        status:link.status,issue_date:link.issue_date,service:link.service,area:link.area,
        decision:link.decision,job_id:link.job_id,used_at:link.used_at,notes:link.notes || "",
      },
      lines:lines.map(line=>({...line,quantity:Number(line.quantity),unit_price_cents:Number(line.unit_price_cents),line_total_cents:Number(line.line_total_cents)})),
    },{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
  } catch {
    return NextResponse.json({error:"This quotation link is invalid or has expired."},{status:404});
  }
}

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const {token} = await context.params;
    const hash = tokenHash(token);
    const input = await request.json().catch(()=>null) as Record<string,unknown>|null;
    const decision = input?.decision;
    if (decision !== "Accepted" && decision !== "Declined") return NextResponse.json({error:"Choose whether to accept or decline this quotation."},{status:400});

    const result = await transaction(async connection => {
      const [linkRows] = await executeOn(connection,
        "SELECT l.*,d.reference,d.customer_name,d.kind,d.status AS document_status,d.amount_cents,e.service,e.area,e.details FROM quote_public_links l JOIN documents d ON d.id=l.document_id LEFT JOIN enquiries e ON e.id=l.enquiry_id WHERE l.token_hash=? FOR UPDATE",
        [hash],
      );
      const link = (linkRows as Array<Record<string,unknown>>)[0];
      if (!link || new Date(String(link.expires_at)+"Z").getTime() <= Date.now()) throw new Error("This quotation link is invalid or has expired.");
      if (link.used_at || link.decision) throw new Error("A decision has already been recorded for this quotation.");
      if (link.kind !== "Quotation" || link.document_status !== "Sent") throw new Error("This quotation is no longer awaiting a decision.");

      let jobId: string | null = null;
      if (decision === "Accepted") {
        jobId = randomUUID();
        const jobReference = "JOB-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + jobId.slice(0,6).toUpperCase();
        await executeOn(connection,
          "INSERT INTO jobs (id,reference,customer_id,source_document_id,customer_name,service,area,details,status) VALUES (?,?,?,?,?,?,?,?, 'New')",
          [jobId,jobReference,link.customer_id,link.document_id,link.customer_name,link.service || "Property maintenance",link.area || "",link.details || ""],
        );
        await executeOn(connection,"UPDATE documents SET status='Accepted' WHERE id=?",[link.document_id]);
        await executeOn(connection,"UPDATE enquiries SET status='Converted' WHERE id=?",[link.enquiry_id]);
      } else {
        await executeOn(connection,"UPDATE documents SET status='Declined' WHERE id=?",[link.document_id]);
        await executeOn(connection,"UPDATE enquiries SET status='Closed' WHERE id=?",[link.enquiry_id]);
      }
      await executeOn(connection,"UPDATE quote_public_links SET decision=?,used_at=UTC_TIMESTAMP(),job_id=? WHERE token_hash=?",[decision,jobId,hash]);
      return {saved:true,decision,reference:String(link.reference),job_id:jobId};
    });
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    const message=error instanceof Error?error.message:"The quotation decision could not be recorded.";
    return NextResponse.json({error:message},{status:message.includes("already")?409:400});
  }
}
