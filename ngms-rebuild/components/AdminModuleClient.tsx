"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminRow, adminApiErrorMessage, getAdminApiBase, readAdminCollection } from "@/lib/admin-api";

export type AdminModuleKey =
  | "enquiries" | "jobs" | "quotes" | "invoices" | "calendar"
  | "media" | "content" | "reports" | "settings";

type Column = { key: string; label: string };
type ModuleDefinition = {
  title: string;
  description: string;
  resource?: "enquiries" | "jobs" | "documents" | "media" | "content";
  kind?: "Quotation" | "Invoice";
  columns: Column[];
};

const MODULES: Record<AdminModuleKey, ModuleDefinition> = {
  enquiries: {
    title: "Enquiries & customers",
    description: "Review incoming requests, qualification details and customer history.",
    resource: "enquiries",
    columns: [
      { key: "id", label: "Reference" }, { key: "customer_name", label: "Customer" },
      { key: "service", label: "Service" }, { key: "area", label: "Area" },
      { key: "created_at", label: "Received" }, { key: "status", label: "Status" },
    ],
  },
  jobs: {
    title: "Jobs",
    description: "Review job records, progress and completion evidence.",
    resource: "jobs",
    columns: [
      { key: "id", label: "Job reference" }, { key: "customer_name", label: "Customer / site" },
      { key: "service", label: "Service" }, { key: "area", label: "Area" },
      { key: "created_at", label: "Created" }, { key: "status", label: "Status" },
    ],
  },
  quotes: {
    title: "Quotations",
    description: "Review quotation documents and their current recorded status.",
    resource: "documents",
    kind: "Quotation",
    columns: [
      { key: "id", label: "Quote reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Amount (ZAR)" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  invoices: {
    title: "Invoices",
    description: "Review invoice documents and their recorded status.",
    resource: "documents",
    kind: "Invoice",
    columns: [
      { key: "id", label: "Invoice reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Face value (ZAR)" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  calendar: {
    title: "Job calendar",
    description: "Review appointments and coordinate schedule changes.",
    columns: [
      { key: "date", label: "Date" }, { key: "job", label: "Job" },
      { key: "site", label: "Site" }, { key: "assigned_to", label: "Assigned to" },
      { key: "status", label: "Status" },
    ],
  },
  media: {
    title: "Media library",
    description: "Review stored media metadata and approved website assets.",
    resource: "media",
    columns: [
      { key: "original_name", label: "Asset" }, { key: "content_type", label: "Type" },
      { key: "size_bytes", label: "Size" }, { key: "uploaded_by", label: "Uploaded by" },
      { key: "created_at", label: "Uploaded" },
    ],
  },
  content: {
    title: "Website content",
    description: "Review the content records currently stored for the website.",
    resource: "content",
    columns: [
      { key: "content_key", label: "Content key" }, { key: "content_json", label: "Content value" },
      { key: "updated_by", label: "Updated by" }, { key: "updated_at", label: "Updated" },
    ],
  },
  reports: {
    title: "Reports",
    description: "Operational and financial reporting will be enabled when the reporting definitions and API are implemented.",
    columns: [
      { key: "report", label: "Report" }, { key: "period", label: "Period" },
      { key: "last_updated", label: "Last updated" }, { key: "data_status", label: "Data status" },
    ],
  },
  settings: {
    title: "Settings & access",
    description: "Review authorised roles, access rules, service catalogue and audit history.",
    columns: [
      { key: "setting", label: "Setting" }, { key: "current_value", label: "Current value" },
      { key: "owner", label: "Owner" }, { key: "last_changed", label: "Last changed" },
    ],
  },
};

function displayValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "amount_cents" && typeof value === "number") {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value / 100);
  }
  if (key === "size_bytes" && typeof value === "number") {
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
    return (value / (1024 * 1024)).toFixed(1) + " MB";
  }
  if ((key === "created_at" || key === "updated_at") && typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
  }
  if (key === "content_json" && typeof value === "string" && value.length > 100) {
    return value.slice(0, 100) + "…";
  }
  return String(value);
}

export default function AdminModuleClient({ moduleKey }: { moduleKey: AdminModuleKey }) {
  const module = MODULES[moduleKey];
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const apiConfigured = Boolean(getAdminApiBase());
  const hasReadEndpoint = Boolean(module.resource);

  const load = useCallback(async (signal: AbortSignal) => {
    if (!getAdminApiBase()) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!module.resource) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await readAdminCollection(module.resource, signal);
      const filtered = module.kind ? result.filter((row) => row.kind === module.kind) : result;
      if (!signal.aborted) setRows(filtered);
    } catch (e) {
      if (!signal.aborted) {
        setRows([]);
        setError(adminApiErrorMessage(e));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [module.resource, module.kind]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshVersion]);

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [rows, query]);

  const title = module.title;
  return (
    <div className="admin-page">
      <div className="admin-page-top">
        <div>
          <p className="eyebrow">NGMS / WORKSPACE</p>
          <h1>{title.toUpperCase()}</h1>
          <p>{module.description}</p>
        </div>
        <Link href="/admin" className="button button-outline button-dark-outline">← Overview</Link>
      </div>

      <div className="api-notice" role="status">
        <span className="notice-dot" aria-hidden="true" />
        <div>
          <strong>{error ? "API data is unavailable" : loading ? "Loading records" : !module.resource ? "API route not implemented" : !apiConfigured ? "Preview integration pending" : "Read-only API connection"}</strong>
          <p>
            {error
              ? error
              : !module.resource
                ? "The currently verified Worker does not expose this module's reporting or calendar endpoint. No demo records are displayed."
                : !apiConfigured
                  ? "The preview API URL is not configured. This module will not show placeholder data as if it were live."
                  : "This view reads the verified Worker endpoint only. Record creation, status changes and deletion remain disabled until end-to-end authorisation and write tests are approved."}
          </p>
        </div>
      </div>

      <section className="data-panel">
        <div className="data-toolbar">
          <div>
            <strong>{title}</strong>
            <small>{error ? "Could not verify the current record count" : loading ? "Retrieving from protected API…" : hasReadEndpoint && apiConfigured ? `${rows.length} records returned by the API` : "Live record retrieval is not active in this preview"}</small>
          </div>
          <input aria-label={"Search " + title} placeholder="Search loaded records…" value={query} onChange={(e) => setQuery(e.target.value)} disabled={!rows.length} />
          <button className="button button-orange" type="button" onClick={() => setRefreshVersion((v) => v + 1)} disabled={loading || !module.resource || !apiConfigured}>Refresh</button>
        </div>

        {loading ? (
          <div className="table-empty" role="status"><span aria-hidden="true">◌</span><h2>LOADING RECORDS</h2><p>Waiting for the protected Cloudflare API response.</p></div>
        ) : error ? (
          <div className="table-empty"><span aria-hidden="true">!</span><h2>RECORDS COULD NOT BE LOADED.</h2><p>The dashboard will not substitute an empty list or zero balance for an API error.</p><button className="button button-outline button-dark-outline" type="button" onClick={() => setRefreshVersion((v) => v + 1)}>Try again</button></div>
        ) : !module.resource ? (
          <div className="table-empty"><span aria-hidden="true">⌁</span><h2>ENDPOINT NOT YET IMPLEMENTED.</h2><p>This module needs a documented API route and approved business definitions before its data can be displayed.</p></div>
        ) : !apiConfigured ? (
          <div className="table-empty"><span aria-hidden="true">⌁</span><h2>CONNECT THE PREVIEW API.</h2><p>Set NEXT_PUBLIC_NGMS_API_BASE only in the preview environment, and ensure Cloudflare Access and the allowed-origin policy include that preview. Never place secrets in this variable.</p></div>
        ) : rows.length === 0 ? (
          <div className="table-empty"><span aria-hidden="true">▤</span><h2>NO RECORDS RETURNED.</h2><p>The protected API returned an empty collection for this module. This is a live empty result, not an API error.</p></div>
        ) : visibleRows.length === 0 ? (
          <div className="table-empty"><span aria-hidden="true">⌕</span><h2>NO MATCHES.</h2><p>Try a different search term.</p></div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr>{module.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={String(row.id ?? row.content_key ?? i)}>
                    {module.columns.map((column) => <td key={column.key}>{displayValue(column.key, row[column.key])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {moduleKey === "invoices" && <p className="module-footnote">The current D1 document schema stores invoice face value and status, but does not contain a partial-payment ledger. This screen therefore does not calculate a partial-payment balance.</p>}
      {moduleKey === "content" && <p className="module-footnote">Content editing is intentionally disabled in this rebuild until optimistic concurrency, publish/rollback and the owner-approved field schema are implemented.</p>}
      <p className="module-footnote">This UI does not enable writes. API calls and access policy must be verified in the actual preview before create/edit/publish operations are switched on.</p>
    </div>
  );
}
