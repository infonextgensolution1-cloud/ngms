// @ts-nocheck
// Mirrors the isolated NGMS preview admin Worker. Access secrets remain configured only in Cloudflare.
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
    if (url.pathname === "/" && request.method === "GET") {
      return json({
        ok: true,
        service: "NGMS Admin API",
        message: "Backend API for the NGMS preview website. Open the separate website preview for the full site.",
        website: "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev/",
        health: "/health",
      }, 200, origin);
    }
    const publicQuoteMatch = url.pathname.match(/^\/api\/public\/quotes\/([a-f0-9]{64})$/i);
    if (publicQuoteMatch && (request.method === "GET" || request.method === "POST")) {
      try {
        const tokenHash = await sha256Hex(publicQuoteMatch[1]);
        const link = await env.DB.prepare(
          "SELECT l.document_id, l.enquiry_id, l.customer_id, l.decision, l.job_id, l.expires_at, l.used_at, d.reference, d.customer_name, d.kind, d.amount_cents, d.subtotal_cents, d.discount_cents, d.vat_enabled, d.vat_rate_basis_points, d.vat_cents, d.status, d.issue_date, d.notes, e.service, e.area, c.display_name AS crm_customer_name FROM quote_public_links l JOIN documents d ON d.id = l.document_id LEFT JOIN enquiries e ON e.id = l.enquiry_id LEFT JOIN customers c ON c.id = l.customer_id WHERE l.token_hash = ? AND d.kind = 'Quotation'"
        ).bind(tokenHash).first<Record<string, unknown>>();
        if (!link || Date.parse(String(link.expires_at)) <= Date.now()) {
          return json({ error: "This quotation link is invalid or has expired." }, 404, origin);
        }
        if (request.method === "GET") {
          const lines = await env.DB.prepare(
            "SELECT description, quantity, unit, unit_price_cents, line_total_cents FROM document_line_items WHERE document_id = ? ORDER BY line_order"
          ).bind(link.document_id).all();
          return json({ quote: link, lines: lines.results }, 200, origin);
        }
        if (link.used_at || link.status !== "Sent") {
          return json({ error: "This quotation is no longer awaiting a customer decision." }, 409, origin);
        }
        if (typeof link.enquiry_id !== "string" || typeof link.customer_id !== "string") {
          return json({ error: "This quotation is not linked to its originating enquiry. Contact NGMS for assistance." }, 409, origin);
        }
        const enquiry = await env.DB.prepare(
          "SELECT id, customer_id, status FROM enquiries WHERE id = ?"
        ).bind(link.enquiry_id).first<{ id: string; customer_id: string | null; status: string }>();
        if (!enquiry || enquiry.customer_id !== link.customer_id || !["Contacted", "Quoted"].includes(enquiry.status)) {
          return json({ error: "The originating enquiry is no longer eligible for a customer decision." }, 409, origin);
        }
        const body = await readJson(request);
        const decision = body ? textField(body, "decision", 16) : null;
        if (decision !== "Accepted" && decision !== "Declined") {
          return json({ error: "Choose Accept or Decline." }, 400, origin);
        }
        const decidedAt = new Date().toISOString();
        if (decision === "Declined") {
          const results = await env.DB.batch([
            env.DB.prepare(
              "UPDATE documents SET status = 'Declined', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'Sent' AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at IS NULL)"
            ).bind(link.document_id, tokenHash),
            env.DB.prepare(
              "UPDATE quote_public_links SET used_at = ?, decision = 'Declined', decision_at = ? WHERE token_hash = ? AND used_at IS NULL"
            ).bind(decidedAt, decidedAt, tokenHash),
            env.DB.prepare(
              "INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) SELECT ?, ?, 'document', ?, 'quote_declined', ?, 'customer-quote-decision' WHERE EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at = ? AND decision = 'Declined') AND NOT EXISTS (SELECT 1 FROM customer_activity WHERE customer_id = ? AND entity_type = 'document' AND entity_id = ? AND event_type = 'quote_declined')"
            ).bind(newId("ACT"), link.customer_id, link.document_id, "Customer declined quotation " + String(link.reference), tokenHash, decidedAt, link.customer_id, link.document_id),
          ]);
          if (!results[0]?.meta?.changes || !results[1]?.meta?.changes) {
            return json({ error: "The quotation has already received a decision." }, 409, origin);
          }
          return json({ saved: true, decision, reference: link.reference, job_id: null }, 200, origin);
        }

        const candidateJobId = newId("J");
        const lineRows = await env.DB.prepare(
          "SELECT description, quantity, unit FROM document_line_items WHERE document_id = ? ORDER BY line_order"
        ).bind(link.document_id).all<{ description: string; quantity: number; unit: string }>();
        const details = [
          String(link.reference),
          String(link.notes || ""),
          ...lineRows.results.map((line) => String(line.quantity) + " " + line.unit + " — " + line.description),
        ].filter(Boolean).join("\n");

        const results = await env.DB.batch([
          env.DB.prepare(
            "UPDATE documents SET status = 'Accepted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'Sent' AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at IS NULL AND enquiry_id = ? AND customer_id = ?)"
          ).bind(link.document_id, tokenHash, link.enquiry_id, link.customer_id),
          env.DB.prepare(
            "INSERT INTO jobs (id, customer_name, service, area, details, created_by, customer_id, source_document_id) SELECT ?, e.customer_name, e.service, e.area, ?, 'customer-quote-acceptance', e.customer_id, d.id FROM quote_public_links l JOIN documents d ON d.id = l.document_id JOIN enquiries e ON e.id = l.enquiry_id WHERE l.token_hash = ? AND l.used_at IS NULL AND l.customer_id = e.customer_id AND d.status = 'Accepted' AND e.status IN ('Contacted','Quoted') AND NOT EXISTS (SELECT 1 FROM jobs WHERE source_document_id = d.id)"
          ).bind(candidateJobId, details, tokenHash),
          env.DB.prepare(
            "UPDATE quote_public_links SET used_at = ?, decision = 'Accepted', decision_at = ?, job_id = (SELECT id FROM jobs WHERE source_document_id = ?) WHERE token_hash = ? AND used_at IS NULL AND EXISTS (SELECT 1 FROM jobs WHERE source_document_id = ?)"
          ).bind(decidedAt, decidedAt, link.document_id, tokenHash, link.document_id),
          env.DB.prepare(
            "UPDATE enquiries SET status = 'Converted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id = ? AND status IN ('Contacted','Quoted') AND EXISTS (SELECT 1 FROM quote_public_links WHERE token_hash = ? AND used_at = ? AND decision = 'Accepted' AND job_id IS NOT NULL)"
          ).bind(link.enquiry_id, link.customer_id, tokenHash, decidedAt),
          env.DB.prepare(
            "INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) SELECT ?, ?, 'job', l.job_id, 'job_created_from_quote', ?, 'customer-quote-acceptance' FROM quote_public_links l WHERE l.token_hash = ? AND l.used_at = ? AND l.decision = 'Accepted' AND l.job_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM customer_activity WHERE customer_id = ? AND entity_type = 'job' AND entity_id = l.job_id AND event_type = 'job_created_from_quote')"
          ).bind(newId("ACT"), link.customer_id, "Customer accepted quotation " + String(link.reference), tokenHash, decidedAt, link.customer_id),
        ]);
        if (!results[0]?.meta?.changes || !results[2]?.meta?.changes) {
          return json({ error: "The quotation has already received a decision or could not be converted to a job." }, 409, origin);
        }
        const job = await env.DB.prepare(
          "SELECT id FROM jobs WHERE source_document_id = ?"
        ).bind(link.document_id).first<{ id: string }>();
        if (!job) return json({ error: "Job creation could not be verified. Contact NGMS before resubmitting." }, 500, origin);
        return json({ saved: true, decision, reference: link.reference, job_id: job.id }, 200, origin);
      } catch (error) {
        console.error("Customer quotation decision failed", error);
        return json({ error: "Could not process quotation decision. Contact NGMS if the problem persists." }, 500, origin);
      }
    }
    if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found" }, 404, origin);

    const claims = await verifyAccessJwt(request, env);
    if (!claims) return json({ error: "Unauthorised. Sign in through the configured Cloudflare Access application." }, 401, origin);
    const actor = claims.email || claims.sub;
    if (!actor) return json({ error: "Access identity is missing." }, 403, origin);

    try {
      if (url.pathname === "/api/admin/media" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, original_name, content_type, size_bytes, uploaded_by, category, alt_text, tags_json, created_at, updated_at FROM media ORDER BY created_at DESC LIMIT 200").all();
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
          await env.DB.prepare("INSERT INTO media (id, object_key, original_name, content_type, size_bytes, uploaded_by, category, alt_text, tags_json) VALUES (?, ?, ?, ?, ?, ?, 'Uncategorised', '', '[]')").bind(id, key, name, file.type, file.size, actor).run();
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
          await env.DB.prepare("UPDATE media SET object_key = ?, original_name = ?, content_type = ?, size_bytes = ?, uploaded_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
            .bind(key, name, file.type, file.size, actor, mediaReplaceMatch[1])
            .run();
        } catch (error) {
          await env.MEDIA.delete(key);
          throw error;
        }
        await env.MEDIA.delete(existing.object_key);
        const replacedItem = await env.DB.prepare("SELECT id, original_name, content_type, size_bytes, category, alt_text, tags_json, uploaded_by, created_at, updated_at FROM media WHERE id = ?").bind(mediaReplaceMatch[1]).first();
        return json({ replaced: true, item: replacedItem }, 200, origin);
      }


      const mediaMetadataMatch = url.pathname.match(new RegExp("^/api/admin/media/([0-9a-f-]{36})$", "i"));
      if (mediaMetadataMatch && request.method === "PATCH") {
        const body = await readJson(request);
        if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
        const category = textField(body, "category", 80);
        const altText = textField(body, "alt_text", 240) ?? "";
        const rawTags = body.tags;
        if (!category) return json({ error: "A media category is required." }, 400, origin);
        if (!Array.isArray(rawTags) || rawTags.length > 12 || rawTags.some((tag) => typeof tag !== "string" || tag.trim().length > 40)) {
          return json({ error: "Provide up to 12 tags, each no longer than 40 characters." }, 400, origin);
        }
        const tags = Array.from(new Set(rawTags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)));
        const existing = await env.DB.prepare("SELECT id FROM media WHERE id = ?").bind(mediaMetadataMatch[1]).first();
        if (!existing) return json({ error: "Media not found." }, 404, origin);
        await env.DB.prepare("UPDATE media SET category = ?, alt_text = ?, tags_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
          .bind(category, altText, JSON.stringify(tags), mediaMetadataMatch[1]).run();
        const item = await env.DB.prepare("SELECT id, original_name, content_type, size_bytes, uploaded_by, category, alt_text, tags_json, created_at, updated_at FROM media WHERE id = ?")
          .bind(mediaMetadataMatch[1]).first();
        return json({ item }, 200, origin);
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
        if (!enquiryId) return json({ error: "Select the originating enquiry before issuing this quotation." }, 400, origin);
        const quote = await env.DB.prepare(
          "SELECT id, reference, status, customer_id FROM documents WHERE id = ? AND kind = 'Quotation' AND reference IS NOT NULL"
        ).bind(commercialShareMatch[1]).first<{ id: string; reference: string; status: string; customer_id: string | null }>();
        if (!quote) return json({ error: "Quotation not found." }, 404, origin);
        if (quote.status !== "Draft" && quote.status !== "Sent") return json({ error: "Only draft or sent quotations can be shared." }, 409, origin);
        const enquiry = await env.DB.prepare(
          "SELECT id, customer_id, status FROM enquiries WHERE id = ?"
        ).bind(enquiryId).first<{ id: string; customer_id: string | null; status: string }>();
        if (!enquiry || !quote.customer_id || enquiry.customer_id !== quote.customer_id || !["Contacted", "Quoted"].includes(enquiry.status)) {
          return json({ error: "Link the quotation to an enquiry belonging to the same CRM customer before issuing it." }, 409, origin);
        }
        const token = newShareToken();
        const tokenHash = await sha256Hex(token);
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE quote_public_links SET expires_at = ? WHERE document_id = ? AND used_at IS NULL").bind(now, quote.id),
          env.DB.prepare(
            "INSERT INTO quote_public_links (id, document_id, token_hash, expires_at, created_by, enquiry_id, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(newId("QL"), quote.id, tokenHash, expiresAt, actor, enquiry.id, quote.customer_id),
          env.DB.prepare(
            "UPDATE documents SET status = 'Sent', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status IN ('Draft','Sent')"
          ).bind(quote.id),
          env.DB.prepare(
            "UPDATE enquiries SET status = 'Quoted', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id = ? AND status IN ('Contacted','Quoted')"
          ).bind(enquiry.id, quote.customer_id),
          env.DB.prepare(
            "INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) VALUES (?, ?, 'document', ?, 'quote_issued', ?, ?)"
          ).bind(newId("ACT"), quote.customer_id, quote.id, "Quotation issued: " + quote.reference, actor),
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
        const job = await env.DB.prepare("SELECT * FROM jobs WHERE id=?").bind(id).first();
        return json({item:job},201,origin);
      }

      const commercialCollection = url.pathname === "/api/admin/commercial-documents";
      const commercialStatusMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)\/status$/);
      const commercialDetailMatch = url.pathname.match(/^\/api\/admin\/commercial-documents\/([A-Za-z0-9-]+)$/);
      if (commercialCollection && request.method === "GET") {
        const kind = url.searchParams.get("kind");
        const status = url.searchParams.get("status");
        if (kind !== "Quotation" && kind !== "Invoice") return json({ error: "Choose Quotation or Invoice." }, 400, origin);
        if (status && !["Draft", "Sent", "Accepted", "Declined", "Expired", "Overdue", "Cancelled"].includes(status)) return json({ error: "Invalid document status filter." }, 400, origin);
        const result = await env.DB.prepare("SELECT d.id, d.reference, d.customer_id, COALESCE(c.display_name, d.customer_name) AS customer_name, d.kind, d.amount_cents, d.subtotal_cents, d.discount_cents, d.vat_enabled, d.vat_rate_basis_points, d.vat_cents, d.status, d.issue_date, d.created_at, d.source_document_id, (SELECT j.id FROM jobs j WHERE j.source_document_id = d.id LIMIT 1) AS job_id FROM documents d LEFT JOIN customers c ON c.id = d.customer_id WHERE d.reference IS NOT NULL AND d.kind = ? AND (? IS NULL OR d.status = ?) ORDER BY d.created_at DESC LIMIT 200").bind(kind, status, status).all();
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
          const existingInvoice = await env.DB.prepare("SELECT id, reference FROM documents WHERE source_document_id = ? AND kind = 'Invoice' LIMIT 1").bind(sourceDocumentId).first<{ id: string; reference: string | null }>();
          if (existingInvoice) return json({ error: `An invoice (${existingInvoice.reference || existingInvoice.id}) has already been drafted from this quotation.` }, 409, origin);
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
        const referencePrefix = kind === "Quotation" ? "QUOTE" : "INV";
        const id = newId(kind === "Quotation" ? "QUOTE" : "INV");
        const notes = textField(body, "notes", 4000) ?? "";
        const dueDate = kind === "Invoice" ? textField(body, "due_date", 10) : null;
        if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return json({ error: "Due date must use YYYY-MM-DD." }, 400, origin);

        // Reserve the reference and write the document, lines and activity in one
        // D1 batch. If any insert fails, the sequence increment rolls back too.
        const statements = [
          env.DB.prepare("INSERT INTO document_sequences (sequence_key, sequence_year, last_value) VALUES (?, ?, 1) ON CONFLICT(sequence_key, sequence_year) DO UPDATE SET last_value = last_value + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(sequenceKey, year),
          env.DB.prepare("INSERT INTO documents (id, customer_name, customer_id, kind, amount_cents, status, created_by, reference, issue_date, due_date, subtotal_cents, discount_cents, vat_enabled, vat_rate_basis_points, vat_cents, notes, source_document_id) SELECT ?, ?, ?, ?, ?, 'Draft', ?, 'NGMS-' || ? || '-' || ? || '-' || printf('%04d', last_value), ?, ?, ?, ?, ?, ?, ?, ?, ? FROM document_sequences WHERE sequence_key = ? AND sequence_year = ?")
            .bind(id, customer.display_name, customer.id, kind, amountCents, actor, referencePrefix, year, issueDate, dueDate, subtotalCents, discountCents, vatEnabled ? 1 : 0, vatRate, vatCents, notes, sourceDocumentId, sequenceKey, year),
          ...itemLines.map((line, index) => env.DB.prepare("INSERT INTO document_line_items (id, document_id, line_order, description, quantity, unit, unit_price_cents, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(newId("LINE"), id, index, line.description, line.quantity, line.unit, line.unit_price_cents, line.line_total_cents)),
          env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) VALUES (?, ?, 'document', ?, ?, ?, ?)")
            .bind(newId("ACT"), customer.id, id, kind === "Quotation" ? "quotation_drafted" : "invoice_drafted", `${kind} draft created`, actor),
        ];
        try {
          await env.DB.batch(statements);
        } catch (error) {
          if (kind === "Invoice" && sourceDocumentId) {
            const duplicate = await env.DB.prepare("SELECT id, reference FROM documents WHERE source_document_id = ? AND kind = 'Invoice' LIMIT 1").bind(sourceDocumentId).first<{ id: string; reference: string | null }>();
            if (duplicate) return json({ error: `An invoice (${duplicate.reference || duplicate.id}) has already been drafted from this quotation.` }, 409, origin);
          }
          throw error;
        }
        const item = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
        const lines = await env.DB.prepare("SELECT id, line_order, description, quantity, unit, unit_price_cents, line_total_cents FROM document_line_items WHERE document_id = ? ORDER BY line_order").bind(id).all();
        return json({ item, lines: lines.results }, 201, origin);
      }

      if (commercialDetailMatch && request.method === "GET") {
        const item = await env.DB.prepare("SELECT * FROM documents WHERE id = ? AND reference IS NOT NULL").bind(commercialDetailMatch[1]).first();
        if (!item) return json({ error: "Commercial document not found." }, 404, origin);
        const lines = await env.DB.prepare("SELECT id, line_order, description, quantity, unit, unit_price_cents, line_total_cents FROM document_line_items WHERE document_id = ? ORDER BY line_order").bind(commercialDetailMatch[1]).all();
        return json({ item, lines: lines.results }, 200, origin);
      }

      if (commercialStatusMatch && request.method === "PATCH") {
        const body = await readJson(request);
        const status = body ? textField(body, "status", 32) : null;
        const current = await env.DB.prepare("SELECT id, customer_id, kind, status, reference FROM documents WHERE id = ? AND reference IS NOT NULL").bind(commercialStatusMatch[1]).first<{ id: string; customer_id: string | null; kind: string; status: string; reference: string }>();
        if (!current) return json({ error: "Commercial document not found." }, 404, origin);
        const allowed = current.kind === "Quotation" ? ["Draft", "Sent", "Accepted", "Declined", "Expired", "Cancelled"] : ["Draft", "Sent", "Overdue", "Cancelled"];
        if (!status || !allowed.includes(status)) return json({ error: "Invalid status for this commercial document." }, 400, origin);
        await env.DB.prepare("UPDATE documents SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(status, current.id).run();
        if (current.customer_id) await env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) VALUES (?, ?, 'document', ?, 'document_status_changed', ?, ?)").bind(newId("ACT"), current.customer_id, current.id, `${current.reference} status changed to ${status}`, actor).run();
        const item = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(current.id).first();
        return json({ item }, 200, origin);
      }

      // Authenticated scheduling calendar API backed by Cloudflare D1.
      if (url.pathname === "/api/admin/schedules" && request.method === "GET") {
        const from = (url.searchParams.get("from") || "").slice(0, 30);
        const to = (url.searchParams.get("to") || "").slice(0, 30);
        const result = await env.DB.prepare("SELECT * FROM schedules WHERE (? = '' OR scheduled_start >= ?) AND (? = '' OR scheduled_start < ?) ORDER BY scheduled_start ASC LIMIT 500").bind(from, from, to, to).all();
        return json({ items: result.results }, 200, origin);
      }
      if (url.pathname === "/api/admin/schedules" && request.method === "POST") {
        const body = await readJson(request);
        if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
        const title = textField(body, "title", 180), service = textField(body, "service", 160);
        const customer = textField(body, "customer_name", 160) ?? "", area = textField(body, "area", 160) ?? "";
        const assigned = textField(body, "assigned_to", 160) ?? "", start = textField(body, "scheduled_start", 40), end = textField(body, "scheduled_end", 40);
        const notes = textField(body, "notes", 4000) ?? "", status = textField(body, "status", 24) ?? "Scheduled";
        const allowed = ["Scheduled", "Confirmed", "In progress", "Completed", "Cancelled"];
        if (!title || !service || !start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start) || !allowed.includes(status)) return json({ error: "Provide a title, service, valid start/end times and a supported status." }, 400, origin);
        const id = newId("SCH");
        await env.DB.prepare("INSERT INTO schedules (id,title,customer_name,service,area,assigned_to,scheduled_start,scheduled_end,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(id,title,customer,service,area,assigned,start,end,status,notes,actor).run();
        const item = await env.DB.prepare("SELECT * FROM schedules WHERE id = ?").bind(id).first();
        return json({ item }, 201, origin);
      }
      const scheduleMatch = url.pathname.match(new RegExp("^/api/admin/schedules/([A-Za-z0-9-]+)$"));
      if (scheduleMatch && request.method === "PATCH") {
        const body = await readJson(request);
        if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
        const current = await env.DB.prepare("SELECT * FROM schedules WHERE id = ?").bind(scheduleMatch[1]).first<Record<string, unknown>>();
        if (!current) return json({ error: "Appointment not found." }, 404, origin);
        const field = (key: string, max: number, fallback: string) => body[key] === undefined ? fallback : textField(body, key, max);
        const title=field("title",180,String(current.title)), customer=field("customer_name",160,String(current.customer_name)), service=field("service",160,String(current.service));
        const area=field("area",160,String(current.area)), assigned=field("assigned_to",160,String(current.assigned_to)), start=field("scheduled_start",40,String(current.scheduled_start));
        const end=field("scheduled_end",40,String(current.scheduled_end)), notes=field("notes",4000,String(current.notes)), status=field("status",24,String(current.status));
        const allowed = ["Scheduled", "Confirmed", "In progress", "Completed", "Cancelled"];
        if (!title || !service || !start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end)<=Date.parse(start) || !status || !allowed.includes(status)) return json({ error: "Invalid appointment details or status." },400,origin);
        await env.DB.prepare("UPDATE schedules SET title=?,customer_name=?,service=?,area=?,assigned_to=?,scheduled_start=?,scheduled_end=?,status=?,notes=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(title,customer,service,area,assigned,start,end,status,notes,scheduleMatch[1]).run();
        const item=await env.DB.prepare("SELECT * FROM schedules WHERE id=?").bind(scheduleMatch[1]).first();
        return json({item},200,origin);
      }
      if (scheduleMatch && request.method === "DELETE") {
        const result=await env.DB.prepare("DELETE FROM schedules WHERE id=?").bind(scheduleMatch[1]).run();
        if (!result.meta.changes) return json({error:"Appointment not found."},404,origin);
        return json({deleted:true},200,origin);
      }

      const enquiryConversionMatch = url.pathname.match(/^\/api\/admin\/enquiries\/([A-Za-z0-9-]+)\/convert-to-customer$/);
      if (enquiryConversionMatch && request.method === "POST") {
        const enquiryId = enquiryConversionMatch[1];
        const enquiry = await env.DB.prepare(
          "SELECT id, customer_name, phone, email, service, area, details, status, customer_id FROM enquiries WHERE id = ?"
        ).bind(enquiryId).first<{
          id: string; customer_name: string; phone: string; email: string;
          service: string; area: string; details: string; status: string; customer_id: string | null;
        }>();
        if (!enquiry) return json({ error: "Enquiry not found." }, 404, origin);

        const mapping = await env.DB.prepare(
          "SELECT customer_id FROM enquiry_customer_links WHERE enquiry_id = ?"
        ).bind(enquiryId).first<{ customer_id: string }>();
        if (mapping) {
          const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(mapping.customer_id).first<Record<string, unknown>>();
          if (!customer) return json({ error: "The linked CRM customer could not be found." }, 409, origin);
          await env.DB.prepare("UPDATE enquiries SET customer_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id IS NULL").bind(mapping.customer_id, enquiryId).run();
          return json({ item: { ...customer, customer_id: mapping.customer_id }, enquiry: { ...enquiry, customer_id: mapping.customer_id } }, 200, origin);
        }

        if (enquiry.customer_id) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO enquiry_customer_links (enquiry_id, customer_id, linked_by) VALUES (?, ?, ?)"
          ).bind(enquiryId, enquiry.customer_id, actor).run();
          const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(enquiry.customer_id).first<Record<string, unknown>>();
          if (!customer) return json({ error: "The enquiry references a missing CRM customer." }, 409, origin);
          return json({ item: { ...customer, customer_id: enquiry.customer_id }, enquiry }, 200, origin);
        }

        const email = String(enquiry.email || "").trim().toLowerCase();
        const normalisePhone = (value: string) => value.replace(/\D/g, "").replace(/^27/, "0");
        const phone = normalisePhone(String(enquiry.phone || ""));
        const phoneTail = phone.slice(-9);
        const candidates = await env.DB.prepare(
          "SELECT id, display_name, primary_phone, primary_email FROM customers WHERE (? <> '' AND lower(primary_email) = ?) OR (? <> '' AND primary_phone LIKE '%' || ? || '%') ORDER BY updated_at DESC LIMIT 200"
        ).bind(email, email, phoneTail, phoneTail).all<{
          id: string; display_name: string; primary_phone: string; primary_email: string;
        }>();
        const matches = candidates.results.filter((candidate) =>
          (email && String(candidate.primary_email || "").trim().toLowerCase() === email) ||
          (phone && normalisePhone(String(candidate.primary_phone || "")) === phone)
        );
        if (matches.length > 1) {
          return json({ error: "More than one CRM customer matches this enquiry. Resolve the duplicate candidates in CRM before converting it." }, 409, origin);
        }

        const matched = matches[0];
        const candidateCustomerId = matched?.id || newId("CUS");
        const statements = [
          ...(!matched ? [env.DB.prepare(
            "INSERT INTO customers (id, customer_type, display_name, company_name, primary_phone, primary_email, billing_address, service_address, notes, created_by) SELECT ?, 'Individual', ?, '', ?, ?, '', ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM enquiry_customer_links WHERE enquiry_id = ?)"
          ).bind(candidateCustomerId, enquiry.customer_name, enquiry.phone || "", enquiry.email || "", enquiry.area || "", "Created from enquiry " + enquiryId + (enquiry.details ? "\n" + enquiry.details : ""), actor, enquiryId)] : []),
          env.DB.prepare(
            "INSERT OR IGNORE INTO enquiry_customer_links (enquiry_id, customer_id, linked_by) VALUES (?, ?, ?)"
          ).bind(enquiryId, candidateCustomerId, actor),
          env.DB.prepare(
            "UPDATE enquiries SET customer_id = (SELECT customer_id FROM enquiry_customer_links WHERE enquiry_id = ?), status = CASE WHEN status = 'New' THEN 'Contacted' ELSE status END, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND customer_id IS NULL"
          ).bind(enquiryId, enquiryId),
          env.DB.prepare(
            "INSERT INTO customer_activity (id, customer_id, entity_type, entity_id, event_type, summary, actor) SELECT ?, customer_id, 'enquiry', ?, 'enquiry_linked', ?, ? FROM enquiry_customer_links WHERE enquiry_id = ? AND NOT EXISTS (SELECT 1 FROM customer_activity WHERE customer_id = ? AND entity_type = 'enquiry' AND entity_id = ? AND event_type = 'enquiry_linked')"
          ).bind(newId("ACT"), enquiryId, "Enquiry linked to CRM customer: " + enquiry.customer_name, actor, enquiryId, candidateCustomerId, enquiryId),
        ];
        await env.DB.batch(statements);
        const linked = await env.DB.prepare(
          "SELECT e.id, e.customer_id, e.status, m.customer_id AS mapped_customer_id FROM enquiries e JOIN enquiry_customer_links m ON m.enquiry_id = e.id WHERE e.id = ?"
        ).bind(enquiryId).first<{ id: string; customer_id: string | null; status: string; mapped_customer_id: string }>();
        if (!linked || linked.customer_id !== linked.mapped_customer_id) {
          return json({ error: "The CRM customer link could not be verified. Refresh the enquiry before retrying." }, 409, origin);
        }
        const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(linked.customer_id).first<Record<string, unknown>>();
        if (!customer) return json({ error: "CRM customer record could not be loaded after conversion." }, 500, origin);
        return json({ item: { ...customer, customer_id: linked.customer_id }, enquiry: linked }, 200, origin);
      }

      const collectionMatch = url.pathname.match(/^\/api\/admin\/(enquiries|jobs|documents)$/);
      if (collectionMatch) {
        const collection = collectionMatch[1] as Collection;
        if (request.method === "GET") {
          const result = await env.DB.prepare(`SELECT * FROM ${collection} ORDER BY created_at DESC LIMIT 200`).all();
          return json({ items: result.results }, 200, origin);
        }
        if (request.method === "POST") {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const customer = textField(body, "customer_name", 160);
          const service = textField(body, "service", 160);
          const area = textField(body, "area", 160) ?? "";
          const details = textField(body, "details", 4000) ?? "";
          if (!customer || !service) return json({ error: "customer_name and service are required." }, 400, origin);
          const id = newId(collection === "enquiries" ? "EN" : collection === "jobs" ? "J" : (body.kind === "Invoice" ? "INV" : "QT"));
          if (collection === "enquiries") {
            const phone = textField(body, "phone", 40) ?? "";
            const email = textField(body, "email", 254) ?? "";
            await env.DB.prepare("INSERT INTO enquiries (id, customer_name, phone, email, service, area, details, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, customer, phone, email, service, area, details, actor).run();
          } else if (collection === "jobs") {
            await env.DB.prepare("INSERT INTO jobs (id, customer_name, service, area, details, created_by) VALUES (?, ?, ?, ?, ?, ?)").bind(id, customer, service, area, details, actor).run();
          } else {
            const kind = body.kind;
            const amount = body.amount;
            if ((kind !== "Quotation" && kind !== "Invoice") || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > 100000000) {
              return json({ error: "kind must be Quotation or Invoice and amount must be a valid non-negative ZAR amount." }, 400, origin);
            }
            await env.DB.prepare("INSERT INTO documents (id, customer_name, kind, amount_cents, created_by) VALUES (?, ?, ?, ?, ?)").bind(id, customer, kind, Math.round(amount * 100), actor).run();
          }
          const item = await env.DB.prepare(`SELECT * FROM ${collection} WHERE id = ?`).bind(id).first();
          return json({ item }, 201, origin);
        }
      }

      const recordMatch = url.pathname.match(/^\/api\/admin\/(enquiries|jobs|documents)\/([A-Za-z0-9-]+)(?:\/status)?$/);
      if (recordMatch && (request.method === "PATCH" || (request.method === "POST" && url.pathname.endsWith("/status")))) {
        const collection = recordMatch[1] as Collection;
        const id = recordMatch[2];
        const body = await readJson(request);
        if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
        const status = textField(body, "status", 32);
        if (!status || !validStatus(collection, status)) return json({ error: "Invalid status for this module." }, 400, origin);
        const result = await env.DB.prepare(`UPDATE ${collection} SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(status, id).run();
        if (!result.meta.changes) return json({ error: "Record not found." }, 404, origin);
        const item = await env.DB.prepare(`SELECT * FROM ${collection} WHERE id = ?`).bind(id).first();
        return json({ item }, 200, origin);
      }


      const customersPath = url.pathname === "/api/admin/customers" || url.pathname.startsWith("/api/admin/customers/");
      if (customersPath) {
        const customerId = url.pathname.split("/")[4] || undefined;
        const contactsPath = customerId && url.pathname === `/api/admin/customers/${customerId}/contacts`;
        const activityPath = customerId && url.pathname === `/api/admin/customers/${customerId}/activity`;

        if (request.method === "GET" && !customerId) {
          const query = (url.searchParams.get("q") || "").trim().slice(0, 120);
          const status = url.searchParams.get("status");
          const search = "%" + query + "%";
          const result = await env.DB.prepare(
            "SELECT c.*, (SELECT COUNT(*) FROM enquiries e WHERE e.customer_id = c.id) AS enquiry_count, (SELECT COUNT(*) FROM jobs j WHERE j.customer_id = c.id) AS job_count, (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id) AS document_count FROM customers c WHERE (? = '' OR c.display_name LIKE ? ESCAPE '\\' OR c.company_name LIKE ? ESCAPE '\\' OR c.primary_phone LIKE ? ESCAPE '\\' OR c.primary_email LIKE ? ESCAPE '\\') AND (? IS NULL OR c.status = ?) ORDER BY c.updated_at DESC LIMIT 200"
          ).bind(query, search, search, search, search, status, status).all();
          return json({ items: result.results }, 200, origin);
        }

        if (request.method === "POST" && !customerId) {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const displayName = textField(body, "display_name", 160);
          const customerType = body.customer_type;
          if (!displayName || !["Individual", "Business", "Body corporate"].includes(String(customerType || "Individual"))) {
            return json({ error: "A customer name and valid customer type are required." }, 400, origin);
          }
          const id = newId("CUS");
          const values = [
            id, customerType || "Individual", displayName,
            textField(body, "company_name", 160) ?? "",
            textField(body, "primary_phone", 40) ?? "",
            textField(body, "primary_email", 254) ?? "",
            textField(body, "billing_address", 1000) ?? "",
            textField(body, "service_address", 1000) ?? "",
            textField(body, "notes", 4000) ?? "", actor
          ];
          await env.DB.prepare("INSERT INTO customers (id, customer_type, display_name, company_name, primary_phone, primary_email, billing_address, service_address, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...values).run();
          await env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, event_type, summary, actor) VALUES (?, ?, 'customer', 'created', 'Customer record created', ?)").bind(newId("ACT"), id, actor).run();
          const item = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(id).first();
          return json({ item }, 201, origin);
        }

        if (request.method === "GET" && customerId && !contactsPath && !activityPath) {
          const item = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first();
          if (!item) return json({ error: "Customer not found." }, 404, origin);
          const [contacts, activity, enquiries, jobs, documents] = await Promise.all([
            env.DB.prepare("SELECT * FROM customer_contacts WHERE customer_id = ? ORDER BY is_primary DESC, full_name COLLATE NOCASE").bind(customerId).all(),
            env.DB.prepare("SELECT * FROM customer_activity WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100").bind(customerId).all(),
            env.DB.prepare("SELECT id, service, area, status, created_at FROM enquiries WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50").bind(customerId).all(),
            env.DB.prepare("SELECT id, service, area, status, created_at FROM jobs WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50").bind(customerId).all(),
            env.DB.prepare("SELECT id, kind, amount_cents, status, created_at FROM documents WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50").bind(customerId).all()
          ]);
          return json({ item, contacts: contacts.results, activity: activity.results, enquiries: enquiries.results, jobs: jobs.results, documents: documents.results }, 200, origin);
        }

        if (request.method === "PATCH" && customerId && !contactsPath && !activityPath) {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const current = await env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(customerId).first();
          if (!current) return json({ error: "Customer not found." }, 404, origin);
          const allowedTypes = ["Individual", "Business", "Body corporate"];
          const type = body.customer_type === undefined ? null : body.customer_type;
          if (type !== null && !allowedTypes.includes(String(type))) return json({ error: "Invalid customer type." }, 400, origin);
          const status = body.status === undefined ? null : body.status;
          if (status !== null && status !== "Active" && status !== "Archived") return json({ error: "Invalid customer status." }, 400, origin);
          const fields = ["display_name", "company_name", "primary_phone", "primary_email", "billing_address", "service_address", "notes"] as const;
          const limits: Record<string, number> = { display_name: 160, company_name: 160, primary_phone: 40, primary_email: 254, billing_address: 1000, service_address: 1000, notes: 4000 };
          const updates: string[] = [];
          const values: (string | null)[] = [];
          if (type !== null) { updates.push("customer_type = ?"); values.push(String(type)); }
          for (const field of fields) {
            if (body[field] !== undefined) {
              const value = textField(body, field, limits[field]);
              if (value === null || (field === "display_name" && !value)) return json({ error: `Invalid ${field} value.` }, 400, origin);
              updates.push(`${field} = ?`); values.push(value);
            }
          }
          if (status !== null) {
            updates.push("status = ?", "archived_at = ?");
            values.push(String(status), status === "Archived" ? new Date().toISOString() : null);
          }
          if (updates.length) {
            updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
            await env.DB.prepare(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`).bind(...values, customerId).run();
            await env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, event_type, summary, actor) VALUES (?, ?, 'customer', 'updated', 'Customer record updated', ?)").bind(newId("ACT"), customerId, actor).run();
          }
          const item = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first();
          return json({ item }, 200, origin);
        }

        if (contactsPath && request.method === "POST") {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const fullName = textField(body, "full_name", 160);
          if (!fullName) return json({ error: "Contact name is required." }, 400, origin);
          const customer = await env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(customerId).first();
          if (!customer) return json({ error: "Customer not found." }, 404, origin);
          const id = newId("CON");
          const isPrimary = body.is_primary === true ? 1 : 0;
          if (isPrimary) await env.DB.prepare("UPDATE customer_contacts SET is_primary = 0 WHERE customer_id = ?").bind(customerId).run();
          await env.DB.prepare("INSERT INTO customer_contacts (id, customer_id, full_name, role, phone, email, is_primary, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, customerId, fullName, textField(body, "role", 100) ?? "", textField(body, "phone", 40) ?? "", textField(body, "email", 254) ?? "", isPrimary, textField(body, "notes", 1000) ?? "").run();
          const item = await env.DB.prepare("SELECT * FROM customer_contacts WHERE id = ?").bind(id).first();
          await env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, event_type, summary, actor) VALUES (?, ?, 'customer', 'contact_added', ?, ?)").bind(newId("ACT"), customerId, `Contact added: ${fullName}`, actor).run();
          return json({ item }, 201, origin);
        }

        if (activityPath && request.method === "POST") {
          const body = await readJson(request);
          const summary = body ? textField(body, "summary", 500) : null;
          if (!summary) return json({ error: "A note summary is required." }, 400, origin);
          const customer = await env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(customerId).first();
          if (!customer) return json({ error: "Customer not found." }, 404, origin);
          const details = body?.details === undefined ? "{}" : JSON.stringify(body.details);
          if (details.length > 10000) return json({ error: "Note details exceed 10 KB." }, 413, origin);
          const id = newId("ACT");
          await env.DB.prepare("INSERT INTO customer_activity (id, customer_id, entity_type, event_type, summary, details_json, actor) VALUES (?, ?, 'note', 'note_added', ?, ?, ?)").bind(id, customerId, summary, details, actor).run();
          const item = await env.DB.prepare("SELECT * FROM customer_activity WHERE id = ?").bind(id).first();
          return json({ item }, 201, origin);
        }
      }

      const projectsPath = url.pathname === "/api/admin/projects" || url.pathname.startsWith("/api/admin/projects/");
      if (projectsPath) {
        const projectId = url.pathname.split("/")[4] || undefined;
        if (request.method === "GET" && !projectId) {
          const result = await env.DB.prepare("SELECT id, title, service, area, description, status, before_media_id, after_media_id, created_at, updated_at FROM projects ORDER BY created_at DESC LIMIT 200").all();
          return json({ items: result.results }, 200, origin);
        }
        if (request.method === "POST" && !projectId) {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const title = textField(body, "title", 160);
          const service = textField(body, "service", 160);
          const area = textField(body, "area", 160) ?? "";
          const description = textField(body, "description", 4000) ?? "";
          const beforeId = body.before_media_id === null || body.before_media_id === "" ? null : textField(body, "before_media_id", 64);
          const afterId = body.after_media_id === null || body.after_media_id === "" ? null : textField(body, "after_media_id", 64);
          if (!title || !service) return json({ error: "Project title and service are required." }, 400, origin);
          for (const mediaId of [beforeId, afterId]) {
            if (mediaId) {
              const mediaRow = await env.DB.prepare("SELECT id FROM media WHERE id = ?").bind(mediaId).first();
              if (!mediaRow) return json({ error: "A selected project photograph could not be found in the media library." }, 400, origin);
            }
          }
          const id = newId("PRJ");
          await env.DB.prepare("INSERT INTO projects (id, title, service, area, description, before_media_id, after_media_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(id, title, service, area, description, beforeId, afterId, actor).run();
          const item = await env.DB.prepare("SELECT id, title, service, area, description, status, before_media_id, after_media_id, created_at, updated_at FROM projects WHERE id = ?").bind(id).first();
          return json({ item }, 201, origin);
        }
        if (request.method === "PATCH" && projectId) {
          const body = await readJson(request);
          const status = body ? textField(body, "status", 32) : null;
          if (!status || !["Draft", "In progress", "Completed", "Published", "Archived"].includes(status)) return json({ error: "Invalid project status." }, 400, origin);
          const result = await env.DB.prepare("UPDATE projects SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(status, projectId).run();
          if (!result.meta.changes) return json({ error: "Project not found." }, 404, origin);
          const item = await env.DB.prepare("SELECT id, title, service, area, description, status, before_media_id, after_media_id, created_at, updated_at FROM projects WHERE id = ?").bind(projectId).first();
          return json({ item }, 200, origin);
        }
      }

      if (url.pathname === "/api/admin/content" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT content_key, content_json, updated_by, updated_at FROM site_content ORDER BY content_key").all();
        return json({ items: result.results }, 200, origin);
      }
      if (url.pathname === "/api/admin/content" && request.method === "PUT") {
        const body = await readJson(request);
        const key = body ? textField(body, "key", 100) : null;
        const value = body?.value;
        if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || value === undefined) return json({ error: "Provide a valid content key and value." }, 400, origin);
        if ((key.startsWith("cms_draft.") || key.startsWith("cms_revision.")) && env.CMS_WRITE_ENABLED !== "true") {
          return json({ error: "CMS draft writes are disabled on this Worker environment. Use the isolated CMS preview for draft editing." }, 403, origin);
        }
        const serialized = JSON.stringify(value);
        if (serialized.length > 50000) return json({ error: "Content value exceeds 50 KB." }, 413, origin);
        await env.DB.prepare("INSERT INTO site_content (content_key, content_json, updated_by) VALUES (?, ?, ?) ON CONFLICT(content_key) DO UPDATE SET content_json = excluded.content_json, updated_by = excluded.updated_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(key, serialized, actor).run();
        return json({ saved: true, key }, 200, origin);
      }

      // Versioned CMS publishing: draft -> independent approval -> public revision.
      if (url.pathname === "/api/admin/publishing" && request.method === "GET") {
        const [requests, current, history, audit] = await Promise.all([
          env.DB.prepare("SELECT id, module_key, slug, status, requested_by, reviewed_by, review_note, created_at, reviewed_at FROM cms_publication_requests ORDER BY created_at DESC LIMIT 100").all(),
          env.DB.prepare("SELECT s.module_key, s.slug, s.publication_id, s.updated_at, p.content_hash, p.published_by, p.published_at FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id ORDER BY s.module_key").all(),
          env.DB.prepare("SELECT id, module_key, slug, source_publication_id, published_by, published_at FROM cms_publications ORDER BY published_at DESC LIMIT 100").all(),
          env.DB.prepare("SELECT id, module_key, request_id, publication_id, action, actor, details_json, created_at FROM cms_publication_audit ORDER BY created_at DESC LIMIT 100").all()
        ]);
        return json({ requests: requests.results, current: current.results, history: history.results, audit: audit.results }, 200, origin);
      }

      if (url.pathname === "/api/admin/publishing/request" && request.method === "POST") {
        if (env.CMS_WRITE_ENABLED !== "true") return json({ error: "CMS publication requests are disabled on this Worker environment." }, 403, origin);
        const body = await readJson(request);
        const moduleKey = body ? textField(body, "moduleKey", 80) : null;
        if (!moduleKey || !/^[a-zA-Z0-9_-]+$/.test(moduleKey)) return json({ error: "Provide a valid CMS module key." }, 400, origin);
        const draftRow = await env.DB.prepare("SELECT content_json FROM site_content WHERE content_key = ?").bind("cms_draft." + moduleKey).first<{ content_json: string }>();
        if (!draftRow) return json({ error: "Save a CMS draft before requesting publication." }, 409, origin);
        let page: Record<string, unknown>;
        try {
          const parsed: unknown = JSON.parse(draftRow.content_json);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
          page = parsed as Record<string, unknown>;
        } catch { return json({ error: "The saved draft is not valid JSON." }, 422, origin); }
        const title = textField(page, "title", 160);
        const rawSlug = textField(page, "slug", 160);
        const slug = (rawSlug || (moduleKey === "home" ? "home" : moduleKey)).replace(/^\/+|\/+$/g, "");
        const blocks = page.blocks;
        if (page.moduleKey !== moduleKey || !title || !slug || !/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/i.test(slug)) {
          return json({ error: "The draft must have a matching module key, page title and safe URL slug." }, 422, origin);
        }
        if (!Array.isArray(blocks) || blocks.length > 100) return json({ error: "The draft must contain a valid content block list (maximum 100 blocks)." }, 422, origin);
        const serialized = JSON.stringify(page);
        if (serialized.length > 50000) return json({ error: "The draft exceeds the 50 KB publication limit." }, 413, origin);
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized));
        const contentHash = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
        const requestId = crypto.randomUUID();
        try {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO cms_publication_requests (id, module_key, slug, content_json, content_hash, requested_by) VALUES (?, ?, ?, ?, ?, ?)").bind(requestId, moduleKey, slug, serialized, contentHash, actor),
            env.DB.prepare("INSERT INTO cms_publication_audit (id, module_key, request_id, action, actor, details_json) VALUES (?, ?, ?, 'publish_requested', ?, ?)").bind(crypto.randomUUID(), moduleKey, requestId, actor, JSON.stringify({ slug, contentHash }))
          ]);
        } catch {
          return json({ error: "A publication request is already pending for this module, or could not be created." }, 409, origin);
        }
        return json({ requested: true, requestId, moduleKey, slug, contentHash, approvalRequired: true }, 201, origin);
      }

      if (url.pathname === "/api/admin/publishing/approve" && request.method === "POST") {
        if (env.CMS_WRITE_ENABLED !== "true") return json({ error: "CMS publication approvals are disabled on this Worker environment." }, 403, origin);
        const body = await readJson(request);
        const requestId = body ? textField(body, "requestId", 64) : null;
        const decision = body ? textField(body, "decision", 16) : null;
        const note = body ? (textField(body, "note", 1000) ?? "") : "";
        if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId) || (decision !== "approve" && decision !== "reject")) {
          return json({ error: "Provide a valid request ID and approve/reject decision." }, 400, origin);
        }
        const publicationRequest = await env.DB.prepare("SELECT * FROM cms_publication_requests WHERE id = ? AND status = 'Pending'").bind(requestId).first<{
          id: string; module_key: string; slug: string; content_json: string; content_hash: string; requested_by: string;
        }>();
        if (!publicationRequest) return json({ error: "This publication request is no longer pending." }, 409, origin);
        if (publicationRequest.requested_by.trim().toLowerCase() === actor.trim().toLowerCase()) {
          return json({ error: "A second authorised administrator must approve or reject this request. The requester cannot approve their own publication." }, 403, origin);
        }
        if (decision === "reject") {
          const rejected = await env.DB.batch([
            env.DB.prepare("UPDATE cms_publication_requests SET status = 'Rejected', reviewed_by = ?, review_note = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'Pending'").bind(actor, note, requestId),
            env.DB.prepare("INSERT INTO cms_publication_audit (id, module_key, request_id, action, actor, details_json) VALUES (?, ?, ?, 'publish_rejected', ?, ?)").bind(crypto.randomUUID(), publicationRequest.module_key, requestId, actor, JSON.stringify({ note }))
          ]);
          if (!rejected[0]?.meta?.changes) return json({ error: "The publication request was processed by another administrator." }, 409, origin);
          return json({ rejected: true, requestId }, 200, origin);
        }
        const claim = await env.DB.prepare("UPDATE cms_publication_requests SET status = 'Approved', reviewed_by = ?, review_note = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'Pending'").bind(actor, note, requestId).run();
        if (!claim.meta.changes) return json({ error: "The publication request was processed by another administrator." }, 409, origin);
        const publicationId = crypto.randomUUID();
        try {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO cms_publications (id, module_key, slug, content_json, content_hash, source_request_id, published_by) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(publicationId, publicationRequest.module_key, publicationRequest.slug, publicationRequest.content_json, publicationRequest.content_hash, requestId, actor),
            env.DB.prepare("INSERT INTO cms_publication_state (module_key, slug, publication_id, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(module_key) DO UPDATE SET slug = excluded.slug, publication_id = excluded.publication_id, updated_by = excluded.updated_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(publicationRequest.module_key, publicationRequest.slug, publicationId, actor),
            env.DB.prepare("INSERT INTO cms_publication_audit (id, module_key, request_id, publication_id, action, actor, details_json) VALUES (?, ?, ?, ?, 'publish_approved', ?, ?)").bind(crypto.randomUUID(), publicationRequest.module_key, requestId, publicationId, actor, JSON.stringify({ note, contentHash: publicationRequest.content_hash })),
          ]);
        } catch (error) {
          await env.DB.prepare("UPDATE cms_publication_requests SET status = 'Pending', reviewed_by = NULL, review_note = '', reviewed_at = NULL WHERE id = ? AND status = 'Approved'").bind(requestId).run();
          throw error;
        }
        return json({ published: true, requestId, publicationId, moduleKey: publicationRequest.module_key, slug: publicationRequest.slug }, 200, origin);
      }

      if (url.pathname === "/api/admin/publishing/rollback" && request.method === "POST") {
        if (env.CMS_WRITE_ENABLED !== "true") return json({ error: "CMS rollback is disabled on this Worker environment." }, 403, origin);
        const body = await readJson(request);
        const moduleKey = body ? textField(body, "moduleKey", 80) : null;
        const targetId = body ? textField(body, "publicationId", 64) : null;
        const note = body ? (textField(body, "note", 1000) ?? "") : "";
        if (!moduleKey || !/^[a-zA-Z0-9_-]+$/.test(moduleKey) || !targetId || !/^[0-9a-f-]{36}$/i.test(targetId)) {
          return json({ error: "Provide a valid module key and previous publication ID." }, 400, origin);
        }
        const [current, target] = await Promise.all([
          env.DB.prepare("SELECT p.published_by FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id WHERE s.module_key = ?").bind(moduleKey).first<{ published_by: string }>(),
          env.DB.prepare("SELECT id, module_key, slug, content_json, content_hash FROM cms_publications WHERE id = ? AND module_key = ?").bind(targetId, moduleKey).first<{ id: string; module_key: string; slug: string; content_json: string; content_hash: string }>()
        ]);
        if (!current) return json({ error: "This module has no published version to roll back." }, 409, origin);
        if (!target) return json({ error: "The selected previous publication does not belong to this module." }, 404, origin);
        if (target.id === (await env.DB.prepare("SELECT publication_id FROM cms_publication_state WHERE module_key = ?").bind(moduleKey).first<{ publication_id: string }>())?.publication_id) {
          return json({ error: "This version is already live." }, 409, origin);
        }
        if (current.published_by.trim().toLowerCase() === actor.trim().toLowerCase()) {
          return json({ error: "A different authorised administrator must confirm this rollback." }, 403, origin);
        }
        const rollbackId = crypto.randomUUID();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_publications (id, module_key, slug, content_json, content_hash, source_publication_id, published_by) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(rollbackId, moduleKey, target.slug, target.content_json, target.content_hash, target.id, actor),
          env.DB.prepare("INSERT INTO cms_publication_state (module_key, slug, publication_id, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(module_key) DO UPDATE SET slug = excluded.slug, publication_id = excluded.publication_id, updated_by = excluded.updated_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").bind(moduleKey, target.slug, rollbackId, actor),
          env.DB.prepare("INSERT INTO cms_publication_audit (id, module_key, publication_id, action, actor, details_json) VALUES (?, ?, ?, 'rollback', ?, ?)").bind(crypto.randomUUID(), moduleKey, rollbackId, actor, JSON.stringify({ restoredFrom: target.id, note }))
        ]);
        return json({ rolledBack: true, moduleKey, publicationId: rollbackId, restoredFrom: target.id, slug: target.slug }, 200, origin);
      }

      // Generic, authenticated CRUD for maintenance, suppliers, inventory and finance.
      const operationMatch = url.pathname.match(/^\/api\/admin\/operations\/(maintenance|suppliers|inventory|financials)(?:\/([A-Za-z0-9-]+))?$/);
      if (operationMatch) {
        const category = operationMatch[1];
        const id = operationMatch[2];
        if (request.method === "GET" && !id) {
          const result = await env.DB.prepare("SELECT id, category, title, details, amount_cents, quantity, unit, due_date, status, contact, created_at FROM operation_records WHERE category = ? ORDER BY created_at DESC LIMIT 500").bind(category).all();
          return json({ items: result.results }, 200, origin);
        }
        if (request.method === "POST" && !id) {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const title = textField(body, "title", 180), details = textField(body, "details", 2000) ?? "";
          const unit = textField(body, "unit", 80) ?? "", dueDate = textField(body, "due_date", 40) ?? "";
          const contact = textField(body, "contact", 180) ?? "", status = textField(body, "status", 40);
          const amount = Number(body.amount), quantity = Number(body.quantity ?? 0);
          const allowed: Record<string,string[]> = { maintenance:["Active","Due","Paused","Completed","Cancelled"], suppliers:["Active","Pending approval","On hold","Inactive"], inventory:["In stock","Low stock","Out of stock","Discontinued"], financials:["Pending","Approved","Paid","Reconciled","Cancelled"] };
          if (!title || !status || !allowed[category].includes(status) || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(quantity) || quantity < 0) return json({ error: "Provide a title, valid amount, quantity and supported status." }, 400, origin);
          if (dueDate && !Number.isFinite(Date.parse(dueDate))) return json({ error: "Invalid date." }, 400, origin);
          const newRecordId = newId("OPS");
          await env.DB.prepare("INSERT INTO operation_records (id,category,title,details,amount_cents,quantity,unit,due_date,status,contact,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(newRecordId,category,title,details,Math.round(amount*100),quantity,unit,dueDate,status,contact,actor).run();
          const item = await env.DB.prepare("SELECT id,category,title,details,amount_cents,quantity,unit,due_date,status,contact,created_at FROM operation_records WHERE id = ?").bind(newRecordId).first();
          return json({ item }, 201, origin);
        }
        if (request.method === "PATCH" && id) {
          const body = await readJson(request);
          if (!body) return json({ error: "Request body must be a JSON object." }, 400, origin);
          const current = await env.DB.prepare("SELECT * FROM operation_records WHERE id = ? AND category = ?").bind(id,category).first<Record<string,unknown>>();
          if (!current) return json({ error: "Record not found." }, 404, origin);
          const val = (key:string,max:number,fallback:string) => body[key] === undefined ? fallback : textField(body,key,max);
          const title=val("title",180,String(current.title)), details=val("details",2000,String(current.details)), unit=val("unit",80,String(current.unit)), dueDate=val("due_date",40,String(current.due_date)), contact=val("contact",180,String(current.contact)), status=val("status",40,String(current.status));
          const amount=body.amount === undefined ? Number(current.amount_cents)/100 : Number(body.amount);
          const quantity=body.quantity === undefined ? Number(current.quantity) : Number(body.quantity);
          const allowed: Record<string,string[]> = { maintenance:["Active","Due","Paused","Completed","Cancelled"], suppliers:["Active","Pending approval","On hold","Inactive"], inventory:["In stock","Low stock","Out of stock","Discontinued"], financials:["Pending","Approved","Paid","Reconciled","Cancelled"] };
          if (!title || details === null || unit === null || dueDate === null || contact === null || !status || !allowed[category].includes(status) || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(quantity) || quantity < 0) return json({ error: "Invalid record fields." }, 400, origin);
          await env.DB.prepare("UPDATE operation_records SET title=?,details=?,amount_cents=?,quantity=?,unit=?,due_date=?,status=?,contact=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND category=?").bind(title,details,Math.round(amount*100),quantity,unit,dueDate,status,contact,id,category).run();
          const item = await env.DB.prepare("SELECT id,category,title,details,amount_cents,quantity,unit,due_date,status,contact,created_at FROM operation_records WHERE id = ?").bind(id).first();
          return json({ item }, 200, origin);
        }
        if (request.method === "DELETE" && id) {
          const result = await env.DB.prepare("DELETE FROM operation_records WHERE id = ? AND category = ?").bind(id,category).run();
          if (!result.meta.changes) return json({ error: "Record not found." }, 404, origin);
          return json({ deleted: true }, 200, origin);
        }
      }

      return json({ error: "Not found or method not allowed." }, 404, origin);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed: documents.source_document_id")) return json({ error: "An invoice already exists for this accepted quotation." }, 409, origin);
      // Keep sensitive customer data out of logs; record only the exception message for diagnosis.
      console.error("NGMS admin API request failed", error instanceof Error ? error.message : String(error));
      return json({ error: "The request could not be completed. Check the API configuration and database migrations." }, 500, origin);
    }
  },
};
