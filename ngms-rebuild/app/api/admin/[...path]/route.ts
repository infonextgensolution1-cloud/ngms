import { NextResponse } from "next/server";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { assertSameOrigin, AuthError, requireAdmin, type StaffUser, requestIpHash } from "@/lib/server/auth";
import { execute, getDb, row, rows, transaction } from "@/lib/server/db";
import { getMediaRecord, listMedia, readMediaBytes, removeMedia, replaceMedia, saveMedia, updateMedia } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };
type Body = Record<string, unknown>;

const send = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

async function bodyOf(request: Request): Promise<Body> {
  const value = await request.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Body : {};
}
function text(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function cents(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100000000) throw new Error("Enter a valid non-negative ZAR amount.");
  return Math.round(number * 100);
}
function dateTime(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date and time.");
  return date.toISOString().slice(0, 19).replace("T", " ");
}
function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "item";
}
async function audit(user: StaffUser, request: Request, action: string, type: string, id: string, details: unknown = {}) {
  await execute(
    "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json,ip_hash) VALUES (?,?,?,?,?,?,?)",
    [randomUUID(), user.id, action, type, id, JSON.stringify(details), requestIpHash(request)],
  );
}
async function userCanApprove(user: StaffUser): Promise<void> {
  if (user.role !== "owner" && user.role !== "admin") throw new AuthError("Only an owner or administrator can approve website publication.", 403);
}
async function ensureCustomer(customerId: string): Promise<Record<string, unknown>> {
  const customer = await row("SELECT * FROM customers WHERE id=? LIMIT 1", [customerId]);
  if (!customer) throw new Error("Customer record was not found.");
  return customer as Record<string, unknown>;
}
async function makeCustomer(input: Body): Promise<Record<string, unknown>> {
  const name = text(input.display_name || input.customer_name, 180);
  if (name.length < 2) throw new Error("A customer name is required.");
  const id = randomUUID();
  await execute(
    "INSERT INTO customers (id,display_name,customer_type,primary_phone,primary_email,service_address,billing_address) VALUES (?,?,?,?,?,?,?)",
    [id,name,text(input.customer_type,40) || "Individual",text(input.primary_phone || input.phone,40),text(input.primary_email || input.email,254).toLowerCase(),text(input.service_address || input.area,500),text(input.billing_address,500)],
  );
  return await row("SELECT * FROM customers WHERE id=?", [id]) as Record<string, unknown>;
}
async function createBasicRecord(resource: string, input: Body, user: StaffUser, request: Request): Promise<Record<string, unknown>> {
  if (resource === "customers") return makeCustomer(input);
  if (resource === "enquiries") {
    const customer = text(input.customer_name,160);
    const service = text(input.service,160);
    if (customer.length < 2 || !service) throw new Error("Customer name and service are required.");
    const id = randomUUID();
    const reference = "NGMS-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + id.slice(0,6).toUpperCase();
    await execute("INSERT INTO enquiries (id,reference,customer_name,phone,email,service,area,details,status,source) VALUES (?,?,?,?,?,?,?,?,'New','admin')",
      [id,reference,customer,text(input.phone,40),text(input.email,254).toLowerCase(),service,text(input.area,160),text(input.details,4000)]);
    await audit(user,request,"create","enquiry",id,{reference});
    return await row("SELECT * FROM enquiries WHERE id=?", [id]) as Record<string, unknown>;
  }
  if (resource === "jobs") {
    const customer = text(input.customer_name,160);
    const service = text(input.service,160);
    if (customer.length < 2 || !service) throw new Error("Customer name and service are required.");
    const id = randomUUID();
    const reference = "JOB-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + id.slice(0,6).toUpperCase();
    await execute("INSERT INTO jobs (id,reference,customer_name,service,area,details,status) VALUES (?,?,?,?,?,?,'New')",
      [id,reference,customer,service,text(input.area,160),text(input.details,4000)]);
    await audit(user,request,"create","job",id,{reference});
    return await row("SELECT * FROM jobs WHERE id=?", [id]) as Record<string, unknown>;
  }
  if (resource === "schedules") {
    const title = text(input.title,180);
    const start = dateTime(input.scheduled_start);
    const end = dateTime(input.scheduled_end);
    if (!title || new Date(end) <= new Date(start)) throw new Error("Enter an appointment title and an end time after the start time.");
    const id = randomUUID();
    await execute("INSERT INTO schedules (id,title,customer_name,service,area,assigned_to,scheduled_start,scheduled_end,notes,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [id,title,text(input.customer_name,180),text(input.service,180),text(input.area,180),text(input.assigned_to,180),start,end,text(input.notes,4000),text(input.status,30) || "Scheduled",user.id]);
    await audit(user,request,"create","schedule",id);
    return await row("SELECT * FROM schedules WHERE id=?", [id]) as Record<string, unknown>;
  }
  throw new Error("This record type cannot be created through this endpoint.");
}

async function createCommercialDocument(input: Body, user: StaffUser, request: Request) {
  const kind = input.kind === "Quotation" || input.kind === "Invoice" ? input.kind : "";
  if (!kind) throw new Error("Document type must be Quotation or Invoice.");
  const id = randomUUID();
  return transaction(async connection => {
    if (kind === "Invoice") {
      const sourceId = text(input.source_document_id,80);
      if (!sourceId) throw new Error("Choose an accepted quotation.");
      const [sourceRows] = await connection.execute("SELECT * FROM documents WHERE id=? AND kind='Quotation' FOR UPDATE", [sourceId]);
      const source = (sourceRows as Array<Record<string,unknown>>)[0];
      if (!source || source.status !== "Accepted") throw new Error("Invoices can only be created from accepted quotations.");
      const [existingRows] = await connection.execute("SELECT id FROM documents WHERE source_document_id=? AND kind='Invoice' LIMIT 1", [sourceId]);
      if ((existingRows as unknown[]).length) throw new Error("An invoice has already been created from this quotation.");
      const ref = "INV-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + id.slice(0,6).toUpperCase();
      await connection.execute(
        "INSERT INTO documents (id,reference,customer_id,customer_name,kind,amount_cents,subtotal_cents,discount_cents,vat_enabled,vat_rate_basis_points,vat_cents,status,issue_date,due_date,notes,source_document_id) VALUES (?,?,?,?, 'Invoice',?,?,?,?,? ,?,'Draft',UTC_DATE(),?,?,?)",
        [id,ref,source.customer_id,source.customer_name,source.amount_cents,source.subtotal_cents,source.discount_cents,source.vat_enabled,source.vat_rate_basis_points,source.vat_cents,text(input.due_date,20) || null,text(input.notes,4000) || source.notes || "",sourceId],
      );
      await connection.execute(
        "INSERT INTO document_lines (id,document_id,description,quantity,unit,unit_price_cents,line_total_cents,sort_order) SELECT UUID(),?,description,quantity,unit,unit_price_cents,line_total_cents,sort_order FROM document_lines WHERE document_id=?",
        [id,sourceId],
      );
    } else {
      const customerId = text(input.customer_id,80);
      const [customerRows] = await connection.execute("SELECT id,display_name FROM customers WHERE id=? LIMIT 1", [customerId]);
      const customer = (customerRows as Array<Record<string,unknown>>)[0];
      if (!customer) throw new Error("Select an existing customer from the CRM.");
      const lines = Array.isArray(input.lines) ? input.lines as Body[] : [];
      if (!lines.length || lines.length > 100) throw new Error("A quotation needs between 1 and 100 line items.");
      let subtotal = 0;
      const normalized = lines.map((line,index) => {
        const description = text(line.description,500);
        const quantity = Number(line.quantity);
        const unit = text(line.unit,40) || "item";
        const unitPrice = cents(line.unit_price);
        if (!description || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) throw new Error("Check each quotation line description, quantity and price.");
        const lineTotal = Math.round(quantity * unitPrice);
        subtotal += lineTotal;
        return {description,quantity,unit,unitPrice,lineTotal,index};
      });
      const discount = cents(input.discount_amount ?? 0);
      if (discount > subtotal) throw new Error("Discount cannot exceed the quotation subtotal.");
      const net = subtotal - discount;
      const vatEnabled = input.vat_enabled === true;
      const vatRate = 1500;
      const vat = vatEnabled ? Math.round(net * vatRate / 10000) : 0;
      const total = net + vat;
      const ref = "QT-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + id.slice(0,6).toUpperCase();
      await connection.execute(
        "INSERT INTO documents (id,reference,customer_id,customer_name,kind,amount_cents,subtotal_cents,discount_cents,vat_enabled,vat_rate_basis_points,vat_cents,status,issue_date,notes) VALUES (?,?,?,?, 'Quotation',?,?,?,?,?,?,'Draft',UTC_DATE(),?)",
        [id,ref,customer.id,customer.display_name,total,subtotal,discount,vatEnabled?1:0,vatRate,vat,text(input.notes,4000)],
      );
      for (const line of normalized) {
        await connection.execute(
          "INSERT INTO document_lines (id,document_id,description,quantity,unit,unit_price_cents,line_total_cents,sort_order) VALUES (?,?,?,?,?,?,?,?)",
          [randomUUID(),id,line.description,line.quantity,line.unit,line.unitPrice,line.lineTotal,line.index],
        );
      }
    }
    await connection.execute(
      "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json) VALUES (?,?,?,?,?,?)",
      [randomUUID(),user.id,"create",kind.toLowerCase(),id,JSON.stringify({kind})],
    );
    const [savedRows] = await connection.execute("SELECT * FROM documents WHERE id=?", [id]);
    return (savedRows as Array<Record<string,unknown>>)[0];
  });
}

async function commercialList(url: URL) {
  const kind = url.searchParams.get("kind");
  if (kind !== "Quotation" && kind !== "Invoice") throw new Error("Choose Quotation or Invoice.");
  const status = url.searchParams.get("status");
  const allowed = ["Draft","Sent","Accepted","Declined","Expired","Overdue","Cancelled","Paid"];
  if (status && !allowed.includes(status)) throw new Error("Invalid document status.");
  const items = await rows(
    `SELECT d.*, (SELECT COUNT(*) FROM document_lines l WHERE l.document_id=d.id) AS line_item_count,
     CASE WHEN d.kind='Invoice' AND d.amount_cents < (SELECT COALESCE(SUM(p.amount_cents),0) FROM invoice_payments p WHERE p.document_id=d.id) THEN 'OVERPAID'
          ELSE 'OK' END AS integrity_status
     FROM documents d WHERE d.kind=? AND (? IS NULL OR d.status=?) ORDER BY d.created_at DESC LIMIT 300`,
    [kind,status,status],
  );
  return items;
}

async function commercialDetails(id: string) {
  const item = await row("SELECT * FROM documents WHERE id=? LIMIT 1", [id]);
  if (!item) return null;
  const lines = await rows("SELECT * FROM document_lines WHERE document_id=? ORDER BY sort_order,description", [id]);
  return { item, lines };
}

async function updateDocumentStatus(id: string, status: string, user: StaffUser, request: Request) {
  const allowed = ["Draft","Sent","Accepted","Declined","Expired","Overdue","Cancelled","Paid"];
  if (!allowed.includes(status)) throw new Error("Invalid document status.");
  const existing = await row("SELECT id,kind FROM documents WHERE id=?", [id]);
  if (!existing) return null;
  if (status === "Paid" && existing.kind !== "Invoice") throw new Error("Only invoices can be marked paid.");
  await execute("UPDATE documents SET status=? WHERE id=?", [status,id]);
  await audit(user,request,"status_change",String(existing.kind).toLowerCase(),id,{status});
  return await row("SELECT * FROM documents WHERE id=?", [id]);
}

async function invoicePayments(id: string, request: Request, user: StaffUser) {
  const document = await row("SELECT * FROM documents WHERE id=? AND kind='Invoice'", [id]);
  if (!document) return null;
  if (request.method === "GET") {
    const items = await rows("SELECT * FROM invoice_payments WHERE document_id=? ORDER BY paid_at DESC", [id]);
    const total = items.reduce((sum,item) => sum + Number(item.amount_cents),0);
    return {items,paid_cents:total,balance_cents:Math.max(0,Number(document.amount_cents)-total)};
  }
  const input = await bodyOf(request);
  const amount = cents(input.amount);
  if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
  const method = text(input.method,30);
  if (!["EFT","Cash","Card","Other"].includes(method)) throw new Error("Choose a valid payment method.");
  const paidAt = dateTime(input.paid_at || new Date().toISOString());
  return transaction(async connection => {
    const [docs] = await connection.execute("SELECT amount_cents FROM documents WHERE id=? AND kind='Invoice' FOR UPDATE",[id]);
    const current = (docs as Array<{amount_cents:number}>)[0];
    if (!current) throw new Error("Invoice not found.");
    const [totals] = await connection.execute("SELECT COALESCE(SUM(amount_cents),0) AS paid FROM invoice_payments WHERE document_id=?",[id]);
    const alreadyPaid = Number((totals as Array<{paid:number}>)[0]?.paid ?? 0);
    const balance = Number(current.amount_cents)-alreadyPaid;
    if (amount > balance) throw new Error("Payment exceeds the outstanding invoice balance.");
    await connection.execute(
      "INSERT INTO invoice_payments (id,document_id,amount_cents,method,paid_at,reference,notes,recorded_by) VALUES (?,?,?,?,?,?,?,?)",
      [randomUUID(),id,amount,method,paidAt,text(input.reference,160),text(input.notes,2000),user.id],
    );
    const newPaid = alreadyPaid + amount;
    const newBalance = Number(current.amount_cents)-newPaid;
    if (newBalance === 0) await connection.execute("UPDATE documents SET status='Paid' WHERE id=?",[id]);
    await connection.execute(
      "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json) VALUES (UUID(),?,'payment_recorded','invoice',?,?)",
      [user.id,id,JSON.stringify({amount_cents:amount,method})],
    );
    return {saved:true,paid_cents:newPaid,balance_cents:newBalance,status:newBalance===0?"Paid":String(document.status)};
  });
}

async function convertEnquiry(id: string, user: StaffUser, request: Request) {
  return transaction(async connection => {
    const [enquiries] = await connection.execute("SELECT * FROM enquiries WHERE id=? FOR UPDATE",[id]);
    const enquiry = (enquiries as Array<Record<string,unknown>>)[0];
    if (!enquiry) return null;
    let customerId = enquiry.customer_id ? String(enquiry.customer_id) : "";
    if (!customerId) {
      const [customers] = await connection.execute(
        "SELECT id FROM customers WHERE (primary_phone<>'' AND primary_phone=?) OR (primary_email<>'' AND primary_email=?) ORDER BY created_at LIMIT 1",
        [enquiry.phone,enquiry.email],
      );
      customerId = String((customers as Array<{id:string}>)[0]?.id || "");
      if (!customerId) {
        customerId = randomUUID();
        await connection.execute(
          "INSERT INTO customers (id,display_name,customer_type,primary_phone,primary_email,service_address) VALUES (?,?, 'Individual',?,?,?)",
          [customerId,enquiry.customer_name,enquiry.phone,enquiry.email,enquiry.area],
        );
      }
      await connection.execute("UPDATE enquiries SET customer_id=?,status='Contacted' WHERE id=?",[customerId,id]);
    }
    const [customerRows] = await connection.execute("SELECT * FROM customers WHERE id=?",[customerId]);
    const customer = (customerRows as Array<Record<string,unknown>>)[0];
    await audit(user,request,"convert_to_customer","enquiry",id,{customer_id:customerId});
    const [updatedEnquiry] = await connection.execute("SELECT * FROM enquiries WHERE id=?",[id]);
    return {item:customer,enquiry:(updatedEnquiry as Array<Record<string,unknown>>)[0]};
  });
}

async function shareQuotation(id: string, input: Body, user: StaffUser, request: Request) {
  const enquiryId = text(input.enquiry_id,80);
  const quotation = await row("SELECT * FROM documents WHERE id=? AND kind='Quotation'",[id]);
  if (!quotation || !quotation.customer_id) throw new Error("Quotation or CRM customer not found.");
  if (!["Draft","Sent"].includes(String(quotation.status))) throw new Error("Only a draft or previously sent quotation can be shared.");
  const enquiry = await row("SELECT id,customer_id FROM enquiries WHERE id=?",[enquiryId]);
  if (!enquiry || String(enquiry.customer_id) !== String(quotation.customer_id)) throw new Error("Choose an originating enquiry belonging to the quotation's customer.");
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now()+30*86400000).toISOString().slice(0,19).replace("T"," ");
  await execute("INSERT INTO quote_public_links (token_hash,document_id,enquiry_id,customer_id,expires_at) VALUES (?,?,?,?,?)",
    [createHash("sha256").update(token).digest("hex"),id,enquiryId,quotation.customer_id,expires]);
  await execute("UPDATE documents SET status='Sent' WHERE id=?",[id]);
  await execute("UPDATE enquiries SET status='Quoted' WHERE id=?",[enquiryId]);
  await audit(user,request,"share","quotation",id,{enquiry_id:enquiryId,expires_at:expires});
  const base = (process.env.APP_BASE_URL || new URL(request.url).origin).replace(/\/$/,"");
  return {url:base+"/quote/"+token,expires_at:new Date(expires+"Z").toISOString(),reference:quotation.reference};
}

async function convertAcceptedQuote(id: string, user: StaffUser, request: Request) {
  return transaction(async connection => {
    const [documents] = await connection.execute("SELECT * FROM documents WHERE id=? AND kind='Quotation' FOR UPDATE",[id]);
    const doc = (documents as Array<Record<string,unknown>>)[0];
    if (!doc || doc.status !== "Accepted") throw new Error("Only an accepted quotation can be converted into a job.");
    const [existing] = await connection.execute("SELECT * FROM jobs WHERE source_document_id=? LIMIT 1",[id]);
    const found = (existing as Array<Record<string,unknown>>)[0];
    if (found) return found;
    const jobId = randomUUID();
    const ref = "JOB-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + jobId.slice(0,6).toUpperCase();
    const [enquiries] = await connection.execute("SELECT service,area,details FROM enquiries WHERE customer_id=? ORDER BY created_at DESC LIMIT 1",[doc.customer_id]);
    const enquiry = (enquiries as Array<Record<string,unknown>>)[0];
    await connection.execute(
      "INSERT INTO jobs (id,reference,customer_id,source_document_id,customer_name,service,area,details,status) VALUES (?,?,?,?,?,?,?,?, 'New')",
      [jobId,ref,doc.customer_id,id,doc.customer_name,enquiry?.service || "Property maintenance",enquiry?.area || "",enquiry?.details || doc.notes || ""],
    );
    await audit(user,request,"convert_quote_to_job","quotation",id,{job_id:jobId});
    const [jobRows] = await connection.execute("SELECT * FROM jobs WHERE id=?",[jobId]);
    return (jobRows as Array<Record<string,unknown>>)[0];
  });
}

async function handleAdmin(request: Request, path: string[], user: StaffUser): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const [resource, id, action] = path;
  const input = method === "POST" || method === "PATCH" || method === "PUT" ? await bodyOf(request) : {};

  if (resource === "media") {
    if (!id && method === "GET") return send({items:await listMedia()});
    if (!id && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return send({error:"Attach a file using the file field."},400);
      const item = await saveMedia(file,user,text(form.get("category"),80) || "Uncategorised");
      await audit(user,request,"upload","media",String(item.id),{name:item.original_name,size:item.size_bytes});
      return send({item},201);
    }
    if (id && action === "file" && method === "GET") {
      const result = await readMediaBytes(id,false);
      if (!result) return send({error:"Media not found."},404);
      return new NextResponse(new Uint8Array(result.bytes),{status:200,headers:{"Content-Type":result.type,"Content-Length":String(result.bytes.length),"Content-Disposition":`inline; filename="${result.filename.replace(/["\\\\]/g,"_")}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
    }
    if (id && action === "replace" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return send({error:"Attach a replacement file."},400);
      const item = await replaceMedia(id,file,user);
      if (!item) return send({error:"Media not found."},404);
      await audit(user,request,"replace","media",id,{name:item.original_name});
      return send({item});
    }
    if (id && !action && method === "PATCH") {
      const item = await updateMedia(id,input);
      if (!item) return send({error:"Media not found."},404);
      await audit(user,request,"update_metadata","media",id,input);
      return send({item});
    }
    if (id && !action && method === "DELETE") {
      const deleted = await removeMedia(id);
      if (!deleted) return send({error:"Media not found."},404);
      await audit(user,request,"delete","media",id);
      return send({deleted:true});
    }
  }

  if (resource === "commercial-documents") {
    if (!id && method === "GET") return send({items:await commercialList(new URL(request.url))});
    if (!id && method === "POST") return send({item:await createCommercialDocument(input,user,request)},201);
    if (id && !action && method === "GET") {
      const detail = await commercialDetails(id);
      return detail ? send(detail) : send({error:"Document not found."},404);
    }
    if (id && action === "status" && method === "PATCH") {
      const saved = await updateDocumentStatus(id,text(input.status,30),user,request);
      return saved ? send({item:saved}) : send({error:"Document not found."},404);
    }
    if (id && action === "payments" && (method === "GET" || method === "POST")) {
      const data = await invoicePayments(id,request,user);
      if (!data) return send({error:"Invoice not found."},404);
      return send(data,method==="POST"?201:200);
    }
    if (id && action === "share" && method === "POST") return send(await shareQuotation(id,input,user,request),201);
    if (id && action === "convert-to-job" && method === "POST") return send({item:await convertAcceptedQuote(id,user,request)},201);
  }

  if (resource === "enquiries" && id && action === "convert-to-customer" && method === "POST") {
    const result = await convertEnquiry(id,user,request);
    return result ? send(result) : send({error:"Enquiry not found."},404);
  }

  if (resource === "publishing") {
    if (!id && method === "GET") {
      const [requests,current,history,auditRows] = await Promise.all([
        rows("SELECT id,module_key,slug,status,requested_by,reviewed_by,review_note,created_at,reviewed_at FROM publication_requests ORDER BY created_at DESC LIMIT 100"),
        rows("SELECT p.module_key,p.slug,p.id AS publication_id,p.published_at AS updated_at,p.content_hash,p.published_by,p.published_at FROM publication_versions p JOIN (SELECT module_key,MAX(published_at) AS latest FROM publication_versions GROUP BY module_key) x ON x.module_key=p.module_key AND x.latest=p.published_at"),
        rows("SELECT id,module_key,slug,content_hash,published_by,published_at FROM publication_versions ORDER BY published_at DESC LIMIT 100"),
        rows("SELECT id,module_key,request_id,publication_id,action,actor,details_json,created_at FROM publication_audit ORDER BY created_at DESC LIMIT 150"),
      ]);
      return send({requests,current,history,audit:auditRows});
    }
    if (id === "request" && method === "POST") {
      const moduleKey = text(input.moduleKey,80);
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(moduleKey)) return send({error:"Invalid CMS module key."},400);
      const draft = await row("SELECT content_json FROM site_content WHERE content_key=?",["cms_draft."+moduleKey]);
      if (!draft) return send({error:"Save a website content draft before requesting publication."},409);
      const requestId = randomUUID();
      const pageSlug = slug(moduleKey);
      await execute("INSERT INTO publication_requests (id,module_key,slug,status,requested_by) VALUES (?,?,?,'Pending',?)",[requestId,moduleKey,pageSlug,user.id]);
      await execute("INSERT INTO publication_audit (id,module_key,request_id,action,actor,details_json) VALUES (?,?,?,'requested',?,?)",[randomUUID(),moduleKey,requestId,user.id,JSON.stringify({})]);
      return send({requested:true,requestId,moduleKey,slug:pageSlug,approvalRequired:true},201);
    }
    if (id === "approve" && method === "POST") {
      await userCanApprove(user);
      const requestId = text(input.requestId,36);
      const decision = text(input.decision,10);
      const note = text(input.note,1000);
      if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approve","reject"].includes(decision)) return send({error:"Invalid publication review."},400);
      const result = await transaction(async connection => {
        const [requestRows] = await connection.execute("SELECT * FROM publication_requests WHERE id=? FOR UPDATE",[requestId]);
        const req = (requestRows as Array<Record<string,unknown>>)[0];
        if (!req || req.status !== "Pending") throw new Error("Publication request is no longer pending.");
        const [draftRows] = await connection.execute("SELECT content_json FROM site_content WHERE content_key=?",["cms_draft."+req.module_key]);
        const draft = (draftRows as Array<{content_json:string}>)[0];
        if (!draft) throw new Error("Website content draft is missing.");
        if (decision === "approve") {
          const hash = createHash("sha256").update(draft.content_json).digest("hex");
          const publicationId = randomUUID();
          await connection.execute("INSERT INTO publication_versions (id,module_key,slug,content_json,content_hash,published_by) VALUES (?,?,?,?,?,?)",[publicationId,req.module_key,req.slug,draft.content_json,hash,user.id]);
          await connection.execute("UPDATE publication_requests SET status='Approved',reviewed_by=?,review_note=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?",[user.id,note,requestId]);
          await connection.execute("INSERT INTO publication_audit (id,module_key,request_id,publication_id,action,actor,details_json) VALUES (?,?,? ,?,'published',?,?)",[randomUUID(),req.module_key,requestId,publicationId,user.id,JSON.stringify({hash,note})]);
          return {published:true,requestId,publicationId};
        }
        await connection.execute("UPDATE publication_requests SET status='Rejected',reviewed_by=?,review_note=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?",[user.id,note,requestId]);
        await connection.execute("INSERT INTO publication_audit (id,module_key,request_id,action,actor,details_json) VALUES (?,?,?,'rejected',?,?)",[randomUUID(),req.module_key,requestId,user.id,JSON.stringify({note})]);
        return {rejected:true,requestId};
      });
      return send(result);
    }
    if (id === "rollback" && method === "POST") {
      await userCanApprove(user);
      const moduleKey = text(input.moduleKey,80);
      const publicationId = text(input.publicationId,36);
      const note = text(input.note,1000);
      const prior = await row("SELECT * FROM publication_versions WHERE id=? AND module_key=?",[publicationId,moduleKey]);
      if (!prior) return send({error:"Publication version was not found."},404);
      const rollbackId = randomUUID();
      const hash = createHash("sha256").update(String(prior.content_json)).digest("hex");
      await execute("INSERT INTO publication_versions (id,module_key,slug,content_json,content_hash,published_by) VALUES (?,?,?,?,?,?)",[rollbackId,moduleKey,prior.slug,prior.content_json,hash,user.id]);
      await execute("INSERT INTO publication_audit (id,module_key,publication_id,action,actor,details_json) VALUES (?,?,?,'rollback',?,?)",[randomUUID(),moduleKey,rollbackId,user.id,JSON.stringify({restoredFrom:publicationId,note})]);
      return send({rolledBack:true,moduleKey,publicationId:rollbackId,restoredFrom:publicationId,slug:prior.slug});
    }
  }

  if (resource === "content") {
    if (method === "GET") {
      const items = await rows("SELECT content_key,content_json,updated_by,updated_at FROM site_content ORDER BY content_key");
      return send({items});
    }
    if (method === "PUT") {
      const key = text(input.key,100);
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(key) || input.value === undefined) return send({error:"Provide a valid content key and value."},400);
      const serialized = JSON.stringify(input.value);
      if (serialized.length > 100000) return send({error:"Content draft is too large."},413);
      await execute("INSERT INTO site_content (content_key,content_json,updated_by) VALUES (?,?,?) ON DUPLICATE KEY UPDATE content_json=VALUES(content_json),updated_by=VALUES(updated_by),updated_at=UTC_TIMESTAMP()",[key,serialized,user.id]);
      await audit(user,request,"save_draft","site_content",key);
      return send({saved:true});
    }
  }

  if (resource === "reports" && method === "GET") {
    const [enquiries,jobs,quotes,invoices,paid] = await Promise.all([
      row("SELECT COUNT(*) AS total FROM enquiries"),
      row("SELECT COUNT(*) AS total FROM jobs WHERE status NOT IN ('Completed','Cancelled')"),
      row("SELECT COUNT(*) AS total FROM documents WHERE kind='Quotation' AND status IN ('Draft','Sent')"),
      row("SELECT COUNT(*) AS total FROM documents WHERE kind='Invoice' AND status IN ('Sent','Overdue')"),
      row("SELECT COALESCE(SUM(amount_cents),0) AS total FROM invoice_payments WHERE paid_at >= DATE_FORMAT(UTC_DATE(),'%Y-%m-01')"),
    ]);
    const items = [
      {metric:"Total enquiries",value:Number(enquiries?.total||0),detail:"All recorded customer requests",data_status:"Live database"},
      {metric:"Active jobs",value:Number(jobs?.total||0),detail:"Jobs not completed or cancelled",data_status:"Live database"},
      {metric:"Open quotations",value:Number(quotes?.total||0),detail:"Draft and sent quotations",data_status:"Live database"},
      {metric:"Outstanding invoices",value:Number(invoices?.total||0),detail:"Sent and overdue invoices",data_status:"Live database"},
      {metric:"Payments this month",value:Number(paid?.total||0),detail:"Recorded payment value in cents",data_status:"Live database"},
    ];
    return send({items});
  }

  if (resource === "settings" && method === "GET") {
    return send({items:[
      {setting:"Application hosting",current_value:"HostAfrica DirectAdmin",owner:"NGMS",last_changed:null},
      {setting:"Database",current_value:"HostAfrica MySQL / MariaDB",owner:"NGMS",last_changed:null},
      {setting:"Media storage",current_value:"Private HostAfrica filesystem",owner:"NGMS",last_changed:null},
      {setting:"Authentication",current_value:"NGMS first-party staff sessions",owner:"NGMS",last_changed:null},
    ]});
  }

  if (!id && method === "GET" && ["enquiries","jobs","documents","customers","schedules"].includes(resource)) {
    const table = resource === "customers" ? "customers" : resource;
    const order = resource === "schedules" ? "scheduled_start ASC" : "created_at DESC";
    const items = await rows(`SELECT * FROM ${table} ORDER BY ${order} LIMIT 500`);
    return send({items});
  }
  if (!id && method === "POST" && ["enquiries","jobs","customers","schedules"].includes(resource)) {
    const item = await createBasicRecord(resource,input,user,request);
    return send({item},201);
  }
  if (id && !action && method === "PATCH" && ["enquiries","jobs","schedules"].includes(resource)) {
    const allowed: Record<string,string[]> = {
      enquiries:["New","Contacted","Quoted","Converted","Closed"],
      jobs:["New","Quoted","In progress","Completed","Cancelled"],
      schedules:["Scheduled","Confirmed","In progress","Completed","Cancelled"],
    };
    const status = text(input.status,30);
    if (!allowed[resource].includes(status)) return send({error:"Unsupported status."},400);
    const result = await execute(`UPDATE ${resource} SET status=? WHERE id=?`,[status,id]);
    if (!result.affectedRows) return send({error:"Record not found."},404);
    await audit(user,request,"status_change",resource,id,{status});
    return send({item:await row(`SELECT * FROM ${resource} WHERE id=?`,[id])});
  }
  if (id && !action && method === "DELETE" && ["enquiries","jobs","schedules"].includes(resource)) {
    const result = await execute(`DELETE FROM ${resource} WHERE id=?`,[id]);
    if (!result.affectedRows) return send({error:"Record not found."},404);
    await audit(user,request,"delete",resource,id);
    return send({deleted:true});
  }

  return send({error:"The requested administration endpoint is not available."},404);
}

async function dispatch(request: Request, context: Context) {
  try {
    const user = await requireAdmin();
    if (["POST","PATCH","PUT","DELETE"].includes(request.method.toUpperCase())) assertSameOrigin(request);
    const {path} = await context.params;
    return await handleAdmin(request,path,user);
  } catch (error) {
    if (error instanceof AuthError) return send({error:error.message},error.status);
    console.error("NGMS admin API error:",error);
    const message = error instanceof Error && error.message && !/sql|mysql|database|constraint|duplicate entry/i.test(error.message)
      ? error.message
      : "The request could not be completed. Check the data and try again.";
    return send({error:message},400);
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
