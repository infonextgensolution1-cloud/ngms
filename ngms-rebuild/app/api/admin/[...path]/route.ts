import { NextResponse } from "next/server";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { assertSameOrigin, AuthError, requireAdmin, type StaffUser, requestIpHash } from "@/lib/server/auth";
import { execute, executeOn, getDb, row, rows, transaction } from "@/lib/server/db";
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
function safeHeaderFilename(value: unknown): string {
  return String(value ?? "download").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "download";
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
      const [sourceRows] = await executeOn(connection,"SELECT * FROM documents WHERE id=? AND kind='Quotation' FOR UPDATE", [sourceId]);
      const source = (sourceRows as Array<Record<string,unknown>>)[0];
      if (!source || source.status !== "Accepted") throw new Error("Invoices can only be created from accepted quotations.");
      const [existingRows] = await executeOn(connection,"SELECT id FROM documents WHERE source_document_id=? AND kind='Invoice' LIMIT 1", [sourceId]);
      if ((existingRows as unknown[]).length) throw new Error("An invoice has already been created from this quotation.");
      const ref = "INV-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + id.slice(0,6).toUpperCase();
      await executeOn(connection,
        "INSERT INTO documents (id,reference,customer_id,customer_name,kind,amount_cents,subtotal_cents,discount_cents,vat_enabled,vat_rate_basis_points,vat_cents,status,issue_date,due_date,notes,source_document_id) VALUES (?,?,?,?, 'Invoice',?,?,?,?,? ,?,'Draft',UTC_DATE(),?,?,?)",
        [id,ref,source.customer_id,source.customer_name,source.amount_cents,source.subtotal_cents,source.discount_cents,source.vat_enabled,source.vat_rate_basis_points,source.vat_cents,text(input.due_date,20) || null,text(input.notes,4000) || source.notes || "",sourceId],
      );
      await executeOn(connection,
        "INSERT INTO document_lines (id,document_id,description,quantity,unit,unit_price_cents,line_total_cents,sort_order) SELECT UUID(),?,description,quantity,unit,unit_price_cents,line_total_cents,sort_order FROM document_lines WHERE document_id=?",
        [id,sourceId],
      );
    } else {
      const customerId = text(input.customer_id,80);
      const [customerRows] = await executeOn(connection,"SELECT id,display_name FROM customers WHERE id=? LIMIT 1", [customerId]);
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
      await executeOn(connection,
        "INSERT INTO documents (id,reference,customer_id,customer_name,kind,amount_cents,subtotal_cents,discount_cents,vat_enabled,vat_rate_basis_points,vat_cents,status,issue_date,notes) VALUES (?,?,?,?, 'Quotation',?,?,?,?,?,?,'Draft',UTC_DATE(),?)",
        [id,ref,customer.id,customer.display_name,total,subtotal,discount,vatEnabled?1:0,vatRate,vat,text(input.notes,4000)],
      );
      for (const line of normalized) {
        await executeOn(connection,
          "INSERT INTO document_lines (id,document_id,description,quantity,unit,unit_price_cents,line_total_cents,sort_order) VALUES (?,?,?,?,?,?,?,?)",
          [randomUUID(),id,line.description,line.quantity,line.unit,line.unitPrice,line.lineTotal,line.index],
        );
      }
    }
    await executeOn(connection,
      "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json) VALUES (?,?,?,?,?,?)",
      [randomUUID(),user.id,"create",kind.toLowerCase(),id,JSON.stringify({kind})],
    );
    const [savedRows] = await executeOn(connection,"SELECT * FROM documents WHERE id=?", [id]);
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
  const allowed = ["Draft","Sent","Expired","Overdue","Cancelled","Paid"];
  if (!allowed.includes(status)) throw new Error("Accepted and declined quotation decisions must be recorded through the customer's one-use link.");
  const existing = await row("SELECT id,kind,amount_cents FROM documents WHERE id=?", [id]);
  if (!existing) return null;
  if (status === "Paid" && existing.kind !== "Invoice") throw new Error("Only invoices can be marked paid.");
  if(status==="Paid"){
    const paymentTotal=await row("SELECT COALESCE(SUM(amount_cents),0) AS paid FROM invoice_payments WHERE document_id=?",[id]);
    if(Number(paymentTotal?.paid??0)<Number(existing.amount_cents??0))throw new Error("An invoice can only be marked paid after its full balance has been covered by recorded payments.");
  }
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
    const [docs] = await executeOn(connection,"SELECT amount_cents FROM documents WHERE id=? AND kind='Invoice' FOR UPDATE",[id]);
    const current = (docs as Array<{amount_cents:number}>)[0];
    if (!current) throw new Error("Invoice not found.");
    const [totals] = await executeOn(connection,"SELECT COALESCE(SUM(amount_cents),0) AS paid FROM invoice_payments WHERE document_id=?",[id]);
    const alreadyPaid = Number((totals as Array<{paid:number}>)[0]?.paid ?? 0);
    const balance = Number(current.amount_cents)-alreadyPaid;
    if (amount > balance) throw new Error("Payment exceeds the outstanding invoice balance.");
    await executeOn(connection,
      "INSERT INTO invoice_payments (id,document_id,amount_cents,method,paid_at,reference,notes,recorded_by) VALUES (?,?,?,?,?,?,?,?)",
      [randomUUID(),id,amount,method,paidAt,text(input.reference,160),text(input.notes,2000),user.id],
    );
    const newPaid = alreadyPaid + amount;
    const newBalance = Number(current.amount_cents)-newPaid;
    if (newBalance === 0) await executeOn(connection,"UPDATE documents SET status='Paid' WHERE id=?",[id]);
    await executeOn(connection,
      "INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,details_json) VALUES (UUID(),?,'payment_recorded','invoice',?,?)",
      [user.id,id,JSON.stringify({amount_cents:amount,method})],
    );
    return {saved:true,paid_cents:newPaid,balance_cents:newBalance,status:newBalance===0?"Paid":String(document.status)};
  });
}

async function convertEnquiry(id: string, user: StaffUser, request: Request) {
  return transaction(async connection => {
    const [enquiries] = await executeOn(connection,"SELECT * FROM enquiries WHERE id=? FOR UPDATE",[id]);
    const enquiry = (enquiries as Array<Record<string,unknown>>)[0];
    if (!enquiry) return null;
    let customerId = enquiry.customer_id ? String(enquiry.customer_id) : "";
    if (!customerId) {
      const [customers] = await executeOn(connection,
        "SELECT id FROM customers WHERE (primary_phone<>'' AND primary_phone=?) OR (primary_email<>'' AND primary_email=?) ORDER BY created_at LIMIT 1",
        [enquiry.phone,enquiry.email],
      );
      customerId = String((customers as Array<{id:string}>)[0]?.id || "");
      if (!customerId) {
        customerId = randomUUID();
        await executeOn(connection,
          "INSERT INTO customers (id,display_name,customer_type,primary_phone,primary_email,service_address) VALUES (?,?, 'Individual',?,?,?)",
          [customerId,enquiry.customer_name,enquiry.phone,enquiry.email,enquiry.area],
        );
      }
      await executeOn(connection,"UPDATE enquiries SET customer_id=?,status='Contacted' WHERE id=?",[customerId,id]);
    }
    const [customerRows] = await executeOn(connection,"SELECT * FROM customers WHERE id=?",[customerId]);
    const customer = (customerRows as Array<Record<string,unknown>>)[0];
    await audit(user,request,"convert_to_customer","enquiry",id,{customer_id:customerId});
    const [updatedEnquiry] = await executeOn(connection,"SELECT * FROM enquiries WHERE id=?",[id]);
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
    const [documents] = await executeOn(connection,"SELECT * FROM documents WHERE id=? AND kind='Quotation' FOR UPDATE",[id]);
    const doc = (documents as Array<Record<string,unknown>>)[0];
    if (!doc || doc.status !== "Accepted") throw new Error("Only an accepted quotation can be converted into a job.");
    const [existing] = await executeOn(connection,"SELECT * FROM jobs WHERE source_document_id=? LIMIT 1",[id]);
    const found = (existing as Array<Record<string,unknown>>)[0];
    if (found) return found;
    const jobId = randomUUID();
    const ref = "JOB-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + jobId.slice(0,6).toUpperCase();
    const [enquiries] = await executeOn(connection,"SELECT service,area,details FROM enquiries WHERE customer_id=? ORDER BY created_at DESC LIMIT 1",[doc.customer_id]);
    const enquiry = (enquiries as Array<Record<string,unknown>>)[0];
    await executeOn(connection,
      "INSERT INTO jobs (id,reference,customer_id,source_document_id,customer_name,service,area,details,status) VALUES (?,?,?,?,?,?,?,?, 'New')",
      [jobId,ref,doc.customer_id,id,doc.customer_name,enquiry?.service || "Property maintenance",enquiry?.area || "",enquiry?.details || doc.notes || ""],
    );
    await audit(user,request,"convert_quote_to_job","quotation",id,{job_id:jobId});
    const [jobRows] = await executeOn(connection,"SELECT * FROM jobs WHERE id=?",[jobId]);
    return (jobRows as Array<Record<string,unknown>>)[0];
  });
}

const OPERATION_STATUS: Record<string,string[]> = {
  suppliers:["Active","Pending approval","On hold","Inactive"],
  materials:["In stock","Low stock","Out of stock","Discontinued"],
  purchases:["Recorded","Pending payment","Paid","Cancelled"],
  expenses:["Pending","Approved","Paid","Rejected"],
  staff:["Active","On leave","Inactive"],
  subcontractors:["Pending approval","Approved","On hold","Inactive"],
  wages:["Draft","Approved","Paid","Cancelled"],
  maintenance:["Draft","Active","Due","Paused","Completed","Cancelled"],
};

async function listOperationRecords(category:string): Promise<Record<string,unknown>[]> {
  const queries:Record<string,string> = {
    suppliers:"SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 500",
    materials:"SELECT m.*,s.name AS supplier_name FROM materials m LEFT JOIN suppliers s ON s.id=m.supplier_id ORDER BY m.name LIMIT 500",
    purchases:"SELECT p.*,s.name AS supplier_name,m.name AS material_name FROM purchase_records p LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN materials m ON m.id=p.material_id ORDER BY p.purchased_at DESC,p.created_at DESC LIMIT 500",
    expenses:"SELECT e.*,j.reference AS job_reference,s.name AS supplier_name FROM expenses e LEFT JOIN jobs j ON j.id=e.job_id LEFT JOIN suppliers s ON s.id=e.supplier_id ORDER BY e.expense_date DESC,e.created_at DESC LIMIT 500",
    staff:"SELECT * FROM staff_profiles ORDER BY full_name LIMIT 500",
    subcontractors:"SELECT * FROM subcontractors ORDER BY company_name LIMIT 500",
    wages:"SELECT w.*,sp.full_name AS staff_name FROM wage_records w JOIN staff_profiles sp ON sp.id=w.staff_profile_id ORDER BY w.period_start DESC,w.created_at DESC LIMIT 500",
    maintenance:"SELECT * FROM maintenance_plans ORDER BY COALESCE(next_due_date,'9999-12-31'),created_at DESC LIMIT 500",
  };
  const sql=queries[category];
  if(!sql) throw new Error("Unknown Operations Manager module.");
  return rows(sql);
}

async function createOperation(category:string,input:Body,user:StaffUser,request:Request):Promise<Record<string,unknown>> {
  const id=randomUUID();
  const createdBy=user.id;
  if(category==="suppliers"){
    const name=text(input.name,180);
    if(name.length<2)throw new Error("Supplier name is required.");
    const status=text(input.status,30)||"Active";
    if(!OPERATION_STATUS.suppliers.includes(status))throw new Error("Invalid supplier status.");
    await execute("INSERT INTO suppliers (id,name,contact_name,phone,email,category,address,notes,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id,name,text(input.contact_name,160),text(input.phone,40),text(input.email,254).toLowerCase(),text(input.category,100),text(input.address,500),text(input.notes,4000),status,createdBy]);
  } else if(category==="materials"){
    const name=text(input.name,180);
    const quantity=Number(input.quantity??0),minimum=Number(input.minimum_quantity??0);
    if(name.length<2||!Number.isFinite(quantity)||quantity<0||!Number.isFinite(minimum)||minimum<0)throw new Error("Enter a material name and valid stock quantities.");
    const status=text(input.status,30)||(quantity<=minimum?"Low stock":"In stock");
    if(!OPERATION_STATUS.materials.includes(status))throw new Error("Invalid materials status.");
    await execute("INSERT INTO materials (id,name,sku,category,unit,quantity,minimum_quantity,unit_cost_cents,supplier_id,notes,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [id,name,text(input.sku,100),text(input.category,100),text(input.unit,40)||"unit",quantity,minimum,cents(input.unit_cost ?? 0),text(input.supplier_id,36)||null,text(input.notes,4000),status,createdBy]);
  } else if(category==="purchases"){
    const description=text(input.description,500),quantity=Number(input.quantity??1),unitCost=cents(input.unit_cost);
    if(description.length<2||!Number.isFinite(quantity)||quantity<=0)throw new Error("Enter a purchase description, quantity and unit cost.");
    const total=Math.round(quantity*unitCost);
    const purchaseStatus=text(input.status,30)||"Recorded";
    if(!OPERATION_STATUS.purchases.includes(purchaseStatus))throw new Error("Invalid purchase status.");
    await execute("INSERT INTO purchase_records (id,supplier_id,material_id,invoice_reference,description,quantity,unit_cost_cents,total_cents,purchased_at,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [id,text(input.supplier_id,36)||null,text(input.material_id,36)||null,text(input.invoice_reference,120),description,quantity,unitCost,total,text(input.purchased_at,20)||new Date().toISOString().slice(0,10),purchaseStatus,text(input.notes,4000),createdBy]);
  } else if(category==="expenses"){
    const description=text(input.description,500);
    if(description.length<2)throw new Error("Expense description is required.");
    const status=text(input.status,30)||"Pending";
    if(!OPERATION_STATUS.expenses.includes(status))throw new Error("Invalid expense status.");
    await execute("INSERT INTO expenses (id,expense_date,category,description,amount_cents,job_id,supplier_id,invoice_reference,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [id,text(input.expense_date,20)||new Date().toISOString().slice(0,10),text(input.category,100)||"General",description,cents(input.amount),text(input.job_id,36)||null,text(input.supplier_id,36)||null,text(input.invoice_reference,120),status,text(input.notes,4000),createdBy]);
  } else if(category==="staff"){
    const name=text(input.full_name,180);
    if(name.length<2)throw new Error("Staff member name is required.");
    const status=text(input.status,30)||"Active";
    if(!OPERATION_STATUS.staff.includes(status))throw new Error("Invalid staff status.");
    await execute("INSERT INTO staff_profiles (id,full_name,phone,email,position,employment_type,hourly_rate_cents,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id,name,text(input.phone,40),text(input.email,254).toLowerCase(),text(input.position,120),text(input.employment_type,40)||"Employee",cents(input.hourly_rate ?? 0),status,text(input.notes,4000),createdBy]);
  } else if(category==="subcontractors"){
    const name=text(input.company_name,180);
    if(name.length<2)throw new Error("Subcontractor company name is required.");
    const status=text(input.status,30)||"Pending approval";
    if(!OPERATION_STATUS.subcontractors.includes(status))throw new Error("Invalid subcontractor status.");
    await execute("INSERT INTO subcontractors (id,company_name,contact_name,phone,email,service,compliance_notes,status,created_by) VALUES (?,?,?,?,?,?,?,?,?)",
      [id,name,text(input.contact_name,160),text(input.phone,40),text(input.email,254).toLowerCase(),text(input.service,180),text(input.compliance_notes,4000),status,createdBy]);
  } else if(category==="wages"){
    const staffId=text(input.staff_profile_id,36),hours=Number(input.hours_worked),rate=cents(input.rate ?? 0);
    if(!/^[0-9a-f-]{36}$/i.test(staffId)||!Number.isFinite(hours)||hours<=0||hours>744)throw new Error("Choose a staff profile and enter valid hours worked.");
    const profile=await row("SELECT id,hourly_rate_cents FROM staff_profiles WHERE id=?",[staffId]);
    if(!profile)throw new Error("Staff profile was not found.");
    const selectedRate=Number.isFinite(Number(input.rate))&&Number(input.rate)>0?rate:Number(profile.hourly_rate_cents);
    const gross=Math.round(hours*selectedRate),deductions=cents(input.deductions ?? 0);
    if(deductions>gross)throw new Error("Deductions cannot exceed gross wages.");
    const start=text(input.period_start,20),end=text(input.period_end,20);
    if(!start||!end||end<start)throw new Error("Enter a valid wage period.");
    await execute("INSERT INTO wage_records (id,staff_profile_id,period_start,period_end,hours_worked,rate_cents,gross_cents,deductions_cents,net_cents,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [id,staffId,start,end,hours,selectedRate,gross,deductions,gross-deductions,text(input.status,30)||"Draft",text(input.notes,4000),createdBy]);
  } else if(category==="maintenance"){
    const customerName=text(input.customer_name,180),service=text(input.service,180),frequency=text(input.frequency,40);
    if(customerName.length<2||!service||!frequency)throw new Error("Enter a customer, service and maintenance frequency.");
    const status=text(input.status,30)||"Draft";
    if(!OPERATION_STATUS.maintenance.includes(status))throw new Error("Invalid maintenance plan status.");
    await execute("INSERT INTO maintenance_plans (id,customer_id,customer_name,service,property_area,frequency,start_date,next_due_date,amount_cents,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [id,text(input.customer_id,36)||null,customerName,service,text(input.property_area,180),frequency,text(input.start_date,20)||null,text(input.next_due_date,20)||null,cents(input.amount ?? 0),status,text(input.notes,4000),createdBy]);
  } else {
    throw new Error("Unknown Operations Manager module.");
  }
  await audit(user,request,"create",category,id);
  return {id,category};
}

async function updateOperationStatus(category:string,id:string,status:string,user:StaffUser,request:Request){
  const tables:Record<string,string>={suppliers:"suppliers",materials:"materials",purchases:"purchase_records",expenses:"expenses",staff:"staff_profiles",subcontractors:"subcontractors",wages:"wage_records",maintenance:"maintenance_plans"};
  const table=tables[category];
  if(!table||!OPERATION_STATUS[category]?.includes(status))throw new Error("Unsupported status for this Operations Manager record.");
  const result=await execute(`UPDATE ${table} SET status=? WHERE id=?`,[status,id]);
  if(!result.affectedRows)return null;
  await audit(user,request,"status_change",category,id,{status});
  return await row(`SELECT * FROM ${table} WHERE id=?`,[id]);
}

async function handleAdmin(request: Request, path: string[], user: StaffUser): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const [resource, id, action, extraId] = path;
  const input = method === "POST" || method === "PATCH" || method === "PUT" ? await bodyOf(request) : {};

  if(resource==="slides"){
    if(!id&&method==="GET"){
      const items=await rows(
        "SELECT s.*,m.original_name,m.content_type FROM homepage_slides s JOIN media_assets m ON m.id=s.media_id ORDER BY s.sort_order,s.created_at",
      );
      return send({items:items.map(item=>({...item,url:"/api/admin/media/"+encodeURIComponent(String(item.media_id))+"/file"}))});
    }
    if(!id&&method==="POST"){
      const mediaId=text(input.media_id,36),title=text(input.title,220);
      if(!/^[0-9a-f-]{36}$/i.test(mediaId)||title.length<2)return send({error:"Choose an image and enter a slide title."},400);
      const media=await row("SELECT id,content_type FROM media_assets WHERE id=?",[mediaId]);
      if(!media||!String(media.content_type).startsWith("image/"))return send({error:"Choose an existing image from the Media Manager."},404);
      const active=input.is_active===true;
      if(active){
        const count=await row("SELECT COUNT(*) AS total FROM homepage_slides WHERE is_active=1");
        if(Number(count?.total??0)>=12)return send({error:"The homepage carousel can have a maximum of 12 active slides. Deactivate a slide before adding another active one."},409);
      }
      const slideId=randomUUID();
      const sort=Number.isInteger(Number(input.sort_order))?Math.max(0,Math.min(999,Number(input.sort_order))):0;
      await execute(
        "INSERT INTO homepage_slides (id,media_id,eyebrow,title,description,button_label,button_url,sort_order,is_active,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [slideId,mediaId,text(input.eyebrow,120),title,text(input.description,600),text(input.button_label,80)||"Get a quote",safeSlideUrl(text(input.button_url,500)||"/quote"),sort,active?1:0,user.id],
      );
      if(active)await execute("UPDATE media_assets SET is_published=1 WHERE id=?",[mediaId]);
      await audit(user,request,"create","homepage_slide",slideId,{media_id:mediaId,is_active:active});
      return send({item:await row("SELECT * FROM homepage_slides WHERE id=?",[slideId])},201);
    }
    if(id&&method==="PATCH"){
      const existing=await row("SELECT * FROM homepage_slides WHERE id=?",[id]);
      if(!existing)return send({error:"Homepage slide not found."},404);
      const nextActive=typeof input.is_active==="boolean"?input.is_active:Number(existing.is_active)===1;
      if(nextActive&&Number(existing.is_active)!==1){
        const count=await row("SELECT COUNT(*) AS total FROM homepage_slides WHERE is_active=1");
        if(Number(count?.total??0)>=12)return send({error:"The homepage carousel is limited to 12 active slides."},409);
      }
      const sort= input.sort_order===undefined?Number(existing.sort_order):Number(input.sort_order);
      if(!Number.isInteger(sort)||sort<0||sort>999)return send({error:"Slide order must be between 0 and 999."},400);
      await execute("UPDATE homepage_slides SET eyebrow=?,title=?,description=?,button_label=?,button_url=?,sort_order=?,is_active=? WHERE id=?",
        [input.eyebrow===undefined?existing.eyebrow:text(input.eyebrow,120),input.title===undefined?existing.title:text(input.title,220),input.description===undefined?existing.description:text(input.description,600),input.button_label===undefined?existing.button_label:text(input.button_label,80),input.button_url===undefined?existing.button_url:safeSlideUrl(text(input.button_url,500)),sort,nextActive?1:0,id]);
      if(nextActive)await execute("UPDATE media_assets SET is_published=1 WHERE id=?",[existing.media_id]);
      await audit(user,request,"update","homepage_slide",id,{is_active:nextActive,sort_order:sort});
      return send({item:await row("SELECT * FROM homepage_slides WHERE id=?",[id])});
    }
    if(id&&method==="DELETE"){
      const result=await execute("DELETE FROM homepage_slides WHERE id=?",[id]);
      if(!result.affectedRows)return send({error:"Homepage slide not found."},404);
      await audit(user,request,"delete","homepage_slide",id);
      return send({deleted:true});
    }
  }

function safeSlideUrl(value:string):string {
  if(value.startsWith("/")&&!value.startsWith("//"))return value.slice(0,500);
  try{
    const parsed=new URL(value);
    return ["https:","http:"].includes(parsed.protocol)?parsed.toString().slice(0,500):"/quote";
  }catch{return "/quote";}
}

  if (resource === "projects") {
    if (!id && method === "GET") {
      const items = await rows(
        "SELECT p.*, (SELECT COUNT(*) FROM project_photos pp WHERE pp.project_id=p.id) AS photo_count FROM projects p ORDER BY p.created_at DESC LIMIT 200",
      );
      return send({items});
    }
    if (!id && method === "POST") {
      const title = text(input.title,180);
      const service = text(input.service,180);
      const location = text(input.location,180);
      if (title.length < 2 || !service) return send({error:"Project title and service are required."},400);
      const projectId = randomUUID();
      await execute(
        "INSERT INTO projects (id,title,service,location,description,completed_at,status,created_by) VALUES (?,?,?,?,?,?, 'Draft',?)",
        [projectId,title,service,location,text(input.description,4000),text(input.completed_at,20)||null,user.id],
      );
      await audit(user,request,"create","project",projectId);
      return send({item:await row("SELECT * FROM projects WHERE id=?",[projectId])},201);
    }
    if (id && !action && method === "GET") {
      const project = await row("SELECT * FROM projects WHERE id=?",[id]);
      if (!project) return send({error:"Project not found."},404);
      const photos = await rows(
        "SELECT pp.id AS project_photo_id,pp.media_id,pp.stage,pp.sort_order,m.original_name,m.category,m.alt_text,m.is_published FROM project_photos pp JOIN media_assets m ON m.id=pp.media_id WHERE pp.project_id=? ORDER BY FIELD(pp.stage,'before','after','general'),pp.sort_order",
        [id],
      );
      return send({item:project,photos:photos.map(photo=>({...photo,url:"/api/admin/media/"+encodeURIComponent(String(photo.media_id))+"/file"}))});
    }
    if (id && action === "photos" && method === "POST") {
      const mediaId = text(input.media_id,36);
      const stage = text(input.stage,20);
      if (!/^[0-9a-f-]{36}$/i.test(mediaId) || !["before","after","general"].includes(stage)) return send({error:"Choose a valid media item and project photo stage."},400);
      const result = await transaction(async connection => {
        const [projectRows] = await executeOn(connection,"SELECT id,status FROM projects WHERE id=? FOR UPDATE",[id]);
        const project = (projectRows as Array<Record<string,unknown>>)[0];
        if (!project) throw new Error("Project not found.");
        const [mediaRows] = await executeOn(connection,"SELECT id,content_type FROM media_assets WHERE id=?",[mediaId]);
        const mediaItem = (mediaRows as Array<{id:string;content_type:string}>)[0];
        if (!mediaItem) throw new Error("Media item not found.");
        if (!String(mediaItem.content_type).startsWith("image/")) throw new Error("Only image files can be attached to a project.");
        const [orders] = await executeOn(connection,"SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM project_photos WHERE project_id=? AND stage=?",[id,stage]);
        const sortOrder=Number((orders as Array<{next_order:number}>)[0]?.next_order ?? 0);
        const photoId=randomUUID();
        await executeOn(connection,"INSERT INTO project_photos (id,project_id,media_id,stage,sort_order) VALUES (?,?,?,?,?)",[photoId,id,mediaId,stage,sortOrder]);
        if (project.status === "Published") await executeOn(connection,"UPDATE media_assets SET is_published=1 WHERE id=?",[mediaId]);
        return photoId;
      });
      await audit(user,request,"attach_photo","project",id,{media_id:mediaId,stage});
      return send({saved:true,project_photo_id:result},201);
    }
    if (id && action === "photos" && extraId && method === "DELETE") {
      const existing=await row("SELECT media_id FROM project_photos WHERE id=? AND project_id=?",[extraId,id]);
      if(!existing) return send({error:"Project photo not found."},404);
      await execute("DELETE FROM project_photos WHERE id=? AND project_id=?",[extraId,id]);
      await execute(
        "UPDATE media_assets SET is_published=IF(EXISTS(SELECT 1 FROM project_photos pp JOIN projects p ON p.id=pp.project_id WHERE pp.media_id=media_assets.id AND p.status='Published'),1,0) WHERE id=?",
        [existing.media_id],
      );
      await audit(user,request,"detach_photo","project",id,{project_photo_id:extraId});
      return send({deleted:true});
    }
    if (id && !action && method === "PATCH") {
      const current=await row("SELECT id FROM projects WHERE id=?",[id]);
      if(!current) return send({error:"Project not found."},404);
      const status=text(input.status,20);
      if(!["Draft","Published","Archived"].includes(status)) return send({error:"Choose Draft, Published or Archived."},400);
      if(input.title!==undefined) await execute("UPDATE projects SET title=?,service=?,location=?,description=?,completed_at=?,status=? WHERE id=?",
        [text(input.title,180),text(input.service,180),text(input.location,180),text(input.description,4000),text(input.completed_at,20)||null,status,id]);
      else await execute("UPDATE projects SET status=? WHERE id=?",[status,id]);
      if(status==="Published") {
        await execute("UPDATE media_assets m JOIN project_photos pp ON pp.media_id=m.id SET m.is_published=1 WHERE pp.project_id=?",[id]);
      } else {
        await execute(
          "UPDATE media_assets m JOIN project_photos pp ON pp.media_id=m.id SET m.is_published=IF(EXISTS(SELECT 1 FROM project_photos pp2 JOIN projects p2 ON p2.id=pp2.project_id WHERE pp2.media_id=m.id AND p2.status='Published'),1,0) WHERE pp.project_id=?",
          [id],
        );
      }
      await audit(user,request,"project_status","project",id,{status});
      return send({item:await row("SELECT * FROM projects WHERE id=?",[id])});
    }
    if(id && !action && method==="DELETE") {
      const result=await execute("DELETE FROM projects WHERE id=?",[id]);
      if(!result.affectedRows) return send({error:"Project not found."},404);
      await execute(
        "UPDATE media_assets m SET is_published=IF(EXISTS(SELECT 1 FROM project_photos pp JOIN projects p ON p.id=pp.project_id WHERE pp.media_id=m.id AND p.status='Published'),1,0) WHERE m.id IN (SELECT media_id FROM (SELECT media_id FROM project_photos) linked)",
      ).catch(()=>undefined);
      await audit(user,request,"delete","project",id);
      return send({deleted:true});
    }
  }

  if (resource === "media") {
    if (!id && method === "GET") {
      const items=await listMedia();
      return send({items:items.map(item=>({...item,url:"/api/admin/media/"+encodeURIComponent(String(item.id))+"/file"}))});
    }
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
      return new NextResponse(new Uint8Array(result.bytes),{status:200,headers:{"Content-Type":result.type,"Content-Length":String(result.bytes.length),"Content-Disposition":`inline; filename="${safeHeaderFilename(result.filename)}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
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
        const [requestRows] = await executeOn(connection,"SELECT * FROM publication_requests WHERE id=? FOR UPDATE",[requestId]);
        const req = (requestRows as Array<Record<string,unknown>>)[0];
        if (!req || req.status !== "Pending") throw new Error("Publication request is no longer pending.");
        if (String(req.requested_by) === user.id) throw new Error("A different owner or administrator must review this publication request.");
        const [draftRows] = await executeOn(connection,"SELECT content_json FROM site_content WHERE content_key=?",["cms_draft."+req.module_key]);
        const draft = (draftRows as Array<{content_json:string}>)[0];
        if (!draft) throw new Error("Website content draft is missing.");
        if (decision === "approve") {
          const hash = createHash("sha256").update(draft.content_json).digest("hex");
          const publicationId = randomUUID();
          await executeOn(connection,"INSERT INTO publication_versions (id,module_key,slug,content_json,content_hash,published_by) VALUES (?,?,?,?,?,?)",[publicationId,req.module_key,req.slug,draft.content_json,hash,user.id]);
          await executeOn(connection,"UPDATE publication_requests SET status='Approved',reviewed_by=?,review_note=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?",[user.id,note,requestId]);
          await executeOn(connection,"INSERT INTO publication_audit (id,module_key,request_id,publication_id,action,actor,details_json) VALUES (?,?,? ,?,'published',?,?)",[randomUUID(),req.module_key,requestId,publicationId,user.id,JSON.stringify({hash,note})]);
          return {published:true,requestId,publicationId};
        }
        await executeOn(connection,"UPDATE publication_requests SET status='Rejected',reviewed_by=?,review_note=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?",[user.id,note,requestId]);
        await executeOn(connection,"INSERT INTO publication_audit (id,module_key,request_id,action,actor,details_json) VALUES (?,?,?,'rejected',?,?)",[randomUUID(),req.module_key,requestId,user.id,JSON.stringify({note})]);
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

  if(resource==="customers"&&id&&action==="portal-link"&&method==="POST"){
    const customer=await ensureCustomer(id);
    const token=randomBytes(32).toString("hex");
    const expires=new Date(Date.now()+30*86400000).toISOString().slice(0,19).replace("T"," ");
    await execute(
      "INSERT INTO customer_portal_links (token_hash,customer_id,expires_at,created_by) VALUES (?,?,?,?)",
      [createHash("sha256").update(token).digest("hex"),id,expires,user.id],
    );
    await audit(user,request,"create_portal_link","customer",id,{expires_at:expires});
    const base=(process.env.APP_BASE_URL||new URL(request.url).origin).replace(/\/$/,"");
    return send({url:base+"/portal/"+token,expires_at:new Date(expires+"Z").toISOString(),customer_name:customer.display_name},201);
  }

  if(resource==="operations"){
    const category=id;
    const recordId=action;
    if(!category||!OPERATION_STATUS[category])return send({error:"Unknown Operations Manager module."},404);
    if(!recordId&&method==="GET")return send({items:await listOperationRecords(category)});
    if(!recordId&&method==="POST"){
      const item=await createOperation(category,input,user,request);
      return send({item},201);
    }
    if(recordId&&method==="PATCH"){
      const saved=await updateOperationStatus(category,recordId,text(input.status,40),user,request);
      return saved?send({item:saved}):send({error:"Record not found."},404);
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
    const [
      enquiries,jobs,quotes,invoices,paid,paidExpenses,recordedExpenses,invoiceBalance,
      maintenanceDue,lowStock,supplierCount,subcontractorCount
    ] = await Promise.all([
      row("SELECT COUNT(*) AS total FROM enquiries"),
      row("SELECT COUNT(*) AS total FROM jobs WHERE status NOT IN ('Completed','Cancelled')"),
      row("SELECT COUNT(*) AS total FROM documents WHERE kind='Quotation' AND status IN ('Draft','Sent')"),
      row("SELECT COUNT(*) AS total FROM documents WHERE kind='Invoice' AND status IN ('Sent','Overdue')"),
      row("SELECT COALESCE(SUM(amount_cents),0) AS total FROM invoice_payments WHERE paid_at >= DATE_FORMAT(UTC_DATE(),'%Y-%m-01')"),
      row("SELECT COALESCE(SUM(amount_cents),0) AS total FROM expenses WHERE status='Paid' AND expense_date >= DATE_FORMAT(UTC_DATE(),'%Y-%m-01')"),
      row("SELECT COALESCE(SUM(amount_cents),0) AS total FROM expenses WHERE status IN ('Approved','Paid') AND expense_date >= DATE_FORMAT(UTC_DATE(),'%Y-%m-01')"),
      row("SELECT COALESCE(SUM(d.amount_cents-COALESCE(p.paid_cents,0)),0) AS total FROM documents d LEFT JOIN (SELECT document_id,SUM(amount_cents) AS paid_cents FROM invoice_payments GROUP BY document_id) p ON p.document_id=d.id WHERE d.kind='Invoice' AND d.status IN ('Sent','Overdue')"),
      row("SELECT COUNT(*) AS total FROM maintenance_plans WHERE status IN ('Active','Due') AND next_due_date<=DATE_ADD(UTC_DATE(),INTERVAL 30 DAY)"),
      row("SELECT COUNT(*) AS total FROM materials WHERE status IN ('Low stock','Out of stock') OR quantity<=minimum_quantity"),
      row("SELECT COUNT(*) AS total FROM suppliers WHERE status='Active'"),
      row("SELECT COUNT(*) AS total FROM subcontractors WHERE status='Approved'"),
    ]);
    const items = [
      {metric:"Total enquiries",value:Number(enquiries?.total||0),detail:"All recorded customer requests",data_status:"Live database"},
      {metric:"Active jobs",value:Number(jobs?.total||0),detail:"Jobs not completed or cancelled",data_status:"Live database"},
      {metric:"Open quotations",value:Number(quotes?.total||0),detail:"Draft and sent quotations",data_status:"Live database"},
      {metric:"Outstanding invoice balance",value:Number(invoiceBalance?.total||0),format:"ZAR_CENTS",detail:"Invoice face value less all recorded payments for sent/overdue invoices",data_status:"Calculated from payment ledger"},
      {metric:"Payments received this month",value:Number(paid?.total||0),format:"ZAR_CENTS",detail:"Recorded invoice payments received this month",data_status:"Payment ledger"},
      {metric:"Paid expenses this month",value:Number(paidExpenses?.total||0),format:"ZAR_CENTS",detail:"Expenses marked paid this month",data_status:"Expense register"},
      {metric:"Approved or paid expenses this month",value:Number(recordedExpenses?.total||0),format:"ZAR_CENTS",detail:"Approved and paid expenses recorded this month",data_status:"Expense register"},
      {metric:"Maintenance due within 30 days",value:Number(maintenanceDue?.total||0),detail:"Active or due plans with a next service date within 30 days",data_status:"Maintenance register"},
      {metric:"Low / out-of-stock items",value:Number(lowStock?.total||0),detail:"Items at or below their reorder threshold",data_status:"Inventory register"},
      {metric:"Active suppliers",value:Number(supplierCount?.total||0),detail:"Suppliers marked active",data_status:"Supplier register"},
      {metric:"Approved subcontractors",value:Number(subcontractorCount?.total||0),detail:"Subcontractors approved for consideration",data_status:"Subcontractor register"},
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
