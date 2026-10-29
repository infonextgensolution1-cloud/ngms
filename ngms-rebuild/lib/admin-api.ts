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
  | "content";

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

const PREVIEW_ADMIN_API_HOST = "ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";

export function getAdminApiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_NGMS_API_BASE ?? "").trim();
  if (!configured) return "";

  try {
    const url = new URL(configured);
    if (
      url.protocol !== "https:" ||
      url.hostname !== PREVIEW_ADMIN_API_HOST ||
      url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return "";
    }
    return url.origin;
  } catch {
    return "";
  }
}

export function getAdminApiHealthUrl(): string {
  const base = getAdminApiBase();
  return base ? `${base}/health` : "";
}

export function adminApiConfigurationMessage(): string {
  const configured = (process.env.NEXT_PUBLIC_NGMS_API_BASE ?? "").trim();
  if (!configured) return "The preview API URL is not configured.";

  try {
    const url = new URL(configured);
    if (
      url.protocol !== "https:" ||
      url.hostname !== PREVIEW_ADMIN_API_HOST ||
      url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return "The configured API target is blocked. This preview admin only connects to the approved HTTPS preview API host; no request was sent.";
    }
    return "The preview API configuration is valid.";
  } catch {
    return "The preview API URL is invalid. No request was sent.";
  }
}

export function getAdminMediaDownloadUrl(id: unknown): string {
  const base = getAdminApiBase();
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id) || !base) return "";
  return `${base}/api/admin/media/${encodeURIComponent(id)}/download`;
}

export async function readAdminCollection(
  resource: AdminResource,
  signal?: AbortSignal
): Promise<AdminRow[]> {
  const base = getAdminApiBase();
  if (!base) {
    throw new AdminApiError(
      "The preview API URL is missing or not the approved HTTPS preview host. No request was sent.",
      "not-configured"
    );
  }

  let response: Response;
  try {
    response = await fetch(`${base}/api/admin/${resource}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminApiError(
      "The API request failed. Check the API URL, Cloudflare Access session and allowed preview origin.",
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
        : `Cloudflare API returned HTTP ${response.status}.`;
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
  if (error.status === 401) return "Cloudflare Access authentication is missing or expired. Sign in through the configured Access application.";
  if (error.status === 403) return "Access was denied. The signed-in user or preview origin may not be allowed by the Worker.";
  if (error.status === 404) return "This endpoint is not available on the configured Worker.";
  if (error.status === 429) return "The API rate limit was reached. Wait briefly before retrying.";
  if (error.status && error.status >= 500) return "The Cloudflare API reported a server error. No record changes were made by this read request.";
  return error.message;
}


export function previewWritesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES === "true";
}

async function readMutationResponse(response: Response): Promise<AdminRow> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Cloudflare API returned HTTP ${response.status}.`;
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
  if (!base) throw new AdminApiError("The protected Cloudflare API base URL is not configured for this preview.", "not-configured");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
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

export async function updateAdminStatus(
  resource: "enquiries" | "jobs" | "documents",
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

export async function uploadAdminMedia(file: File): Promise<AdminRow> {
  const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);
  if (!accepted.has(file.type)) {
    throw new AdminApiError("Unsupported file type. Use JPEG, PNG, WebP, AVIF or PDF.", "invalid-response");
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new AdminApiError("File must be between 1 byte and 10 MB.", "invalid-response");
  }
  if (!previewWritesEnabled()) {
    throw new AdminApiError("Preview uploads are disabled until staging authentication and persistence checks are complete.", "not-configured");
  }
  const base = getAdminApiBase();
  if (!base) throw new AdminApiError("The protected Cloudflare API base URL is not configured for this preview.", "not-configured");
  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${base}/api/admin/media`, {
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
        : `Cloudflare API returned HTTP ${response.status}.`;
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
