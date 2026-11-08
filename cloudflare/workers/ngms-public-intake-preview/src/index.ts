// @ts-nocheck
// Recovered from the deployed ngms-public-intake-preview Worker bundle; keep this file aligned with that deployed contract.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://ngms-website-v4.vercel.app",
  "https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev",
  "https://www.nextgensolarmaintenance.co.za",
  "https://nextgensolarmaintenance.co.za",
  "http://localhost:3000"
]);
var PUBLIC_MEDIA_SLOT_KEYS = [
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
  "home.why"
];
var IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
var MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var SERVICES = /* @__PURE__ */ new Set([
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
  "Other / not sure yet"
]);
function json(data, status = 200, origin = null) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "vary": "Origin"
  });
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app"))) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "false");
    headers.set("access-control-allow-methods", "POST, OPTIONS, GET");
    headers.set("access-control-allow-headers", "Content-Type");
    headers.set("access-control-max-age", "86400");
  }
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json, "json");
function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max) return null;
  return cleaned;
}
__name(cleanText, "cleanText");
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
__name(validEmail, "validEmail");
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] ?? char);
}
__name(escapeHtml, "escapeHtml");
async function notifyNewLead(env, lead) {
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO || !env.LEAD_NOTIFY_FROM) {
    console.warn("Lead saved; Resend notification is not configured.");
    return false;
  }
  const safe = {
    id: escapeHtml(lead.id),
    customer: escapeHtml(lead.customer),
    phone: escapeHtml(lead.phone || "Not supplied"),
    email: escapeHtml(lead.email || "Not supplied"),
    service: escapeHtml(lead.service),
    area: escapeHtml(lead.area),
    details: escapeHtml(lead.details)
  };
  const text = [
    "New NGMS website enquiry",
    `Reference: ${lead.id}`,
    `Customer: ${lead.customer}`,
    `Phone: ${lead.phone || "Not supplied"}`,
    `Email: ${lead.email || "Not supplied"}`,
    `Service: ${lead.service}`,
    `Area: ${lead.area}`,
    "",
    "Job details:",
    lead.details
  ].join("\n");
  const html = `<h2>New NGMS website enquiry</h2><p><strong>Reference:</strong> ${safe.id}</p><p><strong>Customer:</strong> ${safe.customer}</p><p><strong>Phone:</strong> ${safe.phone}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Service:</strong> ${safe.service}</p><p><strong>Area:</strong> ${safe.area}</p><p><strong>Job details:</strong></p><p>${safe.details.replace(/\n/g, "<br>")}</p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.LEAD_NOTIFY_FROM,
        to: [env.LEAD_NOTIFY_TO],
        subject: `New NGMS lead \u2014 ${lead.service} \u2014 ${lead.id}`,
        text,
        html
      })
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
__name(notifyNewLead, "notifyNewLead");
async function verifyTurnstile(token, secret, ip, origin) {
  if (!secret || !token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  let result;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form
    });
    if (!response.ok) return false;
    result = await response.json();
  } catch {
    return false;
  }
  return result.success === true && result.action === "ngms_enquiry" && result.hostname === new URL(origin).hostname;
}
__name(verifyTurnstile, "verifyTurnstile");
async function fileSignatureMatches(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  switch (file.type.toLowerCase()) {
    case "image/jpeg": return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    case "image/png": return bytes.length >= 8 && bytes[0] === 137 && ascii(1, 4) === "PNG" && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif": return ascii(4, 8) === "ftyp" && /(?:avif|avis)/.test(ascii(8, 16));
    default: return false;
  }
}
__name(fileSignatureMatches, "fileSignatureMatches");
var index_default = {
  async fetch(request, env) {
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
          `SELECT content_key, content_json FROM site_content WHERE content_key IN (${placeholders})`
        ).bind(...keys).all();
        const items = {};
        for (const row of result.results ?? []) {
          try {
            const value = JSON.parse(row.content_json);
            if (row.content_key === "website.mediaSlots") {
              if (!value || typeof value !== "object" || Array.isArray(value)) continue;
              const map = value;
              const safeSlots = {};
              for (const slotKey of PUBLIC_MEDIA_SLOT_KEYS) {
                const mediaId = map[slotKey];
                if (typeof mediaId === "string" && MEDIA_ID_PATTERN.test(mediaId)) safeSlots[slotKey] = mediaId;
              }
              items[row.content_key] = safeSlots;
            } else if (typeof value === "string" && value.trim().length > 0 && value.length <= 600) {
              items[row.content_key] = value;
            }
          } catch {
          }
        }
        const homePublication = await env.DB.prepare(
          "SELECT p.content_json, p.content_hash, p.id, p.published_at FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id WHERE s.module_key = 'home' AND s.slug = 'home'"
        ).first();
        if (homePublication) {
          try {
            const page = JSON.parse(homePublication.content_json);
            if (typeof page.title === "string" && page.title.trim()) items["home.heroTitle"] = page.title;
            if (typeof page.summary === "string" && page.summary.trim()) items["home.heroSubtitle"] = page.summary;
            items["cms.home"] = {
              title: typeof page.title === "string" ? page.title : "",
              summary: typeof page.summary === "string" ? page.summary : "",
              seoTitle: typeof page.seoTitle === "string" ? page.seoTitle : "",
              seoDescription: typeof page.seoDescription === "string" ? page.seoDescription : "",
              blocks: Array.isArray(page.blocks) ? page.blocks : [],
              publicationId: homePublication.id,
              publishedAt: homePublication.published_at
            };
          } catch {
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
          "SELECT p.id, p.module_key, p.slug, p.content_json, p.content_hash, p.published_at FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id WHERE s.slug = ? LIMIT 1"
        ).bind(rawSlug).first();
        if (!page) return json({ error: "Published page not found." }, 404, origin);
        const etag = '"' + page.content_hash + '"';
        const headers = new Headers({
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
          "etag": etag,
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin"
        });
        if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app"))) {
          headers.set("access-control-allow-origin", origin);
          headers.set("vary", "Origin");
        }
        if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
        return new Response(JSON.stringify({
          page: JSON.parse(page.content_json),
          publicationId: page.id,
          publishedAt: page.published_at,
          contentHash: page.content_hash
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
          "SELECT p.content_json FROM cms_publication_state s JOIN cms_publications p ON p.id = s.publication_id LIMIT 100"
        ).all();
        const mediaIsPublished = (published.results ?? []).some((row) => row.content_json.includes('"' + mediaId + '"'));
        if (!mediaIsPublished) return json({ error: "Website media not found." }, 404, origin);
        const media = await env.DB.prepare(
          "SELECT object_key, content_type, size_bytes FROM media WHERE id = ?"
        ).bind(mediaId).first();
        if (!media || !IMAGE_TYPES.has(media.content_type)) return json({ error: "Website media not found." }, 404, origin);
        const object = await env.MEDIA.get(media.object_key);
        if (!object) return json({ error: "Website media not found." }, 404, origin);
        const headers = new Headers({
          "content-type": media.content_type,
          "content-length": String(media.size_bytes),
          "cache-control": "public, max-age=60, s-maxage=300",
          "x-content-type-options": "nosniff",
          "content-disposition": "inline",
          "referrer-policy": "strict-origin-when-cross-origin"
        });
        if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app"))) {
          headers.set("access-control-allow-origin", origin);
          headers.set("vary", "Origin");
        }
        return new Response(object.body, { status: 200, headers });
      } catch {
        return json({ error: "Website media is temporarily unavailable." }, 500, origin);
      }
    }
    if (request.method === "OPTIONS") {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403);
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "POST, OPTIONS, GET",
          "access-control-allow-headers": "Content-Type",
          "access-control-max-age": "86400",
          "vary": "Origin"
        }
      });
    }
    const websiteMediaMatch = url.pathname.match(/^\/api\/public\/website-media\/([0-9a-f-]{36})$/i);
    if (request.method === "GET" && websiteMediaMatch) {
      try {
        const mediaId = websiteMediaMatch[1];
        const mapping = await env.DB.prepare(
          "SELECT content_json FROM site_content WHERE content_key = 'website.mediaSlots'"
        ).first();
        if (!mapping) return json({ error: "Website image not found." }, 404, origin);
        let savedSlots = {};
        try {
          const parsed = JSON.parse(mapping.content_json);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) savedSlots = parsed;
        } catch {
          return json({ error: "Website image not found." }, 404, origin);
        }
        const isAssigned = PUBLIC_MEDIA_SLOT_KEYS.some((slotKey) => savedSlots[slotKey] === mediaId);
        if (!isAssigned) return json({ error: "Website image not found." }, 404, origin);
        const media = await env.DB.prepare(
          "SELECT object_key, content_type, size_bytes FROM media WHERE id = ?"
        ).bind(mediaId).first();
        if (!media || !IMAGE_TYPES.has(media.content_type)) return json({ error: "Website image not found." }, 404, origin);
        const object = await env.MEDIA.get(media.object_key);
        if (!object) return json({ error: "Website image not found." }, 404, origin);
        const headers = new Headers({
          "content-type": media.content_type,
          "content-length": String(media.size_bytes),
          "cache-control": "public, max-age=60, s-maxage=300",
          "x-content-type-options": "nosniff",
          "content-disposition": "inline",
          "referrer-policy": "strict-origin-when-cross-origin"
        });
        if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app"))) {
          headers.set("access-control-allow-origin", origin);
          headers.set("vary", "Origin");
        }
        return new Response(object.body, { status: 200, headers });
      } catch {
        return json({ error: "Website image is temporarily unavailable." }, 500, origin);
      }
    }
    if (request.method === "GET" && url.pathname === "/api/public/projects") {
      try {
        const result = await env.DB.prepare(
          "SELECT p.id, p.title, p.service, p.area, p.description, p.created_at, p.before_media_id, p.after_media_id FROM projects p WHERE p.status = 'Published' ORDER BY p.created_at DESC LIMIT 100"
        ).all();
        const items = (result.results ?? []).map((project) => ({
          id: project.id,
          title: project.title,
          service: project.service,
          area: project.area,
          description: project.description,
          created_at: project.created_at,
          beforeImage: project.before_media_id ? `/api/public/project-media/${encodeURIComponent(project.before_media_id)}` : null,
          afterImage: project.after_media_id ? `/api/public/project-media/${encodeURIComponent(project.after_media_id)}` : null
        }));
        return json({ ok: true, items }, 200, origin);
      } catch {
        return json({ error: "Published project information is temporarily unavailable." }, 500, origin);
      }
    }
    const publicMediaMatch = url.pathname.match(/^\/api\/public\/project-media\/([0-9a-f-]{36})$/i);
    if (request.method === "GET" && publicMediaMatch) {
      try {
        const media = await env.DB.prepare(
          "SELECT m.object_key, m.content_type, m.original_name FROM media m WHERE m.id = ? AND m.content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif') AND EXISTS (SELECT 1 FROM projects p WHERE p.status = 'Published' AND (p.before_media_id = m.id OR p.after_media_id = m.id))"
        ).bind(publicMediaMatch[1]).first();
        if (!media) return json({ error: "Project image not found." }, 404, origin);
        const object = await env.MEDIA.get(media.object_key);
        if (!object) return json({ error: "Project image not found." }, 404, origin);
        const headers = new Headers({
          "content-type": media.content_type,
          "cache-control": "public, max-age=60, s-maxage=300",
          "x-content-type-options": "nosniff",
          "content-disposition": "inline",
          "referrer-policy": "strict-origin-when-cross-origin"
        });
        if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith("https://ngms-website-v4-") && origin.endsWith("-ngms.vercel.app"))) {
          headers.set("access-control-allow-origin", origin);
          headers.set("vary", "Origin");
        }
        return new Response(object.body, { status: 200, headers });
      } catch {
        return json({ error: "Project image is temporarily unavailable." }, 500, origin);
      }
    }
    if (url.pathname !== "/api/public/enquiries") return json({ error: "Not found." }, 404, origin);
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403);
    const contentType = (request.headers.get("Content-Type") ?? "").toLowerCase();
    const isMultipart = contentType.includes("multipart/form-data");
    if (!isMultipart && !contentType.includes("application/json")) return json({ error: "Multipart form data or JSON is required." }, 415, origin);
    const contentLength = Number(request.headers.get("Content-Length") ?? "0");
    if (contentLength > 21 * 1024 * 1024) return json({ error: "The enquiry and attachments exceed the 21 MB limit." }, 413, origin);
    let raw;
    const uploadedFiles = [];
    try {
      if (isMultipart) {
        const form = await request.formData();
        const fields = {};
        for (const [key, value] of form.entries()) {
          if (value instanceof File) {
            if (value.size > 0) uploadedFiles.push(value);
          } else fields[key] = value;
        }
        fields.consent = fields.consent === "true" || fields.consent === "on";
        raw = fields;
      } else raw = await request.json();
    } catch {
      return json({ error: "Invalid enquiry submission." }, 400, origin);
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json({ error: "A JSON object is required." }, 400, origin);
    const body = raw;
    if (uploadedFiles.length > 4) return json({ error: "Please attach no more than four photographs." }, 400, origin);
    const totalUploadBytes = uploadedFiles.reduce((total, file) => total + file.size, 0);
    if (totalUploadBytes > 20 * 1024 * 1024 || uploadedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      return json({ error: "Each photograph must be 5 MB or smaller, with a 20 MB total upload limit." }, 413, origin);
    }
    const allowedUploadTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);
    if (uploadedFiles.some((file) => !allowedUploadTypes.has(file.type) || !fileSignatureMatches(file))) {
      return json({ error: "Only valid JPG, PNG, WebP and AVIF photographs are accepted." }, 415, origin);
    }
    if (typeof body.website === "string" && body.website.trim()) {
      return json({ ok: true, message: "Thank you. Your enquiry has been received." }, 202, origin);
    }
    if (body.consent !== true) return json({ error: "Please confirm the privacy consent before submitting your enquiry." }, 400, origin);
    const customer = cleanText(body.customer_name, 160);
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const service = cleanText(body.service, 160);
    const area = cleanText(body.area, 160);
    const details = cleanText(body.details, 4e3);
    const turnstileToken = cleanText(body.turnstileToken, 2048);
    const submissionKey = cleanText(body.submissionKey, 80);
    if (!customer || customer.length < 2 || !service || !SERVICES.has(service) || !area || area.length < 2 || !details || details.length < 10) {
      return json({ error: "Please provide your name, service, property area and at least 10 characters of job details." }, 400, origin);
    }
    if (phone.length < 7 && !email) return json({ error: "Please provide a valid phone number or email address." }, 400, origin);
    if (phone && !/^[0-9+()\-\s]{7,40}$/.test(phone)) return json({ error: "Please check the phone number." }, 400, origin);
    if (email && !validEmail(email)) return json({ error: "Please check the email address." }, 400, origin);
    if (!submissionKey || !/^[0-9a-f-]{36}$/i.test(submissionKey)) return json({ error: "Please refresh the form and try again." }, 400, origin);
    if (!turnstileToken) return json({ error: "Please complete the security check and submit again." }, 400, origin);
    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    const verified = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip, origin);
    if (!verified) return json({ error: "The security check expired or could not be verified. Please try again." }, 400, origin);
    const recordedDetails = `${details}

Privacy consent: confirmed at ${new Date().toISOString()}`;
    try {
      const normalise = /* @__PURE__ */ __name((value) => value.trim().toLowerCase().replace(/\s+/g, " "), "normalise");
      const fingerprintInput = [
        normalise(customer),
        normalise(phone.replace(/[^0-9+]/g, "")),
        normalise(email),
        normalise(service),
        normalise(area),
        normalise(details)
      ].join("\n");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprintInput));
      const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const bucket = Math.floor(Date.now() / 3e5);
      const dedupeKey = `${fingerprint}:${bucket}`;
      const previousDedupeKey = `${fingerprint}:${bucket - 1}`;
      const id = `EN-${crypto.randomUUID()}`;
      const inserted = await env.DB.prepare(
        "INSERT OR IGNORE INTO enquiries (id, customer_name, phone, email, service, area, details, status, created_by, submission_key, dedupe_key) VALUES (?, ?, ?, ?, ?, ?, ?, 'New', 'public-contact-form', ?, ?)"
      ).bind(id, customer, phone, email, service, area, recordedDetails, submissionKey, dedupeKey).run();
      const saved = await env.DB.prepare(
        "SELECT id FROM enquiries WHERE submission_key = ? OR dedupe_key IN (?, ?) LIMIT 1"
      ).bind(submissionKey, dedupeKey, previousDedupeKey).first();
      if (!saved?.id) throw new Error("Enquiry was not persisted.");
      const created = Number(inserted.meta?.changes ?? 0) > 0;
      let attachmentsSaved = 0;
      if (created && uploadedFiles.length) {
        for (const file of uploadedFiles) {
          const mediaId = crypto.randomUUID();
          const extension = allowedUploadTypes.get(file.type);
          if (!extension) continue;
          const objectKey = `private/enquiries/${saved.id}/${mediaId}.${extension}`;
          const safeOriginalName = file.name.split(String.fromCharCode(47)).join("_").split(String.fromCharCode(92)).join("_").slice(0, 180);
          try {
            await env.MEDIA.put(objectKey, file.stream(), {
              httpMetadata: { contentType: file.type, cacheControl: "private, no-store" },
              customMetadata: { enquiryId: saved.id, originalName: safeOriginalName }
            });
            await env.DB.prepare(
              "INSERT INTO media (id, object_key, original_name, content_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(mediaId, objectKey, safeOriginalName, file.type, file.size, "public-enquiry:" + saved.id).run();
            await env.DB.prepare(
              "INSERT INTO enquiry_attachments (id, enquiry_id, media_id, original_name, content_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(crypto.randomUUID(), saved.id, mediaId, safeOriginalName, file.type, file.size).run();
            attachmentsSaved += 1;
          } catch (attachmentError) {
            await env.MEDIA.delete(objectKey).catch(() => void 0);
            await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run().catch(() => void 0);
            console.error("Enquiry attachment could not be saved", attachmentError instanceof Error ? attachmentError.message : "unknown error");
          }
        }
      }
      let notificationSent = false;
      if (created) {
        notificationSent = await notifyNewLead(env, {
          id: saved.id,
          customer,
          phone,
          email,
          service,
          area,
          details: recordedDetails + (attachmentsSaved ? `

Photographs attached: ${attachmentsSaved}` : "")
        });
      }
      return json({
        ok: true,
        message: created ? "Thank you. Your enquiry has been sent to NGMS." : "This enquiry was already received. NGMS has your request.",
        reference: saved.id,
        duplicate: !created,
        attachmentsSaved,
        attachmentsWarning: created && uploadedFiles.length > attachmentsSaved,
        notificationSent
      }, created ? 201 : 200, origin);
    } catch (error) {
      console.error("Public enquiry intake failed", error instanceof Error ? error.message : "unknown error");
      return json({ error: "We could not save your enquiry right now. Please call or WhatsApp NGMS instead." }, 500, origin);
    }
  }
};
export {
  index_default as default
};
