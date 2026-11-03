interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  MAX_UPLOAD_BYTES?: string;
  CMS_WRITE_ENABLED?: string;
}

interface AccessClaims {
  aud: string | string[];
  exp: number;
  iss: string;
  email?: string;
  sub?: string;
}

type Collection = "enquiries" | "jobs" | "documents";
type Row = Record<string, string | number | null>;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);
const STATUSES: Record<Collection, string[]> = {
  enquiries: ["New", "Contacted", "Quoted", "Converted", "Closed"],
  jobs: ["New", "Quoted", "In progress", "Completed", "Cancelled"],
  documents: ["Draft", "Sent", "Accepted", "Declined", "Expired", "Paid", "Overdue", "Cancelled"],
};

const ADMIN_ORIGINS = new Set([
  "https://ngms-website-v4.vercel.app",
  "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev",
  "https://www.nextgensolarmaintenance.co.za",
  "https://nextgensolarmaintenance.co.za",
]);
function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "vary": "Origin",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400",
  };
  if (origin && (ADMIN_ORIGINS.has(origin) || (origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app")))) headers["access-control-allow-origin"] = origin;
  return headers;
}
function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...corsHeaders(origin),
    },
  });
}
function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
function decodeSegment<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T;
}
async function verifyAccessJwt(request: Request, env: Env): Promise<AccessClaims | null> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD || env.CF_ACCESS_TEAM_DOMAIN.startsWith("REPLACE_") || env.CF_ACCESS_AUD.startsWith("REPLACE_")) return null;
  try {
    const [headerSegment, payloadSegment, signatureSegment] = token.split(".");
    if (!headerSegment || !payloadSegment || !signatureSegment) return null;
    const header = decodeSegment<{ alg: string; kid: string }>(headerSegment);
    const claims = decodeSegment<AccessClaims>(payloadSegment);
    if (header.alg !== "RS256" || !header.kid) return null;
    const issuer = env.CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
    if (claims.iss !== issuer || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(env.CF_ACCESS_AUD)) return null;
    const response = await fetch(`${issuer}/cdn-cgi/access/certs`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const keySet = await response.json() as { keys?: JsonWebKey[] };
    const jwk = keySet.keys?.find((key) => (key as JsonWebKey & { kid?: string }).kid === header.kid);
    if (!jwk) return null;
    const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signedData = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, base64UrlToBytes(signatureSegment), signedData) ? claims : null;
  } catch { return null; }
}
function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload";
}
async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
function textField(body: Record<string, unknown>, key: string, max = 2000): string | null {
  const value = body[key];
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length <= max ? cleaned : null;
}
function validStatus(collection: Collection, status: string): boolean {
  return STATUSES[collection].includes(status);
}
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      if (!origin || !(ADMIN_ORIGINS.has(origin) || (origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app")))) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "ngms-admin-api", storage: "cloudflare-r2", database: "cloudflare-d1" }, 200, origin);
    }
    const publicQuoteMatch = url.pathname.match(/^\/api\/public\/quotes\/([a-f0-9]{64})$/i);
    if (publicQuoteMatch && (request.method === "GET" || request.method === "POST")) {
      try {
        const tokenHash = await sha256Hex(publicQuoteMatch[1]);
        const link = await env.DB.prepare("SELECT l.document_id, l.expires_at, l.used_at, l.enquiry_id, l.customer_id, l.decision, l.job_id, d.reference, d.customer_name, d.kind, d.amount_cents, d.subtotal_cents, d.discount_cents, d.vat_enabled, d.vat_rate_basis_points, d.vat_cents, d.status, d.issue_date, d.notes, e.service, e.area, c.display_name AS crm_customer_name FROM quote_public_links l JOIN documents d ON d.id = l.document_id LEFT JOIN enquiries e ON e.id = l.enquiry_id LEFT JOIN customers c ON c.id = l.customer_id WHERE l.token_hash = ? AND d.kind = 'Quotation'").bind(tokenHash).first<Record<string, unknown>>();
        if (!link || Date.parse(String(link.expires_at)) <= Date.now()) return json({ error: "This quotation link is invalid or has expired." }, 404, origin);
        if (request.method === "GET") {
          const lines = await env.DB.prepare("SELECT description, quantity, unit, unit_price_cents, line_total_cents FROM document_line_items WHERE document_id = ? ORDER BY line_order").bind(link.document_id).all();
          return json({ quote: link, lines: lines.results }, 200, origin);
        }
        if (link.used_at || link.status !== "Sent") return json({ error: "This quotation is no longer awaiting a customer decision." }, 409, origin);
        if (typeof link.enquiry_id !== "string" || typeof link.customer_id !== "string") return json({ error: "This quotation is not linked to a verified enquiry. Contact NGMS for assistance." }, 409, origin);
        const enquiry = await env.DB.prepare("SELECT id, customer_id, status FROM enquiries WHERE id = ?").bind(link.enquiry_id).first<{ id: string; customer_id: string | null; status: string }>();
        if (!enquiry || enquiry.customer_id !== link.customer_id || !["New", "Contacted", "Quoted"].includes(enquiry.status)) return json({ error: "The originating enquiry is no longer eligible for a customer decision." }, 409, origin);
        const body = await readJson(request);
        const decision = body ? textField(body, "decision", 16) : null;
        if (decision !== "Accepted" && decision !== "Declined") return json({ error: "Choose Accept or Decline." }, 400, origin);
        const decidedAt = new Date().toISOString();
        if (decision === "Declined") {
          const results = await env.DB.batch([
            env.DB.prepare("UPDATE documents SET status = 'Declined', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'Sent' AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at IS NULL)").bind(link.document_id, tokenHash),
            env.DB.prepare("UPDATE quote_public_links SET used_at = ?, decision = 'Declined', decision_at = ? WHERE token_hash = ? AND used_at IS NULL").bind(decidedAt, decidedAt, tokenHash),
            env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) SELECT ?, ?, 'document', ?, 'quote_declined', ?, 'customer-quote-decision' WHERE EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at = ? AND decision = 'Declined')").bind(newId("ACT"), link.customer_id, link.document_id, "Customer declined quotation " + String(link.reference), tokenHash, decidedAt)
          ]);
          if (!results[0]?.meta?.changes || !results[1]?.meta?.changes) return json({ error: "The quotation has already received a decision." }, 409, origin);
          return json({ saved: true, decision, reference: link.reference, job_id: null }, 200, origin);
        }
        const candidateJobId = newId("J");
        const details = [String(link.reference), String(link.notes || ""), String(link.service || ""), "Accepted quotation"].filter(Boolean).join("\n");
        const results = await env.DB.batch([
          env.DB.prepare("UPDATE documents SET status = 'Accepted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'Sent' AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at IS NULL AND enquiry_id = ? AND customer_id = ?)").bind(link.document_id, tokenHash, link.enquiry_id, link.customer_id),
          env.DB.prepare("INSERT INTO jobs (id, customer_name, service, area, details, created_by, customer_id, source_document_id) SELECT ?, e.customer_name, e.service, e.area, ?, 'customer-quote-acceptance', e.customer_id, d.id FROM quote_public_links l JOIN documents d ON d.id = l.document_id JOIN enquiries e ON e.id = l.enquiry_id WHERE l.token_hash = ? AND l.used_at IS NULL AND l.customer_id = e.customer_id AND d.status = 'Accepted' AND e.status IN ('New','Contacted','Quoted') AND NOT EXISTS (SELECT 1 FROM jobs WHERE source_document_id = d.id)").bind(candidateJobId, details, tokenHash),
          env.DB.prepare("UPDATE quote_public_links SET used_at = ?, decision = 'Accepted', decision_at = ?, job_id = (SELECT id FROM jobs WHERE source_document_id = ?) WHERE token_hash = ? AND used_at IS NULL AND EXISTS (SELECT 1 FROM jobs WHERE source_document_id = ?)").bind(decidedAt, decidedAt, link.document_id, tokenHash, link.document_id),
          env.DB.prepare("UPDATE enquiries SET status = 'Converted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id = ? AND status IN ('New','Contacted','Quoted') AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at = ? AND decision = 'Accepted' AND job_id IS NOT NULL)").bind(link.enquiry_id, link.customer_id, tokenHash, decidedAt),
          env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) SELECT ?, ?, 'job', l.job_id, 'job_created_from_quote', ?, 'customer-quote-acceptance' FROM quote_public_links l WHERE l.token_hash = ? AND l.used_at = ? AND l.decision = 'Accepted' AND l.job_id IS NOT NULL").bind(newId("ACT"), link.customer_id, "Customer accepted quotation " + String(link.reference), tokenHash, decidedAt)
        ]);
        if (!results[0]?.meta?.changes || !results[2]?.meta?.changes) return json({ error: "The quotation has already received a decision or could not be converted to a job." }, 409, origin);
        const job = await env.DB.prepare("SELECT id FROM jobs WHERE source_document_id = ?").bind(link.document_id).first<{ id: string }>();
        if (!job) return json({ error: "Quotation acceptance was recorded but job creation could not be verified. Contact NGMS before resubmitting." }, 500, origin);
        return json({ saved: true, decision, reference: link.reference, job_id: job.id }, 200, origin);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Could not process quotation decision." }, 500, origin);
      }
    }
    if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found" }, 404, origin);

    const claims = await verifyAccessJwt(request, env);
    if (!claims) return json({ error: "Unauthorised. Sign in through the configured Cloudflare Access application." }, 401, origin);
    const actor = claims.email || claims.sub;
    if (!actor) return json({ error: "Access identity is missing." }, 403, origin);

    try {
      if (url.pathname === "/api/admin/media" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, original_name, content_type, size_bytes, uploaded_by, created_at FROM media ORDER BY created_at DESC LIMIT 100").all();
        return json({ items: result.results }, 200, origin);
      }
      if (url.pathname === "/api/admin/media" && request.method === "POST") {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Attach a file using the 'file' field." }, 400, origin);
        const maxBytes = Math.max(1, Number(env.MAX_UPLOAD_BYTES || 10485760));
        if (file.size < 1 || file.size > maxBytes) return json({ error: `File must be between 1 byte and ${maxBytes} bytes.` }, 413, origin);
        if (!ALLOWED_TYPES.has(file.type)) return json({ error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF or PDF." }, 415, origin);
        const id = crypto.randomUUID();
        const name = safeFileName(file.name);
        const key = `uploads/${new Date().toISOString().slice(0, 10)}/${id}-${name}`;
        await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "private, no-store" }, customMetadata: { originalName: name, uploadedBy: actor } });
        try {
          await env.DB.prepare("INSERT INTO media (id, object_key, original_name, content_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)").bind(id, key, name, file.type, file.size, actor).run();
        } catch (error) {
          await env.MEDIA.delete(key);
          throw error;
        }
        return json({ id, name, type: file.type, size: file.size }, 201, origin);
      }
      const mediaReplaceMatch = url.pathname.match(/^\/api\/admin\/media\/([0-9a-f-]{36})\/replace$/i);
      if (mediaReplaceMatch && request.method === "POST") {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Attach a replacement file using the 'file' field." }, 400, origin);
        const maxBytes = Math.max(1, Number(env.MAX_UPLOAD_BYTES || 10485760));
        if (file.size < 1 || file.size > maxBytes) return json({ error: `File must be between 1 byte and ${maxBytes} bytes.` }, 413, origin);
        if (!ALLOWED_TYPES.has(file.type)) return json({ error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF or PDF." }, 415, origin);
        const existing = await env.DB.prepare("SELECT object_key FROM media WHERE id = ?")
          .bind(mediaReplaceMatch[1])
          .first<{ object_key: string }>();
        if (!existing) return json({ error: "Media not found." }, 404, origin);

        const name = safeFileName(file.name);
        const key = `uploads/${new Date().toISOString().slice(0, 10)}/${mediaReplaceMatch[1]}-${crypto.randomUUID()}-${name}`;
        await env.MEDIA.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type, cacheControl: "private, no-store" },
          customMetadata: { originalName: name, uploadedBy: actor },
        });
        try {
          await env.DB.prepare("UPDATE media SET object_key = ?, original_name = ?, content_type = ?, size_bytes = ?, uploaded_by = ? WHERE id = ?")
            .bind(key, name, file.type, file.size, actor, mediaReplaceMatch[1])
            .run();
        } catch (error) {
          await env.MEDIA.delete(key);
          throw error;
        }
        await env.MEDIA.delete(existing.object_key);
        return json({ replaced: true, id: mediaReplaceMatch[1], name, type: file.type, size: file.size }, 200, origin);
      }

      const mediaMatch = url.pathname.match(/^\/api\/admin\/media\/([0-9a-f-]{36})(?:\/delete)?$/i);
      if (mediaMatch && (request.method === "DELETE" || (request.method === "POST" && url.pathname.endsWith("/delete")))) {
        const row = await env.DB.prepare("SELECT object_key FROM media WHERE id = ?").bind(mediaMatch[1]).first<{ object_key: string }>();
        if (!row) return json({ error: "Media not found." }, 404, origin);
        const projectUsage = await env.DB.prepare("SELECT id FROM projects WHERE before_media_id = ? OR after_media_id = ? LIMIT 1")
          .bind(mediaMatch[1], mediaMatch[1]).first();
        if (projectUsage) return json({ error: "This photograph is linked to a project. Remove the project reference before deleting the media." }, 409, origin);
        await env.MEDIA.delete(row.object_key);
        await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(mediaMatch[1]).run();
        return json({ deleted: true }, 200, origin);
      }


      const mediaDownloadMatch = url.pathname.match(/^\/api\/admin\/media\/([0-9a-f-]{36})\/download$/i);
      if (mediaDownloadMatch && request.method === "GET") {
        const row = await env.DB.prepare("SELECT object_key, original_name, content_type, size_bytes FROM media WHERE id = ?")
          .bind(mediaDownloadMatch[1])
          .first<{ object_key: string; original_name: string; content_type: string; size_bytes: number }>();
        if (!row) return json({ error: "Media not found." }, 404, origin);
        const object = await env.MEDIA.get(row.object_key);
        if (!object) return json({ error: "Media object not found." }, 404, origin);
        return new Response(object.body, {
          status: 200,
          headers: {
            ...corsHeaders(origin),
            "content-type": row.content_type,
            "content-disposition": `inline; filename="${safeFileName(row.original_name)}"`,
            "content-length": String(row.size_bytes),
            "cache-control": "private, no-store",
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer",
          },
        });
      }


      // Commercial document settings and itemised quotation/invoice workflow.
      if (url.pathname === "/api/admin/commercial-settings" && request.method === "GET") {
        const row = await env.DB.prepare("SELECT setting_json FROM business_settings WHERE setting_key = 'commercial.vat'").first<{ setting_json: string }>();
        let settings = { vat_enabled: false, vat_rate_basis_points: 1500 };
        if (row?.setting_json) {
          try {
            const saved = JSON.parse(row.setting_json) as Record<string, unknown>;
            settings = {
              vat_enabled: saved.vat_enabled === true,
              vat_rate_basis_points: Number.isInteger(saved.vat_rate_basis_points) && Number(saved.vat_rate_basis_points) >= 0 && Number(saved.vat_rate_basis_points) <= 3000 ? Number(saved.vat_rate_basis_points) : 1500,
            };
          } catch { /* Fall back to safe defaults for a malformed setting. */ }
        }
        return json({ settings }, 200, origin);
      }

      if (url.pathname === "/api/admin/commercial-settings" && request.method === "PUT") {
        const body = await readJson(request);
        if (!body || typeof body.vat_enabled !== "boolean") return json({ error: "Provide a VAT enabled setting." }, 400, origin);
        const rate = Number(body.vat_rate_basis_points);
        if (!Number.isInteger(rate) || rate < 0 || rate > 3000) return json({ error: "VAT rate must be between 0% and 30%." }, 400, origin);
        const settings = { vat_enabled: body.vat_enabled, vat_rate_basis_points: rate };
        await env.DB.prepare("INSERT INTO business_settings (setting_key, setting_json, updated_by) VALUES ('commercial.vat', ?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_json = excluded.setting_json, updated_by = excluded.updated_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(JSON.stringify(settings), actor).run();
        return json({ saved: true, settings }, 200, origin);
      }

      const commercialShareMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)\/share$/);
      if (commercialShareMatch && request.method === "POST") {
        const body = await readJson(request);
        const enquiryId = body ? textField(body, "enquiry_id", 120) : null;
        if (!enquiryId) return json({ error: "Link the quotation to its originating enquiry before issuing it." }, 400, origin);
        const quote = await env.DB.prepare("SELECT id, reference, status, customer_id FROM documents WHERE id = ? AND kind = 'Quotation' AND reference IS NOT NULL").bind(commercialShareMatch[1]).first<{ id: string; reference: string; status: string; customer_id: string | null }>();
        if (!quote) return json({ error: "Quotation not found." }, 404, origin);
        if (quote.status !== "Draft" && quote.status !== "Sent") return json({ error: "Only draft or sent quotations can be shared." }, 409, origin);
        const enquiry = await env.DB.prepare("SELECT id, customer_id, status FROM enquiries WHERE id = ?").bind(enquiryId).first<{ id: string; customer_id: string | null; status: string }>();
        if (!enquiry || !quote.customer_id || enquiry.customer_id !== quote.customer_id || !["Contacted", "Quoted"].includes(enquiry.status)) return json({ error: "The enquiry must be linked to the same CRM customer and ready for quotation." }, 409, origin);
        const token = newShareToken(), tokenHash = await sha256Hex(token);
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE quote_public_links SET expires_at = ? WHERE document_id = ? AND used_at IS NULL").bind(now, quote.id),
          env.DB.prepare("INSERT INTO quote_public_links (id, document_id, token_hash, expires_at, created_by, enquiry_id, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(newId("QL"), quote.id, tokenHash, expiresAt, actor, enquiry.id, quote.customer_id),
          env.DB.prepare("UPDATE documents SET status = 'Sent', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status IN ('Draft','Sent')").bind(quote.id),
          env.DB.prepare("UPDATE enquiries SET status = 'Quoted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id = ? AND status IN ('Contacted','Quoted')").bind(enquiry.id, quote.customer_id),
          env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) VALUES (?, ?, 'document', ?, 'quote_issued', ?, ?)").bind(newId("ACT"), quote.customer_id, quote.id, "Quotation issued: " + quote.reference, actor)
        ]);
        const base = origin || "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev";
        return json({ url: base + "/quote/" + token, expires_at: expiresAt, reference: quote.reference }, 201, origin);
      }


      const commercialPaymentsMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)\/payments$/);
      if (commercialPaymentsMatch && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id,amount_cents,paid_at,method,reference,notes,recorded_by,created_at FROM document_payments WHERE document_id = ? ORDER BY paid_at DESC").bind(commercialPaymentsMatch[1]).all();
        const total = await env.DB.prepare("SELECT amount_cents FROM documents WHERE id = ? AND kind = 'Invoice'").bind(commercialPaymentsMatch[1]).first<{amount_cents:number}>();
        if (!total) return json({error:"Invoice not found."},404,origin);
        const paid = result.results.reduce((sum,row)=>sum+Number((row as {amount_cents:number}).amount_cents),0);
        return json({items:result.results,paid_cents:paid,balance_cents:Math.max(0,total.amount_cents-paid)},200,origin);
      }
      if (commercialPaymentsMatch && request.method === "POST") {
        const body = await readJson(request);
        if (!body) return json({error:"Provide payment details."},400,origin);
        const amount = Number(body.amount);
        const method = textField(body,"method",32) || "EFT";
        const reference = textField(body,"reference",120) || "";
        const notes = textField(body,"notes",1000) || "";
        const paidAt = textField(body,"paid_at",40) || new Date().toISOString();
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000 || !Number.isFinite(Date.parse(paidAt)) || !["EFT","Cash","Card","Other"].includes(method)) return json({error:"Enter a valid positive payment, date and payment method."},400,origin);
        const invoice = await env.DB.prepare("SELECT id,amount_cents,status,customer_id,reference FROM documents WHERE id = ? AND kind = 'Invoice' AND reference IS NOT NULL").bind(commercialPaymentsMatch[1]).first<{id:string;amount_cents:number;status:string;customer_id:string|null;reference:string}>();
        if (!invoice || invoice.status === "Cancelled") return json({error:"An active invoice is required."},404,origin);
        const already = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS paid FROM document_payments WHERE document_id = ?").bind(invoice.id).first<{paid:number}>();
        const amountCents = Math.round(amount*100);
        if (Number(already?.paid || 0)+amountCents > invoice.amount_cents) return json({error:"Payment exceeds the outstanding invoice balance."},409,origin);
        const id = newId("PAY"), newPaid = Number(already?.paid || 0)+amountCents;
        const nextStatus = newPaid >= invoice.amount_cents ? "Paid" : "Sent";
        try {
          await env.DB.batch([
          env.DB.prepare("INSERT INTO document_payments (id,document_id,amount_cents,paid_at,method,reference,notes,recorded_by) VALUES (?,?,?,?,?,?,?,?)").bind(id,invoice.id,amountCents,new Date(paidAt).toISOString(),method,reference,notes,actor),
          env.DB.prepare("UPDATE documents SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(nextStatus,invoice.id),
          ...(invoice.customer_id ? [env.DB.prepare("INSERT INTO customer_activity (id,customer_id,entity_type,entity_id,event_type,summary,actor) VALUES (?,?,'document',?,'payment_recorded',?,?)").bind(newId("ACT"),invoice.customer_id,invoice.id,"Payment of R"+(amountCents/100).toFixed(2)+" allocated to "+invoice.reference,actor)] : []),
          ]);
        } catch (error) {
          const latest = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS paid FROM document_payments WHERE document_id = ?").bind(invoice.id).first<{paid:number}>();
          if (Number(latest?.paid || 0) + amountCents > invoice.amount_cents) return json({error:"Payment exceeds the outstanding invoice balance."},409,origin);
          throw error;
        }
        return json({saved:true,paid_cents:newPaid,balance_cents:invoice.amount_cents-newPaid,status:nextStatus},201,origin);
      }

      const commercialJobMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)\/convert-to-job$/);
      if (commercialJobMatch && request.method === "POST") {
        const quote = await env.DB.prepare("SELECT d.id,d.reference,d.status,d.customer_id,d.customer_name,d.notes,c.service_address FROM documents d LEFT JOIN customers c ON c.id=d.customer_id WHERE d.id=? AND d.kind='Quotation'").bind(commercialJobMatch[1]).first<{id:string;reference:string;status:string;customer_id:string|null;customer_name:string;notes:string;service_address:string|null}>();
        if (!quote || quote.status !== "Accepted" || !quote.customer_id) return json({error:"Only accepted quotations linked to an active CRM customer can become jobs."},409,origin);
        const existing = await env.DB.prepare("SELECT id FROM jobs WHERE source_document_id = ?").bind(quote.id).first<{id:string}>();
        if (existing) return json({error:"A job has already been created from this quotation.",job_id:existing.id},409,origin);
        const lines = await env.DB.prepare("SELECT description,quantity,unit FROM document_line_items WHERE document_id=? ORDER BY line_order").bind(quote.id).all<{description:string;quantity:number;unit:string}>();
        const service = lines.results[0]?.description || "Quoted work";
        const details = [quote.reference,quote.notes,...lines.results.map(line=>String(line.quantity)+" "+line.unit+" — "+line.description)].filter(Boolean).join("\n");
        const id = newId("J");
        await env.DB.batch([
          env.DB.prepare("INSERT INTO jobs (id,customer_name,service,area,details,created_by,customer_id,source_document_id) VALUES (?,?,?,?,?,?,?,?)").bind(id,quote.customer_name,service,quote.service_address || "",details,actor,quote.customer_id,quote.id),
          env.DB.prepare("INSERT INTO customer_activity (id,customer_id,entity_type,entity_id,event_type,summary,actor) VALUES (?,?,'job',?,'job_created_from_quote',?,?)").bind(newId("ACT"),quote.customer_id,id,"Job created from accepted quotation "+quote.reference,actor),
        ]);
        const job = await env.DB.prepare("SELECT * FROM jobs WHERE id=?").bind(id).first

--- TRUNCATED ---
Response was ~19,301 tokens (limit: 6,000). Use more specific queries to reduce response size.