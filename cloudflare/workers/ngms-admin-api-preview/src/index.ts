// @ts-nocheck
// Cloudflare Workers entry point for the isolated NGMS admin API preview.
// The deployed Worker is protected by Cloudflare Access; secrets are configured in Worker settings.
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
  "https://www.nextgensolarmaintenance.co.za",
  "https://nextgensolarmaintenance.co.za",
  "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev",
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

      const commercialCollection = url.pathname === "/api/admin/commercial-documents";
      const commercialStatusMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)\/status$/);
      const commercialDetailMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)$/);
      if (commercialCollection && request.method === "GET") {
        const kind = url.searchParams.get("kind");
        const status = url.searchParams.get("status");
        if (kind !== "Quotation" && kind !== "Invoice") return json({ error: "Choose Quotation or Invoice." }, 400, origin);
        if (status && !["Draft", "Sent", "Accepted", "Declined", "Expired", "Overdue", "Cancelled"].includes(status)) return json({ error: "Invalid document status filter." }, 400, origin);
        const result = await env.DB.prepare("SELECT d.id, d.reference, d.customer_id, COALESCE(c.display_name, d.customer_name) AS customer_name, d.kind, d.amount_cents, d.subtotal_cents, d.discount_cents, d.vat_enabled, d.vat_rate_basis_points, d.vat_cents, d.status, d.issue_date, d.created_at, d.source_document_id FROM documents d LEFT JOIN customers c ON c.id = d.customer_id WHERE d.reference IS NOT NULL AND d.kind = ? AND (? IS NULL OR d.status = ?) ORDER BY d.created_at DESC LIMIT 200").bind(kind, status, status).all();
        return json({ items: result.results }, 200, origin);
      }

      if (commercialCollection && request.method === "POST") {
        const body = await readJson(request);
        if (!body || (body.kind !== "Quotation" && body.kind !== "Invoice")) return json({ error: "Choose Quotation or Invoice." }, 400, origin);
        const kind = body.kind as "Quotation" | "Invoice";
        const sourceDocumentId = kind === "Invoice" ? textField(body, "source_document_id", 100) : null;
        let customerId = textField(body, "customer_id", 100);
        let sourceQuote: { id: string; customer_id: string | null; status: string; kind: string; subtotal_cents: number; discount_cents: number; vat_enabled: number; vat_rate_basis_points: number } | null = null;
        let itemLines: { description: string; quantity: number; unit: string; unit_price_cents: number; line_total_cents: number }[] = [];

        if (kind === "Invoice") {
          if (!sourceDocumentId) return json({ error: "Invoices can only be created from an accepted quotation." }, 400, origin);
          const activeInvoice = await env.DB.prepare("SELECT id FROM documents WHERE source_document_id = ? AND kind = 'Invoice' AND status <> 'Cancelled' LIMIT 1").bind(sourceDocumentId).first();
          if (activeInvoice) return json({ error: "An invoice already exists for this accepted quotation." }, 409, origin);
          sourceQuote = await env.DB.prepare("SELECT id, customer_id, status, kind, subtotal_cents, discount_cents, vat_enabled, vat_rate_basis_points FROM documents WHERE id = ? AND kind = 'Quotation' AND reference IS NOT NULL").bind(sourceDocumentId).first<typeof sourceQuote extends infer T ? NonNullable<T> : never>();
          if (!sourceQuote || sourceQuote.status !== "Accepted" || !sourceQuote.customer_id) return json({ error: "Select an accepted quotation linked to a CRM customer." }, 409, origin);
          if (customerId && customerId !== sourceQuote.customer_id) return json({ error: "The invoice customer must match the accepted quotation." }, 409, origin);
          customerId = sourceQuote.customer_id;
          const sourceLines = await env.DB.prepare("SELECT description, quantity, unit, unit_price_cents FROM document_line_items WHERE document_id = ? ORDER BY line_order").bind(sourceDocumentId).all<{ description: string; quantity: number; unit: string; unit_price_cents: number }>();
          itemLines = sourceLines.results.map((line) => ({ ...line, line_total_cents: Math.round(Number(line.quantity) * Number(line.unit_price_cents)) }));
          if (!itemLines.length) return json({ error: "The accepted quotation has no item lines to invoice." }, 409, origin);
        } else {
          if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 100) return json({ error: "Add between 1 and 100 quotation lines." }, 400, origin);
          for (const rawLine of body.lines) {
            if (!rawLine || typeof rawLine !== "object" || Array.isArray(rawLine)) return json({ error: "Each quotation line must be an object." }, 400, origin);
            const line = rawLine as Record<string, unknown>;
            const description = textField(line, "description", 240);
            const unit = textField(line, "unit", 24) || "item";
            const quantity = Number(line.quantity);
            const unitPrice = Number(line.unit_price);
            if (!description || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000 || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 10000000) return json({ error: "Each line needs a description, positive quantity and valid unit price." }, 400, origin);
            const unitPriceCents = Math.round(unitPrice * 100);
            itemLines.push({ description, quantity, unit, unit_price_cents: unitPriceCents, line_total_cents: Math.round(quantity * unitPriceCents) });
          }
        }

        if (!customerId) return json({ error: "Select a customer from the NGMS CRM." }, 400, origin);
        const customer = await env.DB.prepare("SELECT id, display_name FROM customers WHERE id = ? AND status = 'Active'").bind(customerId).first<{ id: string; display_name: string }>();
        if (!customer) return json({ error: "The selected CRM customer is missing or archived." }, 404, origin);

        const subtotalCents = itemLines.reduce((sum, line) => sum + line.line_total_cents, 0);
        let discountCents = 0;
        let vatEnabled = body.vat_enabled === true;
        let vatRate = 1500;
        if (kind === "Invoice" && sourceQuote) {
          discountCents = Number(sourceQuote.discount_cents || 0);
          vatEnabled = Number(sourceQuote.vat_enabled) === 1;
          vatRate = Number(sourceQuote.vat_rate_basis_points || 1500);
        } else {
          const requestedDiscount = Number(body.discount_amount ?? 0);
          if (!Number.isFinite(requestedDiscount) || requestedDiscount < 0 || requestedDiscount > 100000000) return json({ error: "Discount must be a valid non-negative ZAR amount." }, 400, origin);
          discountCents = Math.min(subtotalCents, Math.round(requestedDiscount * 100));
          const savedSettings = await env.DB.prepare("SELECT setting_json FROM business_settings WHERE setting_key = 'commercial.vat'").first<{ setting_json: string }>();
          if (savedSettings?.setting_json) {
            try {
              const saved = JSON.parse(savedSettings.setting_json) as Record<string, unknown>;
              if (typeof body.vat_enabled !== "boolean") vatEnabled = saved.vat_enabled === true;
              if (Number.isInteger(saved.vat_rate_basis_points)) vatRate = Math.min(3000, Math.max(0, Number(saved.vat_rate_basis_points)));
            } catch { /* Keep the safe defaults. */ }
          }
        }

        const taxableCents = Math.max(0, subtotalCents - discountCents);
        const vatCents = vatEnabled ? Math.round(taxableCents * vatRate / 10000) : 0;
        const amountCents = taxableCents + vatCents;
        const issueDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const year = Number(issueDate.slice(0, 4));
        const sequenceKey = kind === "Quotation" ? "QUOTE" : "INVOICE";
        const sequence = await env.DB.prepare("INSERT INTO document_sequences (sequence_key, sequence_year, last_value) VALUES (?, ?, 1) ON CONFLICT(sequence_key, sequence_year) DO UPDATE SET last_value = last_value + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') RETURNING last_value").bind(sequenceKey, year).first<{ last_value: number }>();
        if (!sequence) return json({ error: "Could not reserve a document reference." }, 500, origin);
        const referencePrefix = kind === "Quotation" ? "QUOTE" : "INV";
        const reference = `NGMS-${referencePrefix}-${year}-${String(sequence.last_value).padStart(4, "0")}`;
        const id = newId(kind === "Quotation" ? "QUOTE" : "INV");
        const notes = textField(body, "notes", 4000) ?? "";
        const dueDate = kind === "Invoice" ? textField(body, "due_date", 10) : null;
        if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return json({ error: "Due date must use YYYY-MM-DD." }, 400, origin);

        const statements = [
          env.DB.prepare("INSERT INTO documents (id, customer_name, customer_id, kind, amount_cents, status, created_by, reference, issue_date, due_date, subtotal_cents, discount_cents, vat_enabled, vat_rate_basis_points, vat_cents, notes, source_document_id) VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(id, customer.display_name, customer.id, kind, amountCents, actor, reference, issueDate, dueDate, subtotalCents, discountCents, vatEnabled ? 1 : 0, vatRate, vatCents, notes, sourceDocumentId),
          ...itemLines.map((line, index) => env.DB.prepare("INSERT INTO document_line_items (id, document_id, line_order, description, quantity, unit, unit_price_ce --- TRUNCATED --- 66,316 chars