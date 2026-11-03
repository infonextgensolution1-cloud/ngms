interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_TO?: string;
  LEAD_NOTIFY_FROM?: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://ngms-website-v4.vercel.app",
  "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev",
  "https://www.nextgensolarmaintenance.co.za",
  "https://nextgensolarmaintenance.co.za",
  "http://localhost:3000",
]);
const PUBLIC_MEDIA_SLOT_KEYS = [
  "home.hero",
  "home.service.solar",
  "home.service.painting",
  "home.service.waterproofing",
  "home.service.paving",
  "home.service.plumbing",
  "home.service.electrical",
  "home.service.pool",
  "home.service.cleaning",
  "home.project.solar",
  "home.project.exterior",
  "home.project.paving",
  "home.why",
] as const;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SERVICES = new Set([
  "Solar panel cleaning",
  "Painting & finishes",
  "Waterproofing",
  "Paving",
  "Plumbing",
  "Electrical",
  "Pool fibre lining",
  "High-pressure cleaning",
  "Other",
  "General property maintenance",
  "Body corporate / complex maintenance",
  "Other / not sure yet",
]);

function json(data: unknown, status = 200, origin: string | null = null): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "vary": "Origin",
  });
  if (origin && (ALLOWED_ORIGINS.has(origin) || (origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app")))) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "false");
    headers.set("access-control-allow-methods", "POST, OPTIONS, GET");
    headers.set("access-control-allow-headers", "Content-Type");
    headers.set("access-control-max-age", "86400");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max) return null;
  return cleaned;
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}


function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] ?? char);
}

async function notifyNewLead(env: Env, lead: {
  id: string; customer: string; phone: string; email: string;
  service: string; area: string; details: string;
}): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO || !env.LEAD_NOTIFY_FROM) {
    console.warn("Lead saved; Resend notification is not configured.");
    return false;
  }
  const safe = {
    id: escapeHtml(lead.id), customer: escapeHtml(lead.customer),
    phone: escapeHtml(lead.phone || "Not supplied"), email: escapeHtml(lead.email || "Not supplied"),
    service: escapeHtml(lead.service), area: escapeHtml(lead.area), details: escapeHtml(lead.details),
  };
  const text = [
    "New NGMS website enquiry", `Reference: ${lead.id}`, `Customer: ${lead.customer}`,
    `Phone: ${lead.phone || "Not supplied"}`, `Email: ${lead.email || "Not supplied"}`,
    `Service: ${lead.service}`, `Area: ${lead.area}`, "", "Job details:", lead.details,
  ].join("\n");
  const html = `<h2>New NGMS website enquiry</h2><p><strong>Reference:</strong> ${safe.id}</p><p><strong>Customer:</strong> ${safe.customer}</p><p><strong>Phone:</strong> ${safe.phone}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Service:</strong> ${safe.service}</p><p><strong>Area:</strong> ${safe.area}</p><p><strong>Job details:</strong></p><p>${safe.details.replace(/\n/g, "<br>")}</p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.LEAD_NOTIFY_FROM,
        to: [env.LEAD_NOTIFY_TO],
        subject: `New NGMS lead — ${lead.service} — ${lead.id}`,
        text,
        html,
      }),
    });
    if (!response.ok) {
      console.error("Resend lead notification failed", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend lead notification error", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string,
  origin: string,
): Promise<boolean> {
  if (!secret || !token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  let result: { success?: boolean; hostname?: string; action?: string; ["error-codes"]?: string[] };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!response.ok) return false;
    result = await response.json() as typeof result;
  } catch {
    return false;
  }
  return result.success === true
    && result.action === "ngms_enquiry"
    && result.hostname === new URL(origin).hostname;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "ngms-public-intake", status: "healthy" });
    }

    if (request.method === "GET" && url.pathname === "/api/public/site-content") {
      try {
        const keys = ["home.heroTitle", "home.heroAccent", "home.heroSubtitle", "website.mediaSlots"];
        const placeholders = keys.map(() => "?").join(", ");
        const result = await env.DB.prepare(
          `SELECT content_key, content_json FROM site_content WHERE content_key IN (${placeholders})`,
        ).bind(...keys).all<{ content_key: string; content_json: string }>();
        const items: Record<string, unknown> = {};
        for (const row of result.results ?? []) {
          try {
            const value: unknown = JSON.parse(row.content_json);
            if (row.content_key === "website.mediaSlots") {
              if (!value || typeof value !== "object" || Array.isArray(value)) continue;
              const map = value as Record<string, unknown>;
              const safeSlots: Record<string, string> = {};
              for (const slotKey of PUBLIC_MEDIA_SLOT_KEYS) {
                const mediaId = map[slotKey];
                if (typeof mediaId === "string" && MEDIA_ID_PATTERN.test(mediaId)) safeSlots[slotKey] = mediaId;
              }
              items[row.content_key] = safeSlots;
            } else if (typeof value === "string" && value.trim().length > 0 && value.length <= 600) {
              items[row.content_key] = value;
            }
          } catch {
            // Ignore malformed content rows and retain the static frontend defaults.
          }
        }
        // A published homepage snapshot takes precedence over the legacy headline fields.
        const homePublication = await env.DB.prepare(
          "SELECT p.content_json, p.content_hash, p.id, p.published_at FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id WHERE s.module_key = 'home' AND s.slug = 'home'",
        ).first<{ content_json: string; content_hash: string; id: string; published_at: string }>();
        if (homePublication) {
          try {
            const page = JSON.parse(homePublication.content_json) as Record<string, unknown>;
            if (typeof page.title === "string" && page.title.trim()) items["home.heroTitle"] = page.title;
            if (typeof page.summary === "string" && page.summary.trim()) items["home.heroSubtitle"] = page.summary;
            items["cms.home"] = {
              title: typeof page.title === "string" ? page.title : "",
              summary: typeof page.summary === "string" ? page.summary : "",
              seoTitle: typeof page.seoTitle === "string" ? page.seoTitle : "",
              seoDescription: typeof page.seoDescription === "string" ? page.seoDescription : "",
              blocks: Array.isArray(page.blocks) ? page.blocks : [],
              publicationId: homePublication.id,
              publishedAt: homePublication.published_at,
            };
          } catch {
            // Keep legacy homepage fields when a published snapshot is malformed.
          }
        }
        return json({ ok: true, items }, 200, origin);
      } catch {
        return json({ error: "Public website content is temporarily unavailable." }, 500, origin);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/public/pages") {
      const rawSlug = (url.searchParams.get("slug") || "").trim().replace(/^\/+|\/+$/g, "");
      if (!rawSlug || rawSlug.length > 160 || !/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/i.test(rawSlug)) {
        return json({ error: "Provide a valid published page slug." }, 400, origin);
      }
      try {
        const page = await env.DB.prepare(
          "SELECT p.id, p.module_key, p.slug, p.content_json, p.content_hash, p.published_at FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id WHERE s.slug = ? LIMIT 1",
        ).bind(rawSlug).first<{ id: string; module_key: string; slug: string; content_json: string; content_hash: string; published_at: string }>();
        if (!page) return json({ error: "Published page not found." }, 404, origin);
        const etag = '"' + page.content_hash + '"';
        const headers = new Headers({
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
          "etag": etag,
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin",
        });
        if (origin && (ALLOWED_ORIGINS.has(origin) || (origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app")))) {
          headers.set("access-control-allow-origin", origin);
          headers.set("vary", "Origin");
        }
        if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
        return new Response(JSON.stringify({
          page: JSON.parse(page.content_json),
          publicationId: page.id,
          publishedAt: page.published_at,
          contentHash: page.content_hash,
        }), { status: 200, headers });
      } catch {
        return json({ error: "Published website content is temporarily unavailable." }, 500, origin);
      }
    }

    const cmsMediaMatch = url.pathname.match(/^\/api\/public\/cms-media\/([0-9a-f-]{36})$/i);
    if (request.method === "GET" && cmsMediaMatch) {
      try {
        const mediaId = cmsMediaMatch[1];
        const published = await env.DB.prepare(
          "SELECT p.content_json FROM cms_publication_stat --- TRUNCATED --- 24,346 chars