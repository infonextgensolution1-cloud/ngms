"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminRow, adminApiConfigurationMessage, adminApiErrorMessage, convertAcceptedQuotationToJob, createAdminCustomer, createAdminRecord, createAdminSchedule,
  createCommercialDocument, createCommercialShareLink, convertEnquiryToCustomer, getAdminApiBase, getAdminApiHealthUrl, getAdminMediaDownloadUrl,
  previewWritesEnabled, readAdminCollection, readAdminCustomers, readCommercialDocument, readCommercialDocuments,
  readInvoicePayments, recordInvoicePayment, updateAdminMediaMetadata, replaceAdminMedia, deleteAdminMedia, updateAdminStatus, updateCommercialDocumentStatus, uploadAdminMedia,
  AdminPublishingSnapshot, cmsWritesEnabled, readAdminPublishing, saveAdminCmsDraft, requestAdminPublication, reviewAdminPublication, rollbackAdminPublication,
} from "@/lib/admin-api";
import { services } from "@/lib/site";

export type AdminModuleKey =
  | "enquiries" | "jobs" | "quotes" | "invoices" | "calendar"
  | "media" | "content" | "reports" | "settings";

type Column = { key: string; label: string };
type ModuleDefinition = {
  title: string;
  description: string;
  resource?: "enquiries" | "jobs" | "documents" | "media" | "content" | "schedules" | "reports" | "settings";
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
    description: "Create formal, numbered quotations with CRM customers, itemised work, discounts and VAT.",
    resource: "documents", kind: "Quotation",
    columns: [
      { key: "reference", label: "Quote reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Amount (ZAR)" }, { key: "line_item_count", label: "Items" },
      { key: "integrity_status", label: "Data check" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  invoices: {
    title: "Invoices",
    description: "Create invoices directly from accepted quotations, preserving their approved line items and VAT treatment.",
    resource: "documents", kind: "Invoice",
    columns: [
      { key: "reference", label: "Invoice reference" }, { key: "customer_name", label: "Customer" },
      { key: "amount_cents", label: "Face value (ZAR)" }, { key: "line_item_count", label: "Items" },
      { key: "integrity_status", label: "Data check" }, { key: "created_at", label: "Created" },
      { key: "status", label: "Status" },
    ],
  },
  calendar: {
    title: "Job calendar",
    description: "Review scheduled work from the protected Cloudflare D1 calendar. Appointments are ordered by scheduled start time.",
    resource: "schedules",
    columns: [
      { key: "title", label: "Appointment" }, { key: "customer_name", label: "Customer / site" },
      { key: "service", label: "Service" }, { key: "area", label: "Area" },
      { key: "assigned_to", label: "Assigned to" }, { key: "scheduled_start", label: "Starts" },
      { key: "scheduled_end", label: "Ends" }, { key: "status", label: "Status" },
    ],
  },
  media: {
    title: "Media library",
    description: "Review stored media metadata and approved website assets.",
    resource: "media",
    columns: [
      { key: "original_name", label: "Asset" }, { key: "category", label: "Category" }, { key: "content_type", label: "Type" },
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
    description: "Live operational and verified commercial summary from the isolated Cloudflare preview database.",
    resource: "reports",
    columns: [
      { key: "metric", label: "Metric" }, { key: "value", label: "Value" },
      { key: "detail", label: "Detail" }, { key: "data_status", label: "Data quality / scope" },
    ],
  },
  settings: {
    title: "Settings & access",
    description: "Review safe commercial preferences and infrastructure ownership. Authentication and security policies remain managed in Cloudflare.",
    resource: "settings",
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
// Customer decisions arrive through the one-use public quote link; sharing changes Draft to Sent.
const QUOTE_STATUS_OPTIONS = ["Draft", "Expired", "Cancelled"];
const INVOICE_STATUS_OPTIONS = ["Draft", "Sent", "Overdue", "Cancelled"];
const SCHEDULE_STATUS_OPTIONS = ["Scheduled", "Confirmed", "In progress", "Completed", "Cancelled"];

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
  if ((key === "created_at" || key === "updated_at" || key === "scheduled_start" || key === "scheduled_end" || key === "last_changed") && typeof value === "string" && value !== "System default" && value !== "Managed outside the NGMS dashboard") {
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
  resource: "enquiries" | "jobs" | "documents" | "schedules";
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
      if (resource === "documents") {
        await updateCommercialDocumentStatus(row.id, value);
      } else {
        await updateAdminStatus(resource, row.id, value);
      }
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

function localDateTimeValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function CommercialDocumentDetails({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof readCommercialDocument>> | null>(null);
  useEffect(() => {
    if (!open || detail) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    readCommercialDocument(id, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDetail(result); })
      .catch((e) => { if (!controller.signal.aborted) setError(adminApiErrorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, id, detail]);
  return <div className="mt-1">
    <button type="button" className="button button-small button-outline button-dark-outline" onClick={() => setOpen((value) => !value)}>{open ? "Hide lines" : "View lines"}</button>
    {open && <div className="mt-2 min-w-[240px] rounded-card border border-darkgrey p-3">
      {loading ? <small>Loading saved line items…</small> : error ? <small className="text-orange">{error}</small> : detail ? <>
        <strong className="text-sm">Saved quotation / invoice lines</strong>
        <ul className="mt-2 space-y-2">{detail.lines.map((line,index)=><li key={line.id ?? index} className="border-b border-darkgrey pb-2 text-xs">
          <div className="font-semibold">{line.description}</div>
          <div className="text-mist">{line.quantity} {line.unit} × {displayValue("amount_cents",line.unit_price_cents)} = {displayValue("amount_cents",line.line_total_cents)}</div>
        </li>)}</ul>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between gap-4"><span>Subtotal</span><strong>{displayValue("amount_cents",detail.item.subtotal_cents)}</strong></div>
          <div className="flex justify-between gap-4"><span>Discount</span><strong>{displayValue("amount_cents",detail.item.discount_cents)}</strong></div>
          <div className="flex justify-between gap-4"><span>VAT</span><strong>{displayValue("amount_cents",detail.item.vat_cents)}</strong></div>
          <div className="flex justify-between gap-4 border-t border-darkgrey pt-1"><span>Total</span><strong>{displayValue("amount_cents",detail.item.amount_cents)}</strong></div>
        </div>
        {typeof detail.item.notes === "string" && detail.item.notes && <p className="mt-2 text-xs text-mist whitespace-pre-wrap">{detail.item.notes}</p>}
      </> : <small>No document details returned.</small>}
    </div>}
  </div>;
}

function ShareQuotationAction({ row, onUpdated, enquiries }: { row: AdminRow; onUpdated: () => void; enquiries: AdminRow[] }) {
  const [saving,setSaving] = useState(false);
  const [share,setShare] = useState<{url:string;expires_at:string;reference:string} | null>(null);
  const [message,setMessage] = useState("");
  const [enquiryId,setEnquiryId] = useState("");
  const canShare = row.status === "Draft" || row.status === "Sent";
  const matchingEnquiries = enquiries.filter((item) =>
    item.customer_id === row.customer_id && ["Contacted", "Quoted"].includes(String(item.status ?? ""))
  );
  async function shareQuote() {
    if (!previewWritesEnabled() || !row.id || !canShare || !enquiryId || share) return;
    setSaving(true); setMessage("");
    try {
      setShare(await createCommercialShareLink(String(row.id), enquiryId));
      setMessage("Customer quotation link created. The originating enquiry is now marked Quoted.");
      onUpdated();
    } catch (error) { setMessage(adminApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  async function copyLink() {
    if (!share?.url) return;
    try { await navigator.clipboard.writeText(share.url); setMessage("Customer link copied."); }
    catch { setMessage("Copy is unavailable here. Select and copy the link below."); }
  }
  return <div className="mt-2">
    {matchingEnquiries.length > 0 ? <label className="block mb-2 text-xs">Originating enquiry
      <select className="w-full mt-1" value={enquiryId} onChange={(event)=>setEnquiryId(event.target.value)} disabled={!previewWritesEnabled()||saving||Boolean(share)}>
        <option value="">Select the enquiry for this quotation</option>
        {matchingEnquiries.map((item)=><option key={String(item.id)} value={String(item.id)}>{String(item.id)} · {String(item.service ?? "Service")} · {String(item.area ?? "Area")}</option>)}
      </select>
    </label> : <small className="module-footnote block mb-2">No Contacted/Quoted enquiry is linked to this CRM customer. Convert the originating enquiry to CRM first.</small>}
    <button type="button" className="button button-small button-orange" onClick={shareQuote} disabled={!previewWritesEnabled()||saving||!row.id||!canShare||!enquiryId||Boolean(share)}>{saving ? "Creating link…" : share ? "Link created" : "Approve & issue quotation"}</button>
    {share && <div className="mt-2 max-w-[340px]">
      <a className="text-link break-all text-xs" href={share.url} target="_blank" rel="noopener noreferrer">{share.url}</a>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" className="button button-small button-outline button-dark-outline" onClick={copyLink}>Copy link</button>
        <span className="text-xs text-mist">Expires {new Date(share.expires_at).toLocaleDateString("en-ZA")}</span>
      </div>
    </div>}
    {message && <small className="inline-feedback block mt-1" role="status">{message}</small>}
    {!previewWritesEnabled() && <small className="module-footnote block mt-1">Sharing is disabled until preview Access and persistence tests pass.</small>}
  </div>;
}

function ConvertQuotationToJobAction({ row, onUpdated }: { row: AdminRow; onUpdated: () => void }) {
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  async function convert() {
    if (!previewWritesEnabled() || !row.id) return;
    setSaving(true); setMessage("");
    try {
      const job = await convertAcceptedQuotationToJob(row.id);
      setMessage("Job " + String(job.id ?? "") + " created from the accepted quotation.");
      onUpdated();
    } catch (error) { setMessage(adminApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  return <div className="mt-2">
    <button type="button" className="button button-small button-orange" onClick={convert} disabled={!previewWritesEnabled()||saving||!row.id||row.status!=="Accepted"}>{saving ? "Creating job…" : "Convert to job"}</button>
    {message && <small className="inline-feedback block mt-1" role="status">{message}</small>}
  </div>;
}

function InvoicePaymentsPanel({ row, onUpdated }: { row: AdminRow; onUpdated: () => void }) {
  const [open,setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [summary,setSummary] = useState<Awaited<ReturnType<typeof readInvoicePayments>> | null>(null);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [dateValue,setDateValue] = useState(localDateTimeValue());
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!row.id) return;
    setLoading(true); setError("");
    try {
      const result = await readInvoicePayments(row.id,signal);
      if (!signal?.aborted) setSummary(result);
    } catch (e) { if (!signal?.aborted) setError(adminApiErrorMessage(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  },[row.id]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  },[open,load]);
  async function addPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!previewWritesEnabled() || !row.id) return;
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("amount"));
    const method = String(data.get("method") ?? "EFT") as "EFT"|"Cash"|"Card"|"Other";
    const paidDate = new Date(String(data.get("paid_at") ?? ""));
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(paidDate.getTime())) { setError("Enter a valid payment amount and date."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await recordInvoicePayment(row.id,{
        amount, method, paid_at: paidDate.toISOString(),
        reference: String(data.get("reference") ?? "").trim(),
        notes: String(data.get("notes") ?? "").trim(),
      });
      setMessage("Payment saved. Outstanding balance: " + displayValue("amount_cents",result.balance_cents) + ".");
      setDateValue(localDateTimeValue());
      await load();
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }
  return <div className="mt-2">
    <button type="button" className="button button-small button-outline button-dark-outline" onClick={()=>setOpen((value)=>!value)}>{open ? "Hide payments" : "Payments & balance"}</button>
    {open && <div className="mt-2 min-w-[260px] max-w-[380px] rounded-card border border-darkgrey p-3">
      {loading && !summary ? <small>Loading invoice payments…</small> : error && !summary ? <small className="text-orange">{error}</small> : summary ? <>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-mist block">Paid to date</span><strong>{displayValue("amount_cents",summary.paid_cents)}</strong></div>
          <div><span className="text-mist block">Balance due</span><strong>{displayValue("amount_cents",summary.balance_cents)}</strong></div>
        </div>
        {summary.items.length ? <ul className="mt-3 space-y-2">{summary.items.map(payment=><li key={payment.id} className="border-t border-darkgrey pt-2 text-xs">
          <div className="flex justify-between gap-2"><strong>{displayValue("amount_cents",payment.amount_cents)}</strong><span>{payment.method}</span></div>
          <div className="text-mist">{new Date(payment.paid_at).toLocaleString("en-ZA")} · {payment.reference || "No reference"}</div>
          {payment.notes && <p className="text-mist">{payment.notes}</p>}
        </li>)}</ul> : <p className="mt-2 text-xs text-mist">No payments recorded yet.</p>}
        {summary.balance_cents > 0 ? <form className="mt-3 border-t border-darkgrey pt-3 space-y-2" onSubmit={addPayment}>
          <strong className="text-sm">Record payment</strong>
          <label className="block text-xs">Amount (ZAR)<input name="amount" type="number" min="0.01" max="100000000" step="0.01" required disabled={!previewWritesEnabled()||saving}/></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">Method<select name="method" defaultValue="EFT" disabled={!previewWritesEnabled()||saving}><option>EFT</option><option>Cash</option><option>Card</option><option>Other</option></select></label>
            <label className="block text-xs">Date & time<input name="paid_at" type="datetime-local" value={dateValue} onChange={(event)=>setDateValue(event.target.value)} required disabled={!previewWritesEnabled()||saving}/></label>
          </div>
          <label className="block text-xs">Reference<input name="reference" maxLength={120} disabled={!previewWritesEnabled()||saving}/></label>
          <label className="block text-xs">Notes<textarea name="notes" rows={2} maxLength={1000} disabled={!previewWritesEnabled()||saving}/></label>
          <button type="submit" className="button button-small button-orange" disabled={!previewWritesEnabled()||saving}>{saving?"Saving payment…":"Save payment"}</button>
          {!previewWritesEnabled() && <small className="module-footnote block">Payment recording is disabled until preview write acceptance is approved.</small>}
        </form> : <p className="mt-3 text-xs font-semibold">Invoice paid in full.</p>}
      </> : null}
      {message && <small className="inline-feedback block mt-2" role="status">{message}</small>}
      {error && summary && <small className="text-orange block mt-2" role="alert">{error}</small>}
    </div>}
  </div>;
}

function ConvertEnquiryToCrmAction({ row, onUpdated }: { row: AdminRow; onUpdated: () => void }) {
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  async function convert() {
    if (!previewWritesEnabled() || !row.id || saving) return;
    setSaving(true); setMessage("");
    try {
      const result = await convertEnquiryToCustomer(String(row.id));
      setMessage("Linked to CRM customer " + String(result.item.display_name ?? result.item.id ?? "") + ".");
      onUpdated();
    } catch (error) { setMessage(adminApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  if (row.customer_id) return <div className="min-w-[190px]"><span className="preview-pill">LINKED TO CRM</span><small className="module-footnote block mt-1">Prepare a quotation in Quotations and select this enquiry when issuing it.</small></div>;
  return <div className="min-w-[190px]">
    <button type="button" className="button button-small button-orange" onClick={convert} disabled={!previewWritesEnabled()||saving||!row.id}>{saving ? "Linking…" : "Add to CRM"}</button>
    {message && <small className="inline-feedback block mt-1" role="status">{message}</small>}
  </div>;
}

function CommercialDocumentActions({ moduleKey, row, onUpdated, enquiries }: { moduleKey: "quotes"|"invoices"; row: AdminRow; onUpdated: () => void; enquiries: AdminRow[] }) {
  const documentComplete = Boolean(row.reference) && row.integrity_status === "Complete" && Number(row.line_item_count) > 0;
  return <div className="min-w-[260px]">
    <CommercialDocumentDetails id={String(row.id ?? "")}/>
    {!documentComplete ? <small className="module-footnote block mt-2">Legacy record — {String(row.integrity_status ?? "incomplete")}. Customer issue, payment and job-conversion actions are blocked until the document is accurately reconstructed.</small>
    : moduleKey === "quotes" ? <>
      {(row.status === "Draft" || row.status === "Sent") && <ShareQuotationAction row={row} onUpdated={onUpdated} enquiries={enquiries}/>}
      {row.status === "Accepted" && (row.job_id
        ? <div className="mt-2"><span className="preview-pill">JOB CREATED</span><small className="module-footnote block mt-1">{String(row.job_id)}</small></div>
        : <ConvertQuotationToJobAction row={row} onUpdated={onUpdated}/>) }
      {row.status === "Declined" && <small className="text-mist block mt-2">Customer declined this quotation.</small>}
    </> : <InvoicePaymentsPanel row={row} onUpdated={onUpdated}/>}
  </div>;
}



const MEDIA_CATEGORIES = ["Uncategorised", "Branding", "Project Photos", "Before & After", "Website", "Documents"];

function AdminMediaPreview({ row }: { row: AdminRow }) {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const mediaUrl = getAdminMediaDownloadUrl(row.id);
  const isImage = typeof row.content_type === "string" && row.content_type.startsWith("image/");

  useEffect(() => {
    if (!mediaUrl || !isImage) {
      setSource("");
      setError("");
      return;
    }
    const controller = new AbortController();
    let objectUrl = "";
    setSource("");
    setError("");
    fetch(mediaUrl, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Preview unavailable");
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!controller.signal.aborted) setSource(objectUrl);
      })
      .catch(() => { if (!controller.signal.aborted) setError("Preview unavailable"); });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaUrl, isImage, row.updated_at, row.size_bytes]);

  if (!isImage) return <div className="flex h-20 w-28 items-center justify-center rounded-card border border-darkgrey text-xs text-mist">PDF / FILE</div>;
  return <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-card border border-darkgrey bg-black/20">
    {source ? <img src={source} alt={String(row.alt_text ?? row.original_name ?? "NGMS media")} className="h-full w-full object-cover"/> : <span className="text-xs text-mist">{error || "Loading…"}</span>}
  </div>;
}

function MediaItemActions({ row, apiConfigured, writesEnabled, onUpdated }: {
  row: AdminRow;
  apiConfigured: boolean;
  writesEnabled: boolean;
  onUpdated: () => void;
}) {
  const [category, setCategory] = useState(String(row.category ?? "Uncategorised"));
  const [altText, setAltText] = useState(String(row.alt_text ?? ""));
  const [tagsText, setTagsText] = useState(() => {
    try {
      const parsed = JSON.parse(String(row.tags_json ?? "[]"));
      return Array.isArray(parsed) ? parsed.join(", ") : "";
    } catch { return ""; }
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveMetadata() {
    if (!row.id || !apiConfigured || !writesEnabled || saving) return;
    const tags = Array.from(new Set(tagsText.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
    if (tags.length > 12 || tags.some((tag) => tag.length > 40)) {
      setError("Use up to 12 tags, each no longer than 40 characters.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    try {
      await updateAdminMediaMetadata(String(row.id), { category, alt_text: altText.trim(), tags });
      setMessage("Asset details saved.");
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function replaceFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !row.id || !apiConfigured || !writesEnabled) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await replaceAdminMedia(String(row.id), file);
      setMessage("Asset file replaced. Existing project links remain attached.");
      onUpdated();
      event.target.value = "";
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function removeFile() {
    if (!row.id || !apiConfigured || !writesEnabled || saving) return;
    const accepted = window.confirm("Delete this file from the preview media library? Project-linked images are protected and cannot be deleted.");
    if (!accepted) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await deleteAdminMedia(String(row.id));
      setMessage("Asset deleted from preview storage.");
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  return <div className="min-w-[250px] max-w-[340px] space-y-2">
    <a className="text-link text-xs" href={getAdminMediaDownloadUrl(row.id)} target="_blank" rel="noopener noreferrer">Open / download ↗</a>
    <label className="block text-xs">Category<select className="mt-1 w-full" value={category} onChange={(event)=>setCategory(event.target.value)} disabled={!apiConfigured||!writesEnabled||saving}>
      {MEDIA_CATEGORIES.map((item)=><option key={item} value={item}>{item}</option>)}
    </select></label>
    <label className="block text-xs">Alt text<input className="mt-1 w-full" value={altText} onChange={(event)=>setAltText(event.target.value)} maxLength={240} disabled={!apiConfigured||!writesEnabled||saving} placeholder="Describe the image for accessibility"/></label>
    <label className="block text-xs">Tags<input className="mt-1 w-full" value={tagsText} onChange={(event)=>setTagsText(event.target.value)} disabled={!apiConfigured||!writesEnabled||saving} placeholder="e.g. solar, strand, before"/></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button button-small button-outline button-dark-outline" onClick={saveMetadata} disabled={!apiConfigured||!writesEnabled||saving}>Save details</button>
      <label className="button button-small button-outline button-dark-outline cursor-pointer">Replace<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" onChange={replaceFile} disabled={!apiConfigured||!writesEnabled||saving}/></label>
      <button type="button" className="button button-small button-outline button-dark-outline" onClick={removeFile} disabled={!apiConfigured||!writesEnabled||saving}>Delete</button>
    </div>
    {message&&<small className="inline-feedback block" role="status">{message}</small>}
    {error&&<small className="text-orange block" role="alert">{error}</small>}
  </div>;
}


function CmsDraftEditor({ row, apiConfigured, writesEnabled, onUpdated }: {
  row: AdminRow;
  apiConfigured: boolean;
  writesEnabled: boolean;
  onUpdated: () => void;
}) {
  const key = String(row.content_key ?? "");
  const moduleKey = key.startsWith("cms_draft.") ? key.slice("cms_draft.".length) : "";
  const initialValue = typeof row.content_json === "string" ? row.content_json : JSON.stringify(row.content_json ?? {}, null, 2);
  const [draftText, setDraftText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveDraft() {
    if (!apiConfigured || !writesEnabled || saving || !moduleKey) return;
    let parsed: unknown;
    try { parsed = JSON.parse(draftText); }
    catch { setError("Draft must be valid JSON before it can be saved."); return; }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setError("Draft JSON must be a page object.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    try {
      await saveAdminCmsDraft(moduleKey, parsed as Record<string, unknown>);
      setMessage("CMS draft saved to preview D1.");
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function submitForReview() {
    if (!apiConfigured || !writesEnabled || requesting || !moduleKey) return;
    setRequesting(true); setError(""); setMessage("");
    try {
      const result = await requestAdminPublication(moduleKey);
      setMessage("Publication request " + result.requestId + " created. A different authorised administrator must approve it.");
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setRequesting(false); }
  }

  let parsedPreview: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(draftText);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) parsedPreview = parsed as Record<string, unknown>;
  } catch { /* Invalid JSON is reported when the owner attempts to save. */ }
  const blockCount = Array.isArray(parsedPreview?.blocks) ? parsedPreview.blocks.length : 0;

  return <section className="action-panel">
    <div className="action-panel-head"><div><strong>Draft editor · {moduleKey}</strong><small>Versioned CMS draft. Publication is a separate, second-person approval.</small></div><span className="preview-pill">PREVIEW CMS</span></div>
    <div className="grid gap-2 text-xs md:grid-cols-3">
      <div><span className="text-mist block">Page title</span><strong>{String(parsedPreview?.title ?? "Draft title not set")}</strong></div>
      <div><span className="text-mist block">URL slug</span><strong>{String(parsedPreview?.slug ?? moduleKey)}</strong></div>
      <div><span className="text-mist block">Content blocks</span><strong>{blockCount}</strong></div>
    </div>
    <label className="block text-xs mt-3">Draft JSON
      <textarea className="mt-1 w-full font-mono text-xs" rows={12} value={draftText} onChange={(event)=>setDraftText(event.target.value)} spellCheck={false} disabled={!apiConfigured||!writesEnabled||saving||requesting}/>
    </label>
    <div className="flex flex-wrap gap-2 mt-3">
      <button type="button" className="button button-small button-outline button-dark-outline" onClick={saveDraft} disabled={!apiConfigured||!writesEnabled||saving||requesting}>{saving?"Saving draft…":"Save draft"}</button>
      <button type="button" className="button button-small button-orange" onClick={submitForReview} disabled={!apiConfigured||!writesEnabled||saving||requesting}>{requesting?"Submitting…":"Request publication approval"}</button>
    </div>
    {!writesEnabled&&<p className="guardrail-message mt-2">CMS editing and publication requests are disabled on this preview. Both the preview-write flag and the CMS-specific Worker flag must be approved before writes can be enabled.</p>}
    {message&&<p className="inline-feedback mt-2" role="status">{message}</p>}
    {error&&<p className="action-result action-result-error mt-2" role="alert">{error}</p>}
  </section>;
}

function CmsPublishingReview({ apiConfigured, writesEnabled, onUpdated }: {
  apiConfigured: boolean;
  writesEnabled: boolean;
  onUpdated: () => void;
}) {
  const [snapshot,setSnapshot] = useState<AdminPublishingSnapshot | null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [note,setNote] = useState("");
  const [busyRequest,setBusyRequest] = useState("");
  const [message,setMessage] = useState("");
  const [rollbackTarget,setRollbackTarget] = useState("");
  const [rollbackNote,setRollbackNote] = useState("");
  const [rollbackBusy,setRollbackBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!apiConfigured) { setSnapshot(null); return; }
    setLoading(true); setError("");
    try {
      const data = await readAdminPublishing(signal);
      if (!signal?.aborted) setSnapshot(data);
    } catch (e) { if (!signal?.aborted) setError(adminApiErrorMessage(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  },[apiConfigured]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  },[load]);

  async function review(requestId: string, decision: "approve"|"reject") {
    if (!writesEnabled || busyRequest) return;
    setBusyRequest(requestId); setError(""); setMessage("");
    try {
      const result = await reviewAdminPublication(requestId,decision,note);
      setMessage(result.published ? "CMS publication approved and versioned." : "CMS publication request rejected.");
      setNote("");
      await load();
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setBusyRequest(""); }
  }

  async function rollback() {
    if (!writesEnabled || !rollbackTarget || rollbackBusy) return;
    const version = snapshot?.history.find((item)=>item.id===rollbackTarget);
    if (!version) return;
    setRollbackBusy(true); setError(""); setMessage("");
    try {
      await rollbackAdminPublication(version.module_key,version.id,rollbackNote);
      setMessage("A new rollback publication was created from the selected historical version.");
      setRollbackNote(""); setRollbackTarget("");
      await load();
      onUpdated();
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setRollbackBusy(false); }
  }

  return <section className="data-panel">
    <div className="data-toolbar"><div><strong>Publication review & history</strong><small>{loading?"Loading publication records…":snapshot ? snapshot.requests.length+" requests · "+snapshot.current.length+" live modules · "+snapshot.history.length+" versions":"Publication records unavailable"}</small></div>
      <button type="button" className="button button-outline button-dark-outline" onClick={()=>void load()} disabled={!apiConfigured||loading}>Refresh</button>
    </div>
    {error&&<p className="action-result action-result-error" role="alert">{error}</p>}
    {message&&<p className="inline-feedback" role="status">{message}</p>}
    {!apiConfigured?<div className="table-empty"><h2>CONNECT THE PREVIEW API</h2><p>Publication history is read from the protected preview Worker.</p></div>
    :loading&&!snapshot?<div className="table-empty"><h2>LOADING PUBLICATION RECORDS</h2></div>
    :snapshot&&<>
      <div className="p-3 border-b border-darkgrey">
        <strong className="text-sm">Pending review</strong>
        {snapshot.requests.filter((request)=>request.status==="Pending").length===0
          ? <p className="text-xs text-mist mt-2">No publication requests are awaiting review.</p>
          : <div className="mt-2 space-y-3">{snapshot.requests.filter((request)=>request.status==="Pending").map((request)=><div key={request.id} className="rounded-card border border-darkgrey p-3">
            <div className="flex flex-wrap justify-between gap-2"><strong>{request.module_key} · /{request.slug}</strong><span className="preview-pill">PENDING</span></div>
            <p className="text-xs text-mist mt-1">Requested by {request.requested_by} · {displayValue("created_at",request.created_at)}</p>
            <label className="block text-xs mt-2">Reviewer note<input className="w-full mt-1" value={note} onChange={(event)=>setNote(event.target.value)} maxLength={1000} disabled={!writesEnabled||Boolean(busyRequest)}/></label>
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" className="button button-small button-orange" onClick={()=>void review(request.id,"approve")} disabled={!writesEnabled||Boolean(busyRequest)}>{busyRequest===request.id?"Reviewing…":"Approve & publish"}</button>
              <button type="button" className="button button-small button-outline button-dark-outline" onClick={()=>void review(request.id,"reject")} disabled={!writesEnabled||Boolean(busyRequest)}>Reject request</button>
            </div>
            <small className="module-footnote block mt-2">The Worker enforces independent approval: the person who requested publication cannot approve or reject their own request.</small>
          </div>)}</div>}
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-2">
        <div><strong className="text-sm">Currently published</strong>
          {snapshot.current.length ? <ul className="mt-2 space-y-2 text-xs">{snapshot.current.map((item)=><li key={item.module_key} className="border-t border-darkgrey pt-2"><strong>{item.module_key} · /{item.slug}</strong><div className="text-mist">Published {displayValue("created_at",item.published_at)} by {item.published_by}</div><div className="text-mist">Version {item.publication_id}</div></li>)}</ul> : <p className="text-xs text-mist mt-2">No CMS publication is recorded as live in this preview database.</p>}
        </div>
        <div><strong className="text-sm">Version history</strong>
          {snapshot.history.length ? <ul className="mt-2 space-y-2 text-xs">{snapshot.history.slice(0,10).map((item)=><li key={item.id} className="border-t border-darkgrey pt-2"><strong>{item.module_key} · /{item.slug}</strong><div className="text-mist">{displayValue("created_at",item.published_at)} · {item.published_by}</div><div className="text-mist">Version {item.id}</div></li>)}</ul> : <p className="text-xs text-mist mt-2">No historical publication versions.</p>}
        </div>
      </div>
      <div className="p-3 border-t border-darkgrey">
        <strong className="text-sm">Rollback to a previous version</strong>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] mt-2">
          <select value={rollbackTarget} onChange={(event)=>setRollbackTarget(event.target.value)} disabled={!writesEnabled||rollbackBusy}>
            <option value="">Select a previous publication</option>
            {snapshot.history.map((item)=><option key={item.id} value={item.id}>{item.module_key} · /{item.slug} · {new Date(item.published_at).toLocaleDateString("en-ZA")}</option>)}
          </select>
          <input value={rollbackNote} onChange={(event)=>setRollbackNote(event.target.value)} maxLength={1000} placeholder="Rollback reason" disabled={!writesEnabled||rollbackBusy}/>
          <button type="button" className="button button-small button-outline button-dark-outline" onClick={rollback} disabled={!writesEnabled||!rollbackTarget||rollbackBusy}>{rollbackBusy?"Rolling back…":"Create rollback version"}</button>
        </div>
        {!writesEnabled&&<p className="guardrail-message mt-2">Approvals and rollbacks are disabled in this preview environment.</p>}
      </div>
      <div className="p-3 border-t border-darkgrey">
        <strong className="text-sm">Audit trail</strong>
        {snapshot.audit.length ? <ul className="mt-2 space-y-1 text-xs">{snapshot.audit.slice(0,12).map((item)=><li key={item.id} className="border-t border-darkgrey pt-1"><strong>{item.action}</strong> · {item.module_key} · {item.actor} · {displayValue("created_at",item.created_at)}</li>)}</ul> : <p className="text-xs text-mist mt-2">No CMS audit events recorded.</p>}
      </div>
    </>}
    {!writesEnabled&&<p className="module-footnote p-3">This dashboard is read-only. CMS changes require both the general preview write gate and the CMS-specific preview write gate; the Worker independently validates permissions and second-person approval.</p>}
  </section>;
}

function ScheduleCreatePanel({ apiConfigured, writesEnabled, onCreated }: {
  apiConfigured: boolean;
  writesEnabled: boolean;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiConfigured || !writesEnabled || saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const startValue = String(data.get("scheduled_start") ?? "");
    const endValue = String(data.get("scheduled_end") ?? "");
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (!startValue || !endValue || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError("Enter a valid start and end time. The end must be after the start.");
      return;
    }
    const title = String(data.get("title") ?? "").trim();
    const service = String(data.get("service") ?? "").trim();
    if (!title || !service) {
      setError("Enter an appointment title and select a service.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await createAdminSchedule({
        title,
        customer_name: String(data.get("customer_name") ?? "").trim(),
        service,
        area: String(data.get("area") ?? "").trim(),
        assigned_to: String(data.get("assigned_to") ?? "").trim(),
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        notes: String(data.get("notes") ?? "").trim(),
        status: "Scheduled",
      });
      setMessage("Appointment saved to the isolated preview calendar.");
      form.reset();
      onCreated();
    } catch (e) {
      setError(adminApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return <section className="action-panel">
    <div className="action-panel-head">
      <div><strong>Schedule an appointment</strong><small>Creates a calendar entry in preview D1 only.</small></div>
      <span className="preview-pill">PREVIEW</span>
    </div>
    <form className="admin-form-grid" onSubmit={submit}>
      <label className="admin-form-wide">Appointment title<input name="title" required maxLength={180} disabled={!writesEnabled || !apiConfigured || saving} placeholder="e.g. Solar panel cleaning — site visit"/></label>
      <label>Customer / site<input name="customer_name" maxLength={160} disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <label>Service<select name="service" required defaultValue="" disabled={!writesEnabled || !apiConfigured || saving}><option value="" disabled>Choose service</option>{services.map((service)=><option key={service.slug} value={service.name}>{service.name}</option>)}</select></label>
      <label>Area / suburb<input name="area" maxLength={160} disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <label>Assigned to<input name="assigned_to" maxLength={160} disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <label>Starts<input name="scheduled_start" type="datetime-local" required disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <label>Ends<input name="scheduled_end" type="datetime-local" required disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <label className="admin-form-wide">Notes<textarea name="notes" rows={2} maxLength={4000} disabled={!writesEnabled || !apiConfigured || saving}/></label>
      <div className="admin-form-wide form-actions"><button type="submit" className="button button-orange" disabled={!writesEnabled || !apiConfigured || saving}>{saving ? "Saving appointment…" : "Save appointment"}</button><span>New appointments start with Scheduled status.</span></div>
    </form>
    {!writesEnabled && <p className="guardrail-message">Calendar writes remain disabled until the preview write-acceptance checks are approved.</p>}
    {message && <p className="inline-feedback" role="status">{message}</p>}
    {error && <p className="action-result action-result-error" role="alert">{error}</p>}
  </section>;
}

export default function AdminModuleClient({ moduleKey }: { moduleKey: AdminModuleKey }) {
  const module = MODULES[moduleKey];
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [customers, setCustomers] = useState<AdminRow[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<AdminRow[]>([]);
  const [enquiryRows, setEnquiryRows] = useState<AdminRow[]>([]);
  const [quoteLines, setQuoteLines] = useState<Array<{ description: string; quantity: string; unit: string; unit_price: string }>>([
    { description: "", quantity: "1", unit: "item", unit_price: "" },
  ]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [cmsDraftKey, setCmsDraftKey] = useState("cms_draft.home");
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
      setCustomers([]);
      setAcceptedQuotes([]);
      setEnquiryRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [result, customerRows, acceptedRows, enquiryResult] = await Promise.all([
        moduleKey === "quotes"
          ? readCommercialDocuments("Quotation", undefined, signal)
          : moduleKey === "invoices"
            ? readCommercialDocuments("Invoice", undefined, signal)
            : readAdminCollection(module.resource, signal),
        moduleKey === "quotes" || moduleKey === "invoices"
          ? readAdminCustomers(signal)
          : Promise.resolve([] as AdminRow[]),
        moduleKey === "invoices"
          ? readCommercialDocuments("Quotation", "Accepted", signal)
          : Promise.resolve([] as AdminRow[]),
        moduleKey === "quotes"
          ? readAdminCollection("enquiries", signal)
          : Promise.resolve([] as AdminRow[]),
      ]);
      const filtered = module.kind && moduleKey !== "quotes" && moduleKey !== "invoices"
        ? result.filter((row) => row.kind === module.kind)
        : result;
      if (!signal.aborted) {
        setRows(filtered);
        setCustomers(customerRows);
        setAcceptedQuotes(acceptedRows);
        setEnquiryRows(enquiryResult);
      }
    } catch (e) {
      if (!signal.aborted) {
        setRows([]);
        setCustomers([]);
        setAcceptedQuotes([]);
        setEnquiryRows([]);
        setError(adminApiErrorMessage(e));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [module.resource, module.kind, moduleKey]);

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
  const invoicedQuoteIds = new Set(rows.map((item) => String(item.source_document_id ?? "")));
  const availableAcceptedQuotes = acceptedQuotes.filter((item) => item.id && !invoicedQuoteIds.has(item.id));

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writesEnabled || !apiConfigured) return;
    const form = event.currentTarget;
    const data = new FormData(form);

    if (moduleKey === "quotes") {
      const customerId = String(data.get("customer_id") ?? "");
      const customer = customers.find((item) => item.id === customerId);
      const lines = quoteLines.map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity),
        unit: line.unit.trim() || "item",
        unit_price: Number(line.unit_price),
      }));
      const subtotal = lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unit_price * 100), 0) / 100;
      const discount = Number(data.get("discount_amount") ?? 0);
      const invalidLine = lines.some((line) =>
        !line.description || !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 100000 ||
        !Number.isFinite(line.unit_price) || line.unit_price < 0 || line.unit_price > 10000000
      );
      if (!customer || invalidLine || !lines.length || !Number.isFinite(discount) || discount < 0 || discount > subtotal) {
        setActionError("Choose a CRM customer, complete every quotation line and enter a discount no greater than the subtotal.");
        return;
      }
      setSaving(true);
      setActionMessage("");
      setActionError("");
      try {
        await createCommercialDocument({
          kind: "Quotation",
          customer_id: customerId,
          lines,
          discount_amount: discount,
          vat_enabled: data.get("vat_enabled") === "on",
          notes: String(data.get("notes") ?? "").trim(),
        });
        setActionMessage("Formal quotation created in preview D1. Its NGMS reference and item lines have been saved.");
        setQuoteLines([{ description: "", quantity: "1", unit: "item", unit_price: "" }]);
        form.reset();
        setShowCreate(false);
        setRefreshVersion((version) => version + 1);
      } catch (error) {
        setActionError(adminApiErrorMessage(error));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (moduleKey === "invoices") {
      const sourceDocumentId = String(data.get("source_document_id") ?? "");
      const sourceQuote = acceptedQuotes.find((item) => item.id === sourceDocumentId);
      const invoicedQuoteIds = new Set(rows.map((item) => String(item.source_document_id ?? "")));
      if (!sourceQuote || !sourceQuote.customer_id || invoicedQuoteIds.has(sourceDocumentId)) {
        setActionError("Select an accepted quotation that has not already been invoiced.");
        return;
      }
      setSaving(true);
      setActionMessage("");
      setActionError("");
      try {
        await createCommercialDocument({
          kind: "Invoice",
          source_document_id: sourceDocumentId,
          customer_id: sourceQuote.customer_id,
          due_date: String(data.get("due_date") ?? "").trim() || undefined,
          notes: String(data.get("notes") ?? "").trim(),
        });
        setActionMessage("Invoice created in preview D1 from the accepted quotation, carrying across its approved line items and VAT treatment.");
        form.reset();
        setShowCreate(false);
        setRefreshVersion((version) => version + 1);
      } catch (error) {
        setActionError(adminApiErrorMessage(error));
      } finally {
        setSaving(false);
      }
      return;
    }

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
    setSaving(true);
    setActionMessage("");
    setActionError("");
    try {
      await createAdminRecord(writeResource, payload);
      setActionMessage(moduleKey === "jobs" ? "Job created in the preview database." : "Enquiry created in the preview database.");
      form.reset();
      setShowCreate(false);
      setRefreshVersion((version)=>version+1);
    } catch (error) {
      setActionError(adminApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomerCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writesEnabled || !apiConfigured) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const displayName = String(data.get("display_name") ?? "").trim();
    if (!displayName) {
      setActionError("Enter a customer name before saving.");
      return;
    }
    setSaving(true);
    setActionMessage("");
    setActionError("");
    try {
      const customer = await createAdminCustomer({
        display_name: displayName,
        customer_type: String(data.get("customer_type") ?? "Individual"),
        primary_phone: String(data.get("primary_phone") ?? "").trim(),
        primary_email: String(data.get("primary_email") ?? "").trim(),
        service_address: String(data.get("service_address") ?? "").trim(),
        billing_address: String(data.get("billing_address") ?? "").trim(),
      });
      if (customer.id) setNewCustomerId(customer.id);
      setActionMessage("Customer added to the preview CRM. Select the customer when preparing the quotation.");
      form.reset();
      setShowCustomerForm(false);
      setRefreshVersion((version) => version + 1);
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

    {moduleKey === "calendar" && <ScheduleCreatePanel apiConfigured={apiConfigured} writesEnabled={writesEnabled} onCreated={()=>setRefreshVersion((version)=>version+1)}/>}

    {canCreate && <section className="action-panel">
      <div className="action-panel-head"><div><strong>Create {moduleKey==="enquiries"?"enquiry":moduleKey==="jobs"?"job":moduleKey==="quotes"?"quotation":"invoice"}</strong><small>New records are only allowed when the explicit preview-write flag is enabled.</small></div>
        <div className="flex gap-2 flex-wrap">
          {(moduleKey === "quotes" || moduleKey === "invoices") && <button type="button" className="button button-outline button-dark-outline" onClick={()=>{setShowCustomerForm(v=>!v);setActionError("");}} disabled={!writesEnabled||!apiConfigured}>{showCustomerForm?"Close customer form":"+ Add customer"}</button>}
          <button type="button" className="button button-orange" onClick={()=>{setShowCreate(v=>!v);setActionMessage("");setActionError("");}} disabled={!writesEnabled||!apiConfigured}>{showCreate?"Close form":"+ New record"}</button>
        </div>
      </div>
      {!writesEnabled&&<p className="guardrail-message">Writes disabled: enable NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES only after Access, CORS and staging persistence checks pass.</p>}
      {showCreate&&writesEnabled&&apiConfigured&&<form className="admin-form-grid" onSubmit={handleCreate}>
        {moduleKey === "quotes" && <>
          <label className="admin-form-wide">CRM customer
            <select name="customer_id" value={newCustomerId} onChange={(event)=>setNewCustomerId(event.target.value)} required>
              <option value="" disabled>Choose an active CRM customer</option>
              {customers.filter((customer)=>customer.status !== "Archived").map((customer)=><option key={String(customer.id)} value={String(customer.id)}>{String(customer.display_name ?? customer.company_name ?? customer.id)} · {String(customer.primary_phone ?? "No phone")}</option>)}
            </select>
          </label>
          {!customers.length && <p className="admin-form-wide guardrail-message">There are no CRM customers in this preview database yet. Add a customer before creating a formal quotation.</p>}
          <div className="admin-form-wide">
            <strong>Quotation line items</strong>
            {quoteLines.map((line,index)=><div key={index} className="admin-form-grid mt-3 border border-darkgrey rounded-card p-3">
              <label className="admin-form-wide">Description<input value={line.description} onChange={(event)=>setQuoteLines((current)=>current.map((item,i)=>i===index?{...item,description:event.target.value}:item))} required maxLength={240} placeholder="e.g. Solar panel cleaning — labour"/></label>
              <label>Quantity<input type="number" min="0.001" max="100000" step="0.001" value={line.quantity} onChange={(event)=>setQuoteLines((current)=>current.map((item,i)=>i===index?{...item,quantity:event.target.value}:item))} required/></label>
              <label>Unit<input value={line.unit} onChange={(event)=>setQuoteLines((current)=>current.map((item,i)=>i===index?{...item,unit:event.target.value}:item))} maxLength={24}/></label>
              <label>Unit price (ZAR)<input type="number" min="0" max="10000000" step="0.01" value={line.unit_price} onChange={(event)=>setQuoteLines((current)=>current.map((item,i)=>i===index?{...item,unit_price:event.target.value}:item))} required/></label>
              <div className="form-actions"><button type="button" className="button button-small button-outline button-dark-outline" onClick={()=>setQuoteLines((current)=>current.filter((_,i)=>i!==index))} disabled={quoteLines.length===1}>Remove line</button></div>
            </div>)}
            <button type="button" className="button button-small button-outline button-dark-outline mt-3" onClick={()=>setQuoteLines((current)=>[...current,{description:"",quantity:"1",unit:"item",unit_price:""}])}>+ Add line item</button>
          </div>
          <label>Discount (ZAR)<input name="discount_amount" type="number" min="0" step="0.01" defaultValue="0"/></label>
          <label className="flex items-center gap-2"><input name="vat_enabled" type="checkbox" className="w-4 h-4"/> Apply VAT using saved NGMS settings</label>
          <label className="admin-form-wide">Quotation notes<textarea name="notes" rows={3} maxLength={4000} placeholder="Scope, exclusions, access notes or payment terms"/></label>
          <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving||!customers.length}>{saving?"Saving…":"Create formal quotation"}</button><span>Creates an NGMS reference and stores the itemised lines in preview D1.</span></div>
        </>}
        {moduleKey === "invoices" && <>
          <label className="admin-form-wide">Accepted quotation
            <select name="source_document_id" defaultValue="" required>
              <option value="" disabled>Choose an accepted quotation not yet invoiced</option>
              {availableAcceptedQuotes.map((quote)=><option key={String(quote.id)} value={String(quote.id)}>{String(quote.reference ?? quote.id)} · {String(quote.customer_name ?? "Customer")} · {displayValue("amount_cents",quote.amount_cents)}</option>)}
            </select>
          </label>
          {!availableAcceptedQuotes.length && <p className="admin-form-wide guardrail-message">No accepted, uninvoiced quotations are available. An invoice must be created from an accepted quotation.</p>}
          <label>Invoice due date<input name="due_date" type="date"/></label>
          <label className="admin-form-wide">Invoice notes<textarea name="notes" rows={3} maxLength={4000}/></label>
          <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving||!availableAcceptedQuotes.length}>{saving?"Saving…":"Create invoice from accepted quotation"}</button><span>Approved lines, discount and VAT are copied from the source quotation.</span></div>
        </>}
        {(moduleKey==="enquiries"||moduleKey==="jobs") && <>
          <label>Customer / contact name<input name="customer_name" required maxLength={160} autoComplete="off"/></label>
          <label>Service<select name="service" defaultValue="" required><option value="" disabled>Choose service</option>{services.map((service)=><option key={service.slug} value={service.name}>{service.name}</option>)}</select></label>
          <label>Area / suburb<input name="area" maxLength={160} autoComplete="off"/></label>
          {moduleKey==="enquiries"&&<><label>Phone<input name="phone" type="tel" maxLength={40} autoComplete="off"/></label><label>Email<input name="email" type="email" maxLength={254} autoComplete="off"/></label></>}
          <label className="admin-form-wide">Job details<textarea name="details" rows={3} maxLength={4000}/></label>
          <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving}>{saving?"Saving…":"Create in preview"}</button><span>Records are written only to the isolated preview D1 database.</span></div>
        </>}
      </form>}
      {showCustomerForm&&writesEnabled&&apiConfigured&&(moduleKey==="quotes"||moduleKey==="invoices")&&<form className="admin-form-grid mt-4 border-t border-darkgrey pt-4" onSubmit={handleCustomerCreate}>
        <strong className="admin-form-wide">Add customer to preview CRM</strong>
        <label>Customer name<input name="display_name" required maxLength={160}/></label>
        <label>Customer type<select name="customer_type" defaultValue="Individual"><option>Individual</option><option>Business</option><option>Body corporate</option></select></label>
        <label>Phone<input name="primary_phone" type="tel" maxLength={40}/></label>
        <label>Email<input name="primary_email" type="email" maxLength={254}/></label>
        <label className="admin-form-wide">Service address<input name="service_address" maxLength={1000}/></label>
        <label className="admin-form-wide">Billing address<input name="billing_address" maxLength={1000}/></label>
        <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving}>{saving?"Saving…":"Save customer"}</button><span>Customer details are stored only in the isolated preview CRM.</span></div>
      </form>}
    </section>}

    {moduleKey==="content"&&<>
      <section className="action-panel"><strong>CMS workflow controls</strong><p className="text-xs text-mist mt-1">Drafts are stored separately from live content. Publication requests require an independent authorised reviewer; every decision and rollback is audited.</p>
        {rows.filter((row)=>typeof row.content_key==="string"&&String(row.content_key).startsWith("cms_draft.")).length===0?<p className="text-xs mt-2">No CMS drafts are currently stored.</p>:<label className="block text-xs mt-2">Select a draft<select className="mt-1 w-full" value={rows.some((row)=>row.content_key===cmsDraftKey)?cmsDraftKey:""} onChange={(event)=>setCmsDraftKey(event.target.value)}><option value="">Choose draft</option>{rows.filter((row)=>typeof row.content_key==="string"&&String(row.content_key).startsWith("cms_draft.")).map((row)=><option key={String(row.content_key)} value={String(row.content_key)}>{String(row.content_key)}</option>)}</select></label>}
      </section>
      {rows.find((row)=>row.content_key===cmsDraftKey)&&<CmsDraftEditor key={cmsDraftKey} row={rows.find((row)=>row.content_key===cmsDraftKey) as AdminRow} apiConfigured={apiConfigured} writesEnabled={cmsWritesEnabled()} onUpdated={()=>setRefreshVersion((version)=>version+1)}/>}
      <CmsPublishingReview apiConfigured={apiConfigured} writesEnabled={cmsWritesEnabled()} onUpdated={()=>setRefreshVersion((version)=>version+1)}/>
    </>}

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
      :<div className="table-scroll"><table><thead><tr>{module.columns.map((column)=><th key={column.key}>{column.label}</th>)}{moduleKey==="media"&&<><th>Preview</th><th>Asset management</th></>}{(moduleKey==="quotes"||moduleKey==="invoices")&&<th>Document workflow</th>}{moduleKey==="enquiries"&&<th>CRM / quotation workflow</th>}{writesEnabled&&["enquiries","jobs","quotes","invoices","calendar"].includes(moduleKey)&&module.resource&&["enquiries","jobs","documents","schedules"].includes(module.resource)&&<th>Status action</th>}</tr></thead>
        <tbody>{visibleRows.map((row,index)=><tr key={String(row.id??row.content_key??index)}>{module.columns.map((column)=><td key={column.key}>{displayValue(column.key,row[column.key])}</td>)}{moduleKey==="media"&&<><td><AdminMediaPreview key={String(row.id)+"-"+String(row.updated_at??row.size_bytes)} row={row}/></td><td><MediaItemActions key={String(row.id)} row={row} apiConfigured={apiConfigured} writesEnabled={writesEnabled} onUpdated={()=>setRefreshVersion((version)=>version+1)}/></td></>}{(moduleKey==="quotes"||moduleKey==="invoices")&&<td><CommercialDocumentActions moduleKey={moduleKey} row={row} enquiries={enquiryRows} onUpdated={()=>setRefreshVersion((version)=>version+1)}/></td>}{moduleKey==="enquiries"&&<td><ConvertEnquiryToCrmAction row={row} onUpdated={()=>setRefreshVersion((version)=>version+1)}/></td>}{writesEnabled&&["enquiries","jobs","quotes","invoices","calendar"].includes(moduleKey)&&module.resource&&["enquiries","jobs","documents","schedules"].includes(module.resource)&&<td>{module.resource === "documents" && !row.reference ? <small className="module-footnote">Legacy document — read-only</small> : <StatusEditor key={String(row.id)+"-"+String(row.status)} resource={module.resource as "enquiries"|"jobs"|"documents"|"schedules"} statusOptions={module.resource === "documents" ? (module.kind === "Quotation" ? QUOTE_STATUS_OPTIONS : INVOICE_STATUS_OPTIONS) : module.resource === "schedules" ? SCHEDULE_STATUS_OPTIONS : STATUS_OPTIONS[module.resource as "enquiries"|"jobs"]} row={row} onSaved={()=>setRefreshVersion((version)=>version+1)}/>}</td>}</tr>)}</tbody></table></div>}
    </section>
    {moduleKey==="reports"&&<p className="module-footnote">Commercial value figures include only referenced documents with at least one line item whose total equals the saved subtotal. Incomplete legacy documents are counted separately, not treated as verified turnover or revenue.</p>}
    {moduleKey==="settings"&&<p className="module-footnote">This screen does not expose Access policies, API secrets, DNS, or production credentials. VAT preferences are reviewed here; changes to financial settings remain a separately guarded action.</p>}
    {moduleKey==="invoices"&&<p className="module-footnote">Invoices are generated only from accepted quotations. The payment ledger tracks partial payments, prevents overpayment and marks an invoice Paid only when its allocated payments cover the full value. Refunds, reversals and credit-note allocation remain separate work.</p>}
    {moduleKey==="content"&&<p className="module-footnote">The CMS has versioned drafts, independent approval, publication history, audit logging and rollback controls. Editing and publishing remain blocked until the CMS-specific preview gate is approved.</p>}
    <p className="module-footnote">Preview write controls require NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=true. The Worker independently verifies Cloudflare Access identity for every protected action.</p>
  </div>;
}
