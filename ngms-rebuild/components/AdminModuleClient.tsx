"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminRow, adminApiConfigurationMessage, adminApiErrorMessage, createAdminRecord, getAdminApiBase,
  getAdminApiHealthUrl, getAdminMediaDownloadUrl, previewWritesEnabled, readAdminCollection, updateAdminStatus, uploadAdminMedia,
} from "@/lib/admin-api";
import { services } from "@/lib/site";

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
    resource: "documents", kind: "Quotation",
    columns: [
      { key: "id", label: "Quote reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Amount (ZAR)" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  invoices: {
    title: "Invoices",
    description: "Review invoice documents and their recorded status.",
    resource: "documents", kind: "Invoice",
    columns: [
      { key: "id", label: "Invoice reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Face value (ZAR)" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  calendar: {
    title: "Job calendar",
    description: "Calendar scheduling is not available in the current D1 schema. This module remains read-only and clearly marked.",
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
    description: "Review content records currently stored for the website. Editing remains disabled until publish/rollback and concurrency controls are implemented.",
    resource: "content",
    columns: [
      { key: "content_key", label: "Content key" }, { key: "content_json", label: "Content value" },
      { key: "updated_by", label: "Updated by" }, { key: "updated_at", label: "Updated" },
    ],
  },
  reports: {
    title: "Reports",
    description: "Operational and financial reports require agreed business definitions and additional data fields.",
    columns: [
      { key: "report", label: "Report" }, { key: "period", label: "Period" },
      { key: "last_updated", label: "Last updated" }, { key: "data_status", label: "Data status" },
    ],
  },
  settings: {
    title: "Settings & access",
    description: "Access and service-catalogue settings are not exposed by the current Worker API.",
    columns: [
      { key: "setting", label: "Setting" }, { key: "current_value", label: "Current value" },
      { key: "owner", label: "Owner" }, { key: "last_changed", label: "Last changed" },
    ],
  },
};

const STATUS_OPTIONS: Record<"enquiries" | "jobs", string[]> = {
  enquiries: ["New", "Contacted", "Quoted", "Converted", "Closed"],
  jobs: ["New", "Quoted", "In progress", "Completed", "Cancelled"],
};
const QUOTE_STATUS_OPTIONS = ["Draft", "Sent", "Accepted", "Declined", "Expired", "Cancelled"];
const INVOICE_STATUS_OPTIONS = ["Draft", "Sent", "Paid", "Overdue", "Cancelled"];

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
  if (key === "content_json") {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (serialized === undefined) return "—";
    return serialized.length > 100 ? serialized.slice(0, 100) + "…" : serialized;
  }
  return String(value);
}

function StatusEditor({
  resource, row, onSaved, statusOptions,
}: {
  resource: "enquiries" | "jobs" | "documents";
  row: AdminRow;
  onSaved: () => void;
  statusOptions: string[];
}) {
  const allowed = statusOptions;
  const initial = typeof row.status === "string" ? row.status : "";
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!previewWritesEnabled() || !row.id) return;
    setSaving(true);
    setMessage("");
    try {
      await updateAdminStatus(resource, row.id, value);
      setMessage("Status saved.");
      onSaved();
    } catch (error) {
      setMessage(adminApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  return <div className="status-editor">
    <label className="sr-only" htmlFor={"status-"+String(row.id)}>New status for {String(row.id ?? "record")}</label>
    <select id={"status-"+String(row.id)} value={value} onChange={(event)=>setValue(event.target.value)} disabled={!previewWritesEnabled()||saving}>
      {value && !allowed.includes(value) && <option value={value} disabled>Current status: {value}</option>}
      <option value="" disabled>Choose status</option>
      {allowed.map((status)=><option key={status} value={status}>{status}</option>)}
    </select>
    <button type="button" className="button button-small" onClick={save} disabled={!previewWritesEnabled()||saving||!row.id||!allowed.includes(value)||value===row.status}>{saving?"Saving…":"Save status"}</button>
    {message&&<small className="inline-feedback" role="status">{message}</small>}
  </div>;
}

export default function AdminModuleClient({ moduleKey }: { moduleKey: AdminModuleKey }) {
  const module = MODULES[moduleKey];
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const apiConfigured = Boolean(getAdminApiBase());
  const apiHealthUrl = getAdminApiHealthUrl();
  const writesEnabled = previewWritesEnabled();
  const hasReadEndpoint = Boolean(module.resource);
  const canCreate = ["enquiries", "jobs", "quotes", "invoices"].includes(moduleKey);
  const writeResource = moduleKey === "enquiries" || moduleKey === "jobs" ? moduleKey : "documents";

  const load = useCallback(async (signal: AbortSignal) => {
    if (!getAdminApiBase() || !module.resource) {
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writesEnabled || !apiConfigured) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, unknown> = {
      customer_name: String(data.get("customer_name") ?? "").trim(),
      service: String(data.get("service") ?? "").trim(),
      area: String(data.get("area") ?? "").trim(),
      details: String(data.get("details") ?? "").trim(),
    };
    if (moduleKey === "enquiries") {
      payload.phone = String(data.get("phone") ?? "").trim();
      payload.email = String(data.get("email") ?? "").trim();
    }
    if (moduleKey === "quotes" || moduleKey === "invoices") {
      const amount = Number(data.get("amount"));
      const amountCents = Math.round(amount * 100);
      if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000 || !Number.isSafeInteger(amountCents)) {
        setActionError("Enter a valid non-negative ZAR amount within the supported limit.");
        return;
      }
      payload.kind = module.kind;
      payload.amount_cents = amountCents;
    }
    setSaving(true);
    setActionMessage("");
    setActionError("");
    try {
      await createAdminRecord(writeResource, payload);
      setActionMessage(moduleKey === "jobs" ? "Job created in the preview database." : moduleKey === "enquiries" ? "Enquiry created in the preview database." : moduleKey === "quotes" ? "Draft quotation created in the preview database." : "Invoice document created in the preview database.");
      form.reset();
      setShowCreate(false);
      setRefreshVersion((version)=>version+1);
    } catch (error) {
      setActionError(adminApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !writesEnabled || !apiConfigured) return;
    setUploading(true);
    setUploadMessage("");
    setActionError("");
    try {
      const record = await uploadAdminMedia(file);
      setUploadMessage("Upload stored in the preview media bucket: "+String(record.original_name ?? record.id ?? file.name));
      setRefreshVersion((version)=>version+1);
      event.target.value = "";
    } catch (error) {
      setActionError(adminApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  const title = module.title;
  return <div className="admin-page">
    <div className="admin-page-top">
      <div><p className="eyebrow">NGMS / WORKSPACE</p><h1>{title.toUpperCase()}</h1><p>{module.description}</p></div>
      <Link href="/admin" className="button button-outline button-dark-outline">← Overview</Link>
    </div>
    <div className="api-notice" role="status">
      <span className="notice-dot" aria-hidden="true"/>
      <div><strong>{error ? "API data is unavailable" : loading ? "Loading records" : !module.resource ? "API route not implemented" : !apiConfigured ? "Preview integration pending" : "Read-only API connection"}</strong>
        <p>{error ? error : !module.resource ? "The Worker does not expose this module. No demo records are displayed." : !apiConfigured ? adminApiConfigurationMessage() + " No request was sent and no data is simulated." : "Reads use the approved preview Worker. Any write controls remain disabled by default until preview authentication and persistence tests are approved."}</p>
        {apiHealthUrl&&<p><a className="text-link" href={apiHealthUrl} target="_blank" rel="noopener noreferrer">Open secure API sign-in / health check ↗</a> <span className="module-footnote">After signing in, return here and refresh records.</span></p>}
      </div>
    </div>

    {canCreate && <section className="action-panel">
      <div className="action-panel-head"><div><strong>Create {moduleKey==="enquiries"?"enquiry":moduleKey==="jobs"?"job":moduleKey==="quotes"?"quotation":"invoice"}</strong><small>New records are only allowed when the explicit preview-write flag is enabled.</small></div>
        <button type="button" className="button button-orange" onClick={()=>{setShowCreate(v=>!v);setActionMessage("");setActionError("");}} disabled={!writesEnabled||!apiConfigured}>{showCreate?"Close form":"+ New record"}</button>
      </div>
      {!writesEnabled&&<p className="guardrail-message">Writes disabled: enable NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES only after Access, CORS and staging persistence checks pass.</p>}
      {showCreate&&writesEnabled&&apiConfigured&&<form className="admin-form-grid" onSubmit={handleCreate}>
        <label>Customer / contact name<input name="customer_name" required maxLength={160} autoComplete="off"/></label>
        <label>Service<select name="service" defaultValue="" required><option value="" disabled>Choose service</option>{services.map((service)=><option key={service.slug} value={service.name}>{service.name}</option>)}</select></label>
        {(moduleKey==="quotes"||moduleKey==="invoices")&&<label>Amount (ZAR)<input name="amount" type="number" inputMode="decimal" min="0" max="100000000" step="0.01" required/></label>}
        <label>Area / suburb<input name="area" maxLength={160} autoComplete="off"/></label>
        {moduleKey==="enquiries"&&<><label>Phone<input name="phone" type="tel" maxLength={40} autoComplete="off"/></label><label>Email<input name="email" type="email" maxLength={254} autoComplete="off"/></label></>}
        <label className="admin-form-wide">Job details<textarea name="details" rows={3} maxLength={4000}/></label>
        <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving}>{saving?"Saving…":"Create in preview"}</button><span>Records are written only to the isolated preview D1 database.</span></div>
      </form>}
    </section>}

    {moduleKey==="media"&&<section className="action-panel"><div className="action-panel-head"><div><strong>Upload media</strong><small>JPEG, PNG, WebP, AVIF or PDF · maximum 10 MB.</small></div><span className="preview-pill">PREVIEW BUCKET</span></div><label className="upload-control">Choose a file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" disabled={!writesEnabled||!apiConfigured||uploading} onChange={handleUpload}/></label>{uploading&&<p className="inline-feedback" role="status">Uploading to preview storage…</p>}{uploadMessage&&<p className="inline-feedback" role="status">{uploadMessage}</p>}{!writesEnabled&&<p className="guardrail-message">Uploads remain disabled until preview Access/CORS and persistence checks are approved.</p>}</section>}

    {(actionMessage||actionError)&&<div className={actionError?"action-result action-result-error":"action-result"} role="status"><strong>{actionError?"Action failed":"Action complete"}</strong><p>{actionError||actionMessage}</p></div>}

    <section className="data-panel">
      <div className="data-toolbar"><div><strong>{title}</strong><small>{error?"Could not verify the current record count":loading?"Retrieving from protected API…":hasReadEndpoint&&apiConfigured?rows.length+" records returned by API":"Live record retrieval is not active"}</small></div>
        <input aria-label={"Search "+title} placeholder="Search loaded records…" value={query} onChange={(event)=>setQuery(event.target.value)} disabled={!rows.length}/>
        <button className="button button-orange" type="button" onClick={()=>setRefreshVersion((v)=>v+1)} disabled={loading||!module.resource||!apiConfigured}>Refresh</button>
      </div>
      {loading?<div className="table-empty" role="status"><span aria-hidden="true">◌</span><h2>LOADING RECORDS</h2><p>Waiting for the protected Cloudflare API response.</p></div>
      :error?<div className="table-empty"><span aria-hidden="true">!</span><h2>RECORDS COULD NOT BE LOADED.</h2><p>No empty list or zero balance is substituted for an API error.</p><button className="button button-outline button-dark-outline" type="button" onClick={()=>setRefreshVersion((v)=>v+1)}>Try again</button></div>
      :!module.resource?<div className="table-empty"><span aria-hidden="true">⌁</span><h2>ENDPOINT NOT YET IMPLEMENTED.</h2><p>This module needs a documented API route and approved business definitions before its data can be displayed.</p></div>
      :!apiConfigured?<div className="table-empty"><span aria-hidden="true">⌁</span><h2>CONNECT THE PREVIEW API.</h2><p>Set the non-secret API base URL in Vercel Preview. Cloudflare Access and the preview origin allowlist must also match.</p></div>
      :rows.length===0?<div className="table-empty"><span aria-hidden="true">▤</span><h2>NO RECORDS RETURNED.</h2><p>The protected API returned an empty collection for this module. This is not an API error.</p></div>
      :visibleRows.length===0?<div className="table-empty"><span aria-hidden="true">⌕</span><h2>NO MATCHES.</h2><p>Try a different search term.</p></div>
      :<div className="table-scroll"><table><thead><tr>{module.columns.map((column)=><th key={column.key}>{column.label}</th>)}{moduleKey==="media"&&<th>File action</th>}{writesEnabled&&["enquiries","jobs","quotes","invoices"].includes(moduleKey)&&<th>Preview action</th>}</tr></thead>
        <tbody>{visibleRows.map((row,index)=><tr key={String(row.id??row.content_key??index)}>{module.columns.map((column)=><td key={column.key}>{displayValue(column.key,row[column.key])}</td>)}{moduleKey==="media"&&<td>{getAdminMediaDownloadUrl(row.id)?<a className="text-link" href={getAdminMediaDownloadUrl(row.id)} target="_blank" rel="noopener noreferrer">Open / download ↗</a>:<span className="inline-feedback">File link unavailable</span>}</td>}{writesEnabled&&["enquiries","jobs","quotes","invoices"].includes(moduleKey)&&module.resource&&["enquiries","jobs","documents"].includes(module.resource)&&<td><StatusEditor resource={module.resource as "enquiries"|"jobs"|"documents"} statusOptions={module.resource === "documents" ? (module.kind === "Quotation" ? QUOTE_STATUS_OPTIONS : INVOICE_STATUS_OPTIONS) : STATUS_OPTIONS[module.resource as "enquiries"|"jobs"]} row={row} onSaved={()=>setRefreshVersion((version)=>version+1)}/></td>}</tr>)}</tbody></table></div>}
    </section>
    {moduleKey==="invoices"&&<p className="module-footnote">The inspected document schema stores invoice face value and status, but has no partial-payment ledger. This screen does not calculate a reconciled amount due.</p>}
    {moduleKey==="content"&&<p className="module-footnote">Content editing remains disabled until optimistic concurrency, publish/rollback and the owner-approved field schema are implemented.</p>}
    <p className="module-footnote">Preview write controls require NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=true. The Worker independently verifies Cloudflare Access identity for every protected action.</p>
  </div>;
}
