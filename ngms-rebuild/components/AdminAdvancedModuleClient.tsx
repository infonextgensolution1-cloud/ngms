"use client";

import { ChangeEvent, FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminRow,
  AdminSchedule,
  CmsPublishingData,
  adminApiConfigurationMessage,
  adminApiErrorMessage,
  createAdminSchedule,
  getAdminApiBase,
  getAdminApiHealthUrl,
  getAdminMediaDownloadUrl,
  previewWritesEnabled,
  readAdminCollection,
  readAdminIdentity,
  readAdminSchedules,
  readCmsPublishing,
  readCommercialDocuments,
  readInvoicePayments,
  requestCmsPublication,
  reviewCmsPublication,
  rollbackCmsPublication,
  saveCmsDraft,
  updateAdminSchedule,
  uploadAdminMedia,
} from "@/lib/admin-api";
import type { AdminModuleKey } from "@/components/AdminModuleClient";

type AdvancedModule = Extract<AdminModuleKey, "calendar" | "media" | "content" | "reports" | "settings">;

function localDateTimeValue(date = new Date()): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function dateLabel(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function zar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

function Panel({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return <section className="action-panel">
    <div className="action-panel-head"><div><strong>{title}</strong>{note && <small>{note}</small>}</div></div>
    {children}
  </section>;
}

function Notice({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <div className={warning ? "guardrail-message" : "api-notice"} role="status">{children}</div>;
}

function ScheduleRow({ row, onUpdated }: { row: AdminSchedule; onUpdated: () => void }) {
  const [status, setStatus] = useState(row.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!previewWritesEnabled() || saving || status === row.status) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminSchedule(row.id, { status });
      onUpdated();
    } catch (e) {
      setError(adminApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return <tr>
    <td>{dateLabel(row.scheduled_start)}</td>
    <td><strong>{row.title}</strong><small className="block">{row.customer_name || "No customer linked"}</small></td>
    <td>{row.service}<small className="block">{row.area || "Area not set"}</small></td>
    <td>{row.assigned_to || "Unassigned"}</td>
    <td>
      <div className="flex flex-wrap items-center gap-2">
        <select value={status} onChange={e => setStatus(e.target.value)} disabled={!previewWritesEnabled() || saving} aria-label={"Status for " + row.title}>
          {["Scheduled", "Confirmed", "In progress", "Completed", "Cancelled"].map(value => <option key={value}>{value}</option>)}
        </select>
        <button type="button" className="button button-small button-outline button-dark-outline" onClick={save} disabled={!previewWritesEnabled() || saving || status === row.status}>{saving ? "Saving…" : "Update"}</button>
      </div>
      {error && <small className="text-orange block mt-1">{error}</small>}
    </td>
  </tr>;
}

function CalendarModule() {
  const [rows, setRows] = useState<AdminSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [start, setStart] = useState(() => localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [end, setEnd] = useState(() => localDateTimeValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const writes = previewWritesEnabled();
  const base = Boolean(getAdminApiBase());

  const load = useCallback(async (signal: AbortSignal) => {
    if (!base) { setRows([]); setLoading(false); setError(""); return; }
    setLoading(true);
    setError("");
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 120);
    try {
      const result = await readAdminSchedules(from.toISOString(), to.toISOString(), signal);
      if (!signal.aborted) setRows(result);
    } catch (e) {
      if (!signal.aborted) { setRows([]); setError(adminApiErrorMessage(e)); }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writes || !base) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (new Date(end) <= new Date(start)) { setError("The appointment end time must be after its start time."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      await createAdminSchedule({
        title: String(data.get("title") ?? "").trim(),
        service: String(data.get("service") ?? "").trim(),
        customer_name: String(data.get("customer_name") ?? "").trim(),
        area: String(data.get("area") ?? "").trim(),
        assigned_to: String(data.get("assigned_to") ?? "").trim(),
        scheduled_start: new Date(start).toISOString(),
        scheduled_end: new Date(end).toISOString(),
        notes: String(data.get("notes") ?? "").trim(),
        status: "Scheduled",
      });
      setMessage("Appointment saved to the isolated preview calendar.");
      form.reset();
      setStart(localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
      setEnd(localDateTimeValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
      setRefresh(v => v + 1);
    } catch (e) { setError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <Notice warning={!base || Boolean(error)}>
      <strong>{error ? "Calendar data unavailable" : base ? "Connected to the authenticated preview schedules API" : "Preview API not configured"}</strong>
      <p>{error || (base ? "Appointments load from D1. New appointments and status changes remain protected by the preview-write guard." : adminApiConfigurationMessage())}</p>
    </Notice>
    <Panel title="Create appointment" note="Creates an isolated preview schedule record only.">
      <form className="admin-form-grid" onSubmit={create}>
        <label>Appointment title<input name="title" required maxLength={180} disabled={!writes || !base}/></label>
        <label>Service<input name="service" required maxLength={160} disabled={!writes || !base} placeholder="e.g. Solar maintenance"/></label>
        <label>Customer / site<input name="customer_name" maxLength={160} disabled={!writes || !base}/></label>
        <label>Area / suburb<input name="area" maxLength={160} disabled={!writes || !base}/></label>
        <label>Assigned to<input name="assigned_to" maxLength={160} disabled={!writes || !base}/></label>
        <label>Start<input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} disabled={!writes || !base}/></label>
        <label>End<input type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} disabled={!writes || !base}/></label>
        <label className="admin-form-wide">Notes<textarea name="notes" rows={2} maxLength={4000} disabled={!writes || !base}/></label>
        <div className="admin-form-wide form-actions">
          <button className="button button-orange" type="submit" disabled={!writes || !base || saving}>{saving ? "Saving…" : "Add to calendar"}</button>
          {!writes && <span>Preview writes are disabled pending authenticated staging acceptance.</span>}
        </div>
      </form>
      {message && <p className="inline-feedback mt-2" role="status">{message}</p>}
      {error && <p className="text-orange mt-2" role="alert">{error}</p>}
    </Panel>
    <section className="data-panel">
      <div className="data-toolbar"><div><strong>Appointments · next 120 days</strong><small>{loading ? "Loading…" : error ? "Unable to verify appointments" : rows.length + " appointments returned"}</small></div>
        <button className="button button-orange" type="button" onClick={() => setRefresh(v => v + 1)} disabled={loading || !base}>Refresh</button>
      </div>
      {loading ? <div className="table-empty"><h2>LOADING APPOINTMENTS</h2></div>
        : error ? <div className="table-empty"><h2>CALENDAR COULD NOT BE LOADED</h2><p>{error}</p></div>
        : rows.length === 0 ? <div className="table-empty"><h2>NO APPOINTMENTS SCHEDULED</h2><p>The schedules API returned an empty collection. No sample events are displayed.</p></div>
        : <div className="table-scroll"><table><thead><tr><th>Start</th><th>Appointment</th><th>Service / area</th><th>Assigned to</th><th>Status</th></tr></thead>
          <tbody>{rows.map(row => <ScheduleRow key={row.id} row={row} onUpdated={() => setRefresh(v => v + 1)}/>)}</tbody></table></div>}
    </section>
  </div>;
}

function MediaCard({ row }: { row: AdminRow }) {
  const [imageFailed, setImageFailed] = useState(false);
  const url = getAdminMediaDownloadUrl(row.id);
  const image = typeof row.content_type === "string" && row.content_type.startsWith("image/");
  const size = typeof row.size_bytes === "number"
    ? row.size_bytes >= 1024 * 1024 ? (row.size_bytes / 1024 / 1024).toFixed(1) + " MB" : (row.size_bytes / 1024).toFixed(1) + " KB"
    : "—";
  return <article className="rounded-card border border-darkgrey p-3 min-w-0">
    <div className="aspect-[4/3] rounded-card overflow-hidden bg-black/20 flex items-center justify-center">
      {image && url && !imageFailed
        ? <img src={url} alt={String(row.original_name ?? "NGMS media asset")} loading="lazy" className="w-full h-full object-cover" onError={() => setImageFailed(true)}/>
        : <span className="text-sm text-mist">{image ? "Preview unavailable" : "DOCUMENT"}</span>}
    </div>
    <strong className="block mt-3 text-sm break-words">{String(row.original_name ?? "Untitled asset")}</strong>
    <small className="block text-mist">{String(row.content_type ?? "Unknown type")} · {size}</small>
    <small className="block text-mist">{dateLabel(row.created_at)}</small>
    {url && <a className="text-link inline-block mt-2" href={url} target="_blank" rel="noopener noreferrer">Open / download ↗</a>}
  </article>;
}

function MediaModule() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "images" | "documents">("all");
  const [refresh, setRefresh] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const base = Boolean(getAdminApiBase());
  const writes = previewWritesEnabled();

  useEffect(() => {
    const controller = new AbortController();
    if (!base) { setRows([]); setLoading(false); return () => controller.abort(); }
    setLoading(true); setError("");
    readAdminCollection("media", controller.signal)
      .then(result => { if (!controller.signal.aborted) setRows(result); })
      .catch(e => { if (!controller.signal.aborted) { setRows([]); setError(adminApiErrorMessage(e)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, refresh]);

  const filtered = useMemo(() => rows.filter(row => {
    const termMatch = !query.trim() || [row.original_name, row.content_type, row.uploaded_by, row.created_at]
      .some(value => String(value ?? "").toLowerCase().includes(query.trim().toLowerCase()));
    const isImage = typeof row.content_type === "string" && row.content_type.startsWith("image/");
    return termMatch && (filter === "all" || (filter === "images" ? isImage : !isImage));
  }), [rows, query, filter]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !writes || !base) return;
    setUploading(true); setMessage(""); setActionError("");
    try {
      const saved = await uploadAdminMedia(file);
      setMessage("Stored in preview R2: " + String(saved.original_name ?? file.name));
      setRefresh(v => v + 1);
    } catch (e) { setActionError(adminApiErrorMessage(e)); }
    finally { setUploading(false); event.target.value = ""; }
  }

  return <div className="space-y-5">
    <Notice warning={!base || Boolean(error)}>
      <strong>{error ? "Media library unavailable" : "Preview R2 media library"}</strong>
      <p>{error || (base ? "Image previews and file links are read through the authenticated preview API. Uploads remain disabled until staging writes are approved." : adminApiConfigurationMessage())}</p>
    </Notice>
    <Panel title="Upload asset" note="JPEG, PNG, WebP, AVIF or PDF · maximum 10 MB.">
      <label className="upload-control">Choose a file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" disabled={!writes || !base || uploading} onChange={upload}/></label>
      {!writes && <p className="guardrail-message mt-2">Uploads are disabled by the preview-write guard.</p>}
      {uploading && <p className="inline-feedback mt-2">Uploading…</p>}
      {message && <p className="inline-feedback mt-2" role="status">{message}</p>}
      {actionError && <p className="text-orange mt-2" role="alert">{actionError}</p>}
    </Panel>
    <section className="data-panel">
      <div className="data-toolbar"><div><strong>Stored assets</strong><small>{loading ? "Loading…" : error ? "Count unavailable" : filtered.length + " of " + rows.length + " assets"}</small></div>
        <input aria-label="Search media assets" placeholder="Search files…" value={query} onChange={e => setQuery(e.target.value)}/>
        <select aria-label="Filter media type" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">All files</option><option value="images">Images</option><option value="documents">Documents</option></select>
        <button className="button button-orange" type="button" onClick={() => setRefresh(v => v + 1)} disabled={loading || !base}>Refresh</button>
      </div>
      {loading ? <div className="table-empty"><h2>LOADING MEDIA</h2></div>
        : error ? <div className="table-empty"><h2>MEDIA COULD NOT BE LOADED</h2><p>{error}</p></div>
        : filtered.length === 0 ? <div className="table-empty"><h2>NO MATCHING ASSETS</h2><p>Try another search or file-type filter.</p></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">{filtered.map(row => <MediaCard key={String(row.id)} row={row}/>)}</div>}
    </section>
    <p className="module-footnote">Current organisation supports search and file-type filtering. Persistent user-defined folders, tags and category editing require a separately versioned media-metadata migration and are not simulated here.</p>
  </div>;
}

const DEFAULT_DRAFT = JSON.stringify({ moduleKey: "home", title: "Home", slug: "home", blocks: [] }, null, 2);

function CmsModule() {
  const [content, setContent] = useState<AdminRow[]>([]);
  const [workflow, setWorkflow] = useState<CmsPublishingData | null>(null);
  const [identity, setIdentity] = useState<{ email: string; actor: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [moduleKey, setModuleKey] = useState("home");
  const [draftText, setDraftText] = useState(DEFAULT_DRAFT);
  const [draftSaved, setDraftSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const writes = previewWritesEnabled();
  const base = Boolean(getAdminApiBase());

  const load = useCallback(async (signal: AbortSignal) => {
    if (!base) { setContent([]); setWorkflow(null); setIdentity(null); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [contentRows, publishing, who] = await Promise.all([
        readAdminCollection("content", signal), readCmsPublishing(signal), readAdminIdentity(signal),
      ]);
      if (!signal.aborted) {
        setContent(contentRows);
        setWorkflow(publishing);
        setIdentity(who);
        const draft = contentRows.find(row => row.content_key === "cms_draft." + moduleKey);
        if (draft && typeof draft.content_json === "string") {
          setDraftText(JSON.stringify(JSON.parse(draft.content_json), null, 2));
          setDraftSaved(true);
        }
      }
    } catch (e) { if (!signal.aborted) setError(adminApiErrorMessage(e)); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [base, moduleKey]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  useEffect(() => {
    const draft = content.find(row => row.content_key === "cms_draft." + moduleKey);
    if (draft && typeof draft.content_json === "string") {
      try { setDraftText(JSON.stringify(JSON.parse(draft.content_json), null, 2)); setDraftSaved(true); }
      catch { setDraftText(String(draft.content_json)); setDraftSaved(false); }
    } else {
      setDraftText(JSON.stringify({ moduleKey, title: moduleKey, slug: moduleKey, blocks: [] }, null, 2));
      setDraftSaved(false);
    }
  }, [content, moduleKey]);

  async function saveDraft() {
    setSaving(true); setMessage(""); setActionError("");
    try {
      const value: unknown = JSON.parse(draftText);
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The draft must be a JSON object.");
      if ((value as Record<string, unknown>).moduleKey !== moduleKey) throw new Error("The JSON moduleKey must match the selected module.");
      await saveCmsDraft(moduleKey, value as Record<string, unknown>);
      setDraftSaved(true);
      setMessage("Draft saved to the preview CMS.");
      setRefresh(v => v + 1);
    } catch (e) { setActionError(e instanceof Error ? e.message : adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function requestPublication() {
    setSaving(true); setMessage(""); setActionError("");
    try {
      const result = await requestCmsPublication(moduleKey);
      setMessage("Publication request submitted. It requires a different authorised administrator to approve it.");
      setDraftSaved(false);
      setRefresh(v => v + 1);
      void result;
    } catch (e) { setActionError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function review(requestId: string, decision: "approve" | "reject") {
    const note = window.prompt(decision === "approve" ? "Approval note (optional):" : "Reason for rejection:");
    if (note === null) return;
    setSaving(true); setMessage(""); setActionError("");
    try {
      await reviewCmsPublication(requestId, decision, note);
      setMessage(decision === "approve" ? "Publication approved and revision published." : "Publication request rejected.");
      setRefresh(v => v + 1);
    } catch (e) { setActionError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function rollback(module: string, publicationId: string) {
    const note = window.prompt("Reason for rolling back this publication:");
    if (note === null) return;
    setSaving(true); setMessage(""); setActionError("");
    try {
      await rollbackCmsPublication(module, publicationId, note);
      setMessage("CMS revision rollback completed.");
      setRefresh(v => v + 1);
    } catch (e) { setActionError(adminApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  const pending = workflow?.requests.filter(item => item.status === "Pending") ?? [];
  const currentByModule = new Map<string, CmsPublishingData["current"][number]>((workflow?.current ?? []).map(item => [item.module_key, item] as const));
  const actor = identity?.actor?.toLowerCase() ?? "";
  const currentActorIsRequester = (request: CmsPublishingData["requests"][number]) => Boolean(actor && request.requested_by.toLowerCase() === actor);
  const currentActorIsPublisher = (module: string) => Boolean(actor && currentByModule.get(module)?.published_by.toLowerCase() === actor);

  return <div className="space-y-5">
    <Notice warning={!base || Boolean(error)}>
      <strong>{error ? "CMS workflow unavailable" : "Versioned CMS publishing"}</strong>
      <p>{error || (loading ? "Loading draft, publication and identity records…" : "Drafts are saved separately. Publication requires independent approval; requester self-approval is blocked by the Worker.")}</p>
      {identity && <small className="block mt-1">Signed in as: {identity.email || identity.actor}</small>}
    </Notice>
    <Panel title="CMS draft editor" note="Draft JSON is validated by the preview Worker before a publication request is accepted.">
      <div className="admin-form-grid">
        <label>CMS module key<select value={moduleKey} onChange={e => { setModuleKey(e.target.value); setMessage(""); setActionError(""); }} disabled={!base || saving}>
          {["home","about","services","portfolio","gallery","pricing","contact","faq"].map(key => <option key={key}>{key}</option>)}
        </select></label>
        <label>Saved draft status<input readOnly value={draftSaved ? "Saved in preview" : "Unsaved changes"} /></label>
        <label className="admin-form-wide">Draft JSON<textarea className="font-mono text-xs" rows={14} value={draftText} onChange={e => { setDraftText(e.target.value); setDraftSaved(false); }} spellCheck={false} disabled={!base || !writes || saving}/></label>
        <div className="admin-form-wide form-actions">
          <button type="button" className="button button-outline button-dark-outline" onClick={saveDraft} disabled={!base || !writes || saving}>{saving ? "Saving…" : "Save draft"}</button>
          <button type="button" className="button button-orange" onClick={requestPublication} disabled={!base || !writes || saving || !draftSaved}>Request publication approval</button>
          {!writes && <span>Draft writes and publication requests remain disabled until preview acceptance is approved.</span>}
        </div>
      </div>
      {message && <p className="inline-feedback mt-3" role="status">{message}</p>}
      {actionError && <p className="text-orange mt-3" role="alert">{actionError}</p>}
    </Panel>

    <Panel title="Pending publication approvals" note="The person who requested publication cannot approve or reject their own request.">
      {loading ? <p>Loading approval queue…</p> : pending.length === 0 ? <p className="text-mist text-sm">No pending publication requests.</p>
        : <div className="space-y-3">{pending.map(request => {
          const own = currentActorIsRequester(request);
          return <article key={request.id} className="border border-darkgrey rounded-card p-3">
            <div className="flex flex-wrap justify-between gap-2"><strong>{request.module_key} · /{request.slug}</strong><span className="preview-pill">PENDING</span></div>
            <small className="text-mist block mt-1">Requested by {request.requested_by} · {dateLabel(request.created_at)}</small>
            {own && <p className="guardrail-message mt-2">You submitted this request. A second authorised administrator must review it.</p>}
            <div className="flex gap-2 mt-3">
              <button className="button button-small button-orange" type="button" onClick={() => review(request.id, "approve")} disabled={!writes || saving || own}>Approve & publish</button>
              <button className="button button-small button-outline button-dark-outline" type="button" onClick={() => review(request.id, "reject")} disabled={!writes || saving || own}>Reject</button>
            </div>
          </article>;
        })}</div>}
      {!writes && <p className="module-footnote mt-2">Approval actions are disabled by the preview-write guard.</p>}
    </Panel>

    <Panel title="Published revisions and rollback" note="Rollback is also restricted: a different administrator must confirm it.">
      {!workflow?.history.length ? <p className="text-mist text-sm">No published revisions exist in this preview database yet.</p>
        : <div className="space-y-2">{workflow.history.map(item => {
          const current = currentByModule.get(item.module_key)?.publication_id === item.id;
          const blocked = currentActorIsPublisher(item.module_key);
          return <article key={item.id} className="border border-darkgrey rounded-card p-3 flex flex-wrap items-center justify-between gap-3">
            <div><strong>{item.module_key} · /{item.slug}</strong><small className="block text-mist">{current ? "Current preview publication" : "Previous revision"} · {item.published_by} · {dateLabel(item.published_at)}</small></div>
            <button type="button" className="button button-small button-outline button-dark-outline" onClick={() => rollback(item.module_key, item.id)} disabled={!writes || saving || current || blocked}>Restore this revision</button>
            {blocked && current && <small className="text-mist">A different administrator must confirm rollback.</small>}
          </article>;
        })}</div>}
    </Panel>

    <Panel title="Website content records" note={content.length + " records returned by the authenticated content API."}>
      {loading ? <p>Loading…</p> : content.length === 0 ? <p className="text-mist text-sm">No content records returned.</p>
        : <div className="table-scroll"><table><thead><tr><th>Content key</th><th>Last updated</th><th>Updated by</th></tr></thead><tbody>{content.map(row => <tr key={String(row.content_key)}><td>{String(row.content_key)}</td><td>{dateLabel(row.updated_at)}</td><td>{String(row.updated_by ?? "—")}</td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}

function ReportsModule() {
  const [data, setData] = useState<{ enquiries: AdminRow[]; jobs: AdminRow[]; customers: AdminRow[]; quotes: AdminRow[]; invoices: AdminRow[]; payments: number; balances: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const base = Boolean(getAdminApiBase());

  useEffect(() => {
    const controller = new AbortController();
    if (!base) { setData(null); setLoading(false); return () => controller.abort(); }
    setLoading(true); setError("");
    Promise.all([
      readAdminCollection("enquiries", controller.signal),
      readAdminCollection("jobs", controller.signal),
      readAdminCollection("customers", controller.signal),
      readCommercialDocuments("Quotation", undefined, controller.signal),
      readCommercialDocuments("Invoice", undefined, controller.signal),
    ]).then(async ([enquiries, jobs, customers, quotes, invoices]) => {
      const paymentRows = await Promise.all(invoices.map(invoice => invoice.id ? readInvoicePayments(String(invoice.id), controller.signal) : Promise.resolve({ paid_cents: 0, balance_cents: Number(invoice.amount_cents ?? 0) })));
      if (!controller.signal.aborted) setData({
        enquiries, jobs, customers, quotes, invoices,
        payments: paymentRows.reduce((sum, item) => sum + Number(item.paid_cents || 0), 0),
        balances: paymentRows.reduce((sum, item) => sum + Number(item.balance_cents || 0), 0),
      });
    }).catch(e => { if (!controller.signal.aborted) { setData(null); setError(adminApiErrorMessage(e)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, refresh]);

  const countStatus = (rows: AdminRow[], status: string) => rows.filter(row => row.status === status).length;
  const invoiceValue = data?.invoices.reduce((sum, item) => sum + Number(item.amount_cents || 0), 0) ?? 0;
  const quoteValue = data?.quotes.reduce((sum, item) => sum + Number(item.amount_cents || 0), 0) ?? 0;

  return <div className="space-y-5">
    <Notice warning={!base || Boolean(error)}>
      <strong>{error ? "Reports could not be generated" : "Operational snapshot"}</strong>
      <p>{error || "Figures are calculated from the current preview API collections. Invoice face value and paid balances are not a profit calculation."}</p>
    </Notice>
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {[
        ["Enquiries", data?.enquiries.length ?? 0],
        ["Active jobs", countStatus(data?.jobs ?? [], "In progress")],
        ["CRM customers", data?.customers.length ?? 0],
        ["Open quotations", data?.quotes.filter(row => ["Draft","Sent","Accepted"].includes(String(row.status))).length ?? 0],
      ].map(([label, value]) => <article key={String(label)} className="action-panel"><small>{label}</small><strong className="block text-2xl mt-2">{loading ? "…" : value}</strong></article>)}
    </section>
    <Panel title="Commercial overview" note="ZAR figures reflect stored document totals, not recognised revenue or profit.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><small className="text-mist block">Quotation face value</small><strong className="text-xl">{loading ? "…" : zar(quoteValue)}</strong></div>
        <div><small className="text-mist block">Invoice face value</small><strong className="text-xl">{loading ? "…" : zar(invoiceValue)}</strong></div>
        <div><small className="text-mist block">Recorded payments</small><strong className="text-xl">{loading ? "…" : zar(data?.payments ?? 0)}</strong></div>
      </div>
      <p className="mt-3 text-sm">Invoice balance outstanding: <strong>{loading ? "…" : zar(data?.balances ?? 0)}</strong></p>
    </Panel>
    <Panel title="Pipeline status">
      {loading ? <p>Loading report data…</p> : error ? <p className="text-orange">{error}</p> : <div className="table-scroll"><table><thead><tr><th>Record group</th><th>Status</th><th>Count</th></tr></thead><tbody>
        {["New","Contacted","Quoted","Converted","Closed"].map(status => <tr key={"enq-"+status}><td>Enquiries</td><td>{status}</td><td>{countStatus(data?.enquiries ?? [], status)}</td></tr>)}
        {["New","Quoted","In progress","Completed","Cancelled"].map(status => <tr key={"job-"+status}><td>Jobs</td><td>{status}</td><td>{countStatus(data?.jobs ?? [], status)}</td></tr>)}
        {["Draft","Sent","Accepted","Declined","Expired","Overdue","Paid","Cancelled"].map(status => <tr key={"doc-"+status}><td>Invoices & quotations</td><td>{status}</td><td>{countStatus([...(data?.quotes ?? []), ...(data?.invoices ?? [])], status)}</td></tr>)}
      </tbody></table></div>}
    </Panel>
    <Notice warning>
      <strong>Profitability report not available yet.</strong> Costs, supplier purchases, labour allocations, travel expenses and job-level cost attribution are not sufficiently populated in the preview database. No profit margin is inferred from turnover.
    </Notice>
    <div className="flex justify-end"><button type="button" className="button button-orange" onClick={() => setRefresh(v => v + 1)} disabled={loading || !base}>Refresh reports</button></div>
  </div>;
}

function SettingsModule() {
  const [identity, setIdentity] = useState<{ email: string; actor: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const base = getAdminApiBase();
  const health = getAdminApiHealthUrl();
  const writes = previewWritesEnabled();

  useEffect(() => {
    const controller = new AbortController();
    if (!base) { setIdentity(null); setLoading(false); return () => controller.abort(); }
    setLoading(true); setError("");
    readAdminIdentity(controller.signal)
      .then(value => { if (!controller.signal.aborted) setIdentity(value); })
      .catch(e => { if (!controller.signal.aborted) setError(adminApiErrorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, refresh]);

  const settings = [
    ["Environment", process.env.NEXT_PUBLIC_NGMS_ENV === "production" ? "Production" : "Preview"],
    ["API target", base || "Not configured"],
    ["Write actions", writes ? "Enabled by environment flag" : "Disabled by safety guard"],
    ["Live website protection", "No production deployment from this branch"],
    ["Backend", "Cloudflare Workers + D1 + R2"],
    ["Supabase", "Not used by this rebuild"],
  ];

  return <div className="space-y-5">
    <Notice warning={Boolean(error) || !base}>
      <strong>{error ? "Access identity could not be verified" : "Environment and access settings"}</strong>
      <p>{error || (base ? "This page reports the active preview configuration. Secret values are never requested or displayed." : adminApiConfigurationMessage())}</p>
    </Notice>
    <Panel title="Current environment">
      <div className="table-scroll"><table><tbody>{settings.map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table></div>
    </Panel>
    <Panel title="Signed-in administrator">
      {loading ? <p>Verifying Cloudflare Access identity…</p> : identity ? <div><strong>{identity.email || identity.actor}</strong><small className="block text-mist">Authenticated by the preview Worker.</small></div> : <p className="text-mist">{error || "Identity not available."}</p>}
      {health && <p className="mt-3"><a className="text-link" href={health} target="_blank" rel="noopener noreferrer">Open API health / sign-in ↗</a></p>}
      <button className="button button-orange mt-3" type="button" onClick={() => setRefresh(v => v + 1)} disabled={loading || !base}>Refresh identity</button>
    </Panel>
    <Notice warning>
      Business settings are not yet configured in preview D1 (the business_settings table is empty). This page intentionally does not expose editable financial, tax, banking or access-control fields until an approved settings schema and audit rules are in place.
    </Notice>
  </div>;
}

export default function AdminAdvancedModuleClient({ moduleKey }: { moduleKey: AdvancedModule }) {
  const titles: Record<AdvancedModule, string> = {
    calendar: "Job calendar",
    media: "Media library",
    content: "Website content & publishing",
    reports: "Reports",
    settings: "Settings & access",
  };
  return <div className="admin-page">
    <div className="admin-page-top">
      <div><p className="eyebrow">NGMS / WORKSPACE</p><h1>{titles[moduleKey].toUpperCase()}</h1><p>Authenticated preview workspace · Cloudflare-backed records</p></div>
      <a href="/admin" className="button button-outline button-dark-outline">← Overview</a>
    </div>
    {moduleKey === "calendar" ? <CalendarModule/>
      : moduleKey === "media" ? <MediaModule/>
      : moduleKey === "content" ? <CmsModule/>
      : moduleKey === "reports" ? <ReportsModule/>
      : <SettingsModule/>}
  </div>;
}
