export type AdminRow = Record<string, unknown> & {
  id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  service?: string;
  area?: string;
  kind?: "Quotation" | "Invoice" | string;
  amount_cents?: number;
};

export type AdminResource =
  | "enquiries"
  | "jobs"
  | "documents"
  | "media"
  | "content"
  | "customers"
  | "schedules"
  | "reports"
  | "settings";

export class AdminApiError extends Error {
  readonly code: "not-configured" | "http" | "invalid-response" | "network";
  readonly status?: number;

  constructor(
    message: string,
    code: AdminApiError["code"],
    status?: number
  ) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.status = status;
  }
}

export function getAdminApiBase(): string {
  return "/";
}

export function getAdminApiHealthUrl(): string {
  return "/api/health";
}

export function adminApiConfigurationMessage(): string {
  return "NGMS HostAfrica API uses same-origin application routes.";
}

export function getAdminMediaDownloadUrl(id: unknown): string {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id)) return "";
  return `/api/admin/media/${encodeURIComponent(id)}/file`;
}

async function mediaActionFetch(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  if (!previewWritesEnabled()) {
    throw new AdminApiError("Media changes are disabled until preview write acceptance is approved.", "not-configured");
  }
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The NGMS application API is not available in this browser.", "not-configured");
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    throw new AdminApiError("The media request failed. No successful change has been assumed.", "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(message, "http", response.status);
  }
  if (!body || typeof body !== "object") {
    throw new AdminApiError("The media endpoint returned an invalid response.", "invalid-response", response.status);
  }
  return body as Record<string, unknown>;
}

export async function updateAdminMediaMetadata(
  id: string,
  payload: { category: string; alt_text: string; tags: string[]; is_published?: boolean }
): Promise<AdminRow> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new AdminApiError("The media identifier is invalid.", "invalid-response");
  const body = await mediaActionFetch(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!body.item || typeof body.item !== "object") throw new AdminApiError("The metadata endpoint did not return a saved media record.", "invalid-response");
  return body.item as AdminRow;
}

export async function replaceAdminMedia(id: string, file: File): Promise<AdminRow> {
  const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);
  if (!accepted.has(file.type)) throw new AdminApiError("Unsupported replacement file type.", "invalid-response");
  if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new AdminApiError("Replacement file must be between 1 byte and 10 MB.", "invalid-response");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new AdminApiError("The media identifier is invalid.", "invalid-response");
  const form = new FormData();
  form.append("file", file);
  const body = await mediaActionFetch(`/api/admin/media/${encodeURIComponent(id)}/replace`, {
    method: "POST",
    body: form,
  });
  if (!body.item || typeof body.item !== "object") throw new AdminApiError("The replacement endpoint did not return the updated media record.", "invalid-response");
  return body.item as AdminRow;
}

export async function deleteAdminMedia(id: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new AdminApiError("The media identifier is invalid.", "invalid-response");
  const body = await mediaActionFetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (body.deleted !== true) throw new AdminApiError("The media delete endpoint did not confirm deletion.", "invalid-response");
}

export async function readAdminCollection(
  resource: AdminResource,
  signal?: AbortSignal
): Promise<AdminRow[]> {
  const base = getAdminApiBase();
  if (!base) {
    throw new AdminApiError(
      "the NGMS API URL is missing or not the approved HTTPS preview host. No request was sent.",
      "not-configured"
    );
  }

  let response: Response;
  try {
    response = await fetch(`/api/admin/${resource}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminApiError(
      "The API request failed. Check your NGMS sign-in session and retry.",
      "network"
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const safeMessage =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(safeMessage, "http", response.status);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("items" in body) ||
    !Array.isArray((body as { items?: unknown }).items)
  ) {
    throw new AdminApiError(
      "The API response did not match the expected { items: [] } contract.",
      "invalid-response",
      response.status
    );
  }

  return (body as { items: AdminRow[] }).items;
}

export function adminApiErrorMessage(error: unknown): string {
  if (!(error instanceof AdminApiError)) {
    if (error instanceof DOMException && error.name === "AbortError") return "Request cancelled.";
    return "The request could not be completed. The dashboard is not showing assumed zero values.";
  }

  if (error.code === "not-configured") return error.message;
  if (error.code === "network") return error.message;
  if (error.code === "invalid-response") return error.message;
  if (error.status === 401) return "Your NGMS session is missing or expired. Please sign in again.";
  if (error.status === 403) return "NGMS denied this action. Check your administrator permissions.";
  if (error.status === 404) return "This endpoint is not available on the configured Worker.";
  if (error.status === 429) return "The API rate limit was reached. Wait briefly before retrying.";
  if (error.status && error.status >= 500) return "The NGMS API reported a server error. No record changes were made by this read request.";
  return error.message;
}


export function previewWritesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NGMS_ENV === "hostafrica";
}

async function readMutationResponse(response: Response): Promise<AdminRow> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(message, "http", response.status);
  }
  if (!body || typeof body !== "object" || !("item" in body) ||
      !(body as { item?: unknown }).item ||
      typeof (body as { item?: unknown }).item !== "object") {
    throw new AdminApiError("The API response did not match the expected { item: {} } contract.", "invalid-response", response.status);
  }
  return (body as { item: AdminRow }).item;
}

async function mutationFetch(path: string, init: RequestInit): Promise<AdminRow> {
  if (!previewWritesEnabled()) {
    throw new AdminApiError("Preview write actions are disabled until staging authentication and persistence checks are complete.", "not-configured");
  }
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The NGMS application API is not available in this browser.", "not-configured");
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json", ...(init.headers ?? {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminApiError("The API request failed. No success has been assumed.", "network");
  }
  return readMutationResponse(response);
}

export async function createAdminRecord(
  resource: "enquiries" | "jobs" | "documents",
  payload: Record<string, unknown>
): Promise<AdminRow> {
  return mutationFetch(`/api/admin/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createAdminSchedule(payload: {
  title: string;
  customer_name?: string;
  service: string;
  area?: string;
  assigned_to?: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
  status?: "Scheduled" | "Confirmed" | "In progress" | "Completed" | "Cancelled";
}): Promise<AdminRow> {
  return mutationFetch("/api/admin/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminStatus(
  resource: "enquiries" | "jobs" | "documents" | "schedules",
  id: string,
  status: string
): Promise<AdminRow> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) {
    throw new AdminApiError("The record identifier is not valid.", "invalid-response");
  }
  return mutationFetch(`/api/admin/${resource}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function uploadAdminMedia(file: File, category = "Uncategorised"): Promise<AdminRow> {
  const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);
  if (!accepted.has(file.type)) {
    throw new AdminApiError("Unsupported file type. Use JPEG, PNG, WebP, AVIF or PDF.", "invalid-response");
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new AdminApiError("File must be between 1 byte and 10 MB.", "invalid-response");
  }
  if (!previewWritesEnabled()) {
    throw new AdminApiError("Uploads are unavailable until the NGMS administrator session is active.", "not-configured");
  }
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The NGMS application API is not available in this browser.", "not-configured");
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  let response: Response;
  try {
    response = await fetch("/api/admin/media", {
      method: "POST",
      body: form,
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new AdminApiError("The upload request failed. No successful upload has been assumed.", "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(message, "http", response.status);
  }
  if (
    !body || typeof body !== "object" ||
    !("id" in body) || typeof (body as { id?: unknown }).id !== "string" ||
    !("name" in body) || typeof (body as { name?: unknown }).name !== "string" ||
    !("type" in body) || typeof (body as { type?: unknown }).type !== "string" ||
    !("size" in body) || typeof (body as { size?: unknown }).size !== "number"
  ) {
    throw new AdminApiError("The media endpoint response did not match its verified { id, name, type, size } contract.", "invalid-response", response.status);
  }
  const uploaded = body as { id: string; name: string; type: string; size: number };
  return {
    id: uploaded.id,
    original_name: uploaded.name,
    content_type: uploaded.type,
    size_bytes: uploaded.size,
  };
}


export async function readCommercialDocuments(
  kind: "Quotation" | "Invoice",
  status?: string,
  signal?: AbortSignal
): Promise<AdminRow[]> {
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The NGMS application API is not available in this browser.", "not-configured");
  const params = new URLSearchParams({ kind });
  if (status) params.set("status", status);
  let response: Response;
  try {
    response = await fetch(`/api/admin/commercial-documents?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminApiError("The commercial-document request failed. Check your NGMS sign-in session and retry.", "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(message, "http", response.status);
  }
  if (!body || typeof body !== "object" || !("items" in body) || !Array.isArray((body as { items?: unknown }).items)) {
    throw new AdminApiError("The commercial-document response did not match the expected { items: [] } contract.", "invalid-response", response.status);
  }
  return (body as { items: AdminRow[] }).items;
}

export async function readAdminCustomers(signal?: AbortSignal): Promise<AdminRow[]> {
  return readAdminCollection("customers", signal);
}

export async function createCommercialDocument(payload: Record<string, unknown>): Promise<AdminRow> {
  return mutationFetch("/api/admin/commercial-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createAdminCustomer(payload: Record<string, unknown>): Promise<AdminRow> {
  return mutationFetch("/api/admin/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCommercialDocumentStatus(id: string, status: string): Promise<AdminRow> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) {
    throw new AdminApiError("The document identifier is not valid.", "invalid-response");
  }
  return mutationFetch(`/api/admin/commercial-documents/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}


export type InvoicePayment = {
  id: string;
  amount_cents: number;
  paid_at: string;
  method: "EFT" | "Cash" | "Card" | "Other" | string;
  reference: string;
  notes: string;
  recorded_by: string;
  created_at: string;
};

export type InvoicePaymentSummary = {
  items: InvoicePayment[];
  paid_cents: number;
  balance_cents: number;
};

export type QuotePublicLine = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type PublicQuotation = {
  reference: string;
  customer_name: string;
  kind: "Quotation";
  amount_cents: number;
  subtotal_cents: number;
  discount_cents: number;
  vat_enabled: number;
  vat_rate_basis_points: number;
  vat_cents: number;
  status: string;
  issue_date: string | null;
  service?: string | null;
  area?: string | null;
  decision?: "Accepted" | "Declined" | null;
  job_id?: string | null;
  used_at?: string | null;
  notes: string;
};

export type PublicQuotationResponse = {
  quote: PublicQuotation;
  lines: QuotePublicLine[];
};

async function requestPreviewJson<T>(
  path: string,
  init: RequestInit,
  requiresWrite: boolean,
  publicTokenRequest = false
): Promise<T> {
  if (requiresWrite && !previewWritesEnabled()) {
    throw new AdminApiError("Preview write actions are disabled until authenticated staging persistence tests are approved.", "not-configured");
  }
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The NGMS application API is not available in this browser.", "not-configured");
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: publicTokenRequest ? "omit" : "include",
      cache: "no-store",
      headers: { Accept: "application/json", ...(init.headers ?? {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminApiError("the NGMS API request failed. Check your NGMS sign-in session and retry.", "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : `NGMS API returned HTTP ${response.status}.`;
    throw new AdminApiError(message, "http", response.status);
  }
  return body as T;
}

export async function convertEnquiryToCustomer(id: string): Promise<{ item: AdminRow; enquiry: AdminRow }> {
  if (!/^[A-Za-z0-9-]{1,120}$/.test(id)) throw new AdminApiError("The enquiry identifier is not valid.", "invalid-response");
  const result = await requestPreviewJson<{ item?: AdminRow; enquiry?: AdminRow }>(
    `/api/admin/enquiries/${encodeURIComponent(id)}/convert-to-customer`,
    { method: "POST" },
    true
  );
  if (!result.item || !result.enquiry) {
    throw new AdminApiError("The CRM conversion response did not match the expected item/enquiry contract.", "invalid-response");
  }
  return { item: result.item, enquiry: result.enquiry };
}

export async function createCommercialShareLink(
  id: string,
  enquiryId: string
): Promise<{ url: string; expires_at: string; reference: string }> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id) || !/^[A-Za-z0-9-]{1,120}$/.test(enquiryId)) {
    throw new AdminApiError("The quotation or enquiry identifier is not valid.", "invalid-response");
  }
  return requestPreviewJson(
    `/api/admin/commercial-documents/${encodeURIComponent(id)}/share`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiry_id: enquiryId }),
    },
    true
  );
}

export async function readInvoicePayments(id: string, signal?: AbortSignal): Promise<InvoicePaymentSummary> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new AdminApiError("The invoice identifier is not valid.", "invalid-response");
  return requestPreviewJson(`/api/admin/commercial-documents/${encodeURIComponent(id)}/payments`, { method: "GET", signal }, false);
}

export async function recordInvoicePayment(
  id: string,
  payload: { amount: number; method: "EFT" | "Cash" | "Card" | "Other"; paid_at: string; reference?: string; notes?: string }
): Promise<{ saved: boolean; paid_cents: number; balance_cents: number; status: string }> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new AdminApiError("The invoice identifier is not valid.", "invalid-response");
  return requestPreviewJson(`/api/admin/commercial-documents/${encodeURIComponent(id)}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, true);
}

export async function convertAcceptedQuotationToJob(id: string): Promise<AdminRow> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new AdminApiError("The quotation identifier is not valid.", "invalid-response");
  const result = await requestPreviewJson<{ item?: AdminRow }>(
    `/api/admin/commercial-documents/${encodeURIComponent(id)}/convert-to-job`,
    { method: "POST" },
    true
  );
  if (!result.item || typeof result.item !== "object") throw new AdminApiError("The quote-to-job response did not match the expected { item: {} } contract.", "invalid-response");
  return result.item;
}

function validPublicQuoteToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

export async function readPublicQuotation(token: string, signal?: AbortSignal): Promise<PublicQuotationResponse> {
  if (!validPublicQuoteToken(token)) throw new AdminApiError("This quotation link is not valid.", "invalid-response");
  return requestPreviewJson(`/api/public/quotes/${token}`, { method: "GET", signal }, false, true);
}

export async function submitPublicQuotationDecision(
  token: string,
  decision: "Accepted" | "Declined"
): Promise<{ saved: boolean; decision: string; reference: string; job_id?: string | null }> {
  if (!validPublicQuoteToken(token)) throw new AdminApiError("This quotation link is not valid.", "invalid-response");
  return requestPreviewJson(`/api/public/quotes/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  }, false, true);
}


export type AdminPublishingRequest = {
  id: string;
  module_key: string;
  slug: string;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
};
export type AdminPublishingVersion = {
  id: string;
  module_key: string;
  slug: string;
  source_publication_id: string | null;
  published_by: string;
  published_at: string;
};
export type AdminPublishingSnapshot = {
  requests: AdminPublishingRequest[];
  current: Array<{ module_key: string; slug: string; publication_id: string; updated_at: string; content_hash: string; published_by: string; published_at: string }>;
  history: AdminPublishingVersion[];
  audit: Array<{ id: string; module_key: string; request_id: string | null; publication_id: string | null; action: string; actor: string; details_json: string; created_at: string }>;
};

export function cmsWritesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NGMS_ENV === "hostafrica" &&
    process.env.NEXT_PUBLIC_NGMS_CMS_WRITES_ENABLED === "true";
}

function requireCmsWrites(): void {
  if (!cmsWritesEnabled()) {
    throw new AdminApiError("CMS editing and publishing are disabled in this preview environment. A CMS owner must enable both Staging writes and the CMS-specific write flag after approval testing.", "not-configured");
  }
}

export async function readAdminPublishing(signal?: AbortSignal): Promise<AdminPublishingSnapshot> {
  return requestPreviewJson<AdminPublishingSnapshot>("/api/admin/publishing", { method: "GET", signal }, false);
}

export async function saveAdminCmsDraft(moduleKey: string, value: Record<string, unknown>): Promise<void> {
  requireCmsWrites();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(moduleKey)) throw new AdminApiError("The CMS module key is not valid.", "invalid-response");
  await requestPreviewJson("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "cms_draft." + moduleKey, value }),
  }, true);
}

export async function requestAdminPublication(moduleKey: string): Promise<{ requested: boolean; requestId: string; moduleKey: string; slug: string; approvalRequired: boolean }> {
  requireCmsWrites();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(moduleKey)) throw new AdminApiError("The CMS module key is not valid.", "invalid-response");
  return requestPreviewJson("/api/admin/publishing/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleKey }),
  }, true);
}

export async function reviewAdminPublication(requestId: string, decision: "approve" | "reject", note: string): Promise<{ published?: boolean; rejected?: boolean; requestId: string }> {
  requireCmsWrites();
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw new AdminApiError("The publication request identifier is not valid.", "invalid-response");
  return requestPreviewJson("/api/admin/publishing/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, decision, note: note.trim() }),
  }, true);
}

export async function rollbackAdminPublication(moduleKey: string, publicationId: string, note: string): Promise<{ rolledBack: boolean; moduleKey: string; publicationId: string; restoredFrom: string; slug: string }> {
  requireCmsWrites();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(moduleKey) || !/^[0-9a-f-]{36}$/i.test(publicationId)) {
    throw new AdminApiError("The CMS module or publication identifier is not valid.", "invalid-response");
  }
  return requestPreviewJson("/api/admin/publishing/rollback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleKey, publicationId, note: note.trim() }),
  }, true);
}


export type CommercialDocumentLine = {
  id?: string;
  line_order?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type CommercialDocumentDetail = {
  item: AdminRow;
  lines: CommercialDocumentLine[];
};

export async function readCommercialDocument(id: string, signal?: AbortSignal): Promise<CommercialDocumentDetail> {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(id)) throw new AdminApiError("The document identifier is not valid.", "invalid-response");
  const result = await requestPreviewJson<CommercialDocumentDetail>(
    `/api/admin/commercial-documents/${encodeURIComponent(id)}`,
    { method: "GET", signal },
    false
  );
  if (!result.item || typeof result.item !== "object" || !Array.isArray(result.lines)) {
    throw new AdminApiError("The commercial-document detail response did not match the expected item/lines contract.", "invalid-response");
  }
  return result;
}
