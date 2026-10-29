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

export function getAdminApiBase(): string {
  return (process.env.NEXT_PUBLIC_NGMS_API_BASE ?? "").trim().replace(/\/+$/, "");
}

export async function readAdminCollection(
  resource: AdminResource,
  signal?: AbortSignal
): Promise<AdminRow[]> {
  const base = getAdminApiBase();
  if (!base) {
    throw new AdminApiError(
      "The protected Cloudflare API base URL is not configured for this preview.",
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
