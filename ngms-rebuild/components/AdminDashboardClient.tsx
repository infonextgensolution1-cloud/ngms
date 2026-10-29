"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminRow, adminApiErrorMessage, getAdminApiBase, readAdminCollection } from "@/lib/admin-api";

type DashboardData = { enquiries: AdminRow[]; jobs: AdminRow[]; documents: AdminRow[] };
type LoadState =
  | { status: "not-configured"; message: string }
  | { status: "loading"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; message: string; data: DashboardData };

function dateLabel(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
function zar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

export default function AdminDashboardClient() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<LoadState>({
    status: "not-configured",
    message: "The preview API URL is not configured. Metrics stay unavailable until the protected API is connected.",
  });

  useEffect(() => {
    const controller = new AbortController();
    if (!getAdminApiBase()) {
      setState({ status: "not-configured", message: "Set the preview API URL only after confirming the Worker host, Access policy and preview origin allowlist." });
      return () => controller.abort();
    }
    setState({ status: "loading", message: "Retrieving live metrics from the protected Cloudflare API." });
    Promise.all([
      readAdminCollection("enquiries", controller.signal),
      readAdminCollection("jobs", controller.signal),
      readAdminCollection("documents", controller.signal),
    ]).then(([enquiries, jobs, documents]) => {
      if (!controller.signal.aborted) {
        setState({
          status: "ready",
          message: "Counts reflect the most recent successful API response.",
          data: { enquiries, jobs, documents },
        });
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: adminApiErrorMessage(error) });
      }
    });
    return () => controller.abort();
  }, [refreshVersion]);

  const metrics = useMemo(() => {
    if (state.status !== "ready") return null;
    const { enquiries, jobs, documents } = state.data;
    const activeJobs = jobs.filter((job) => !["Completed", "Cancelled"].includes(String(job.status ?? "")));
    const draftQuotes = documents.filter((doc) => doc.kind === "Quotation" && doc.status === "Draft");
    const issuedUnpaid = documents.filter((doc) => doc.kind === "Invoice" && ["Sent", "Overdue"].includes(String(doc.status ?? "")));
    const outstandingFaceValueCents = issuedUnpaid.reduce((sum, doc) => {
      const cents = typeof doc.amount_cents === "number" ? doc.amount_cents : 0;
      return sum + Math.max(0, cents);
    }, 0);
    return {
      enquiries: enquiries.length,
      newEnquiries: enquiries.filter((item) => item.status === "New").length,
      activeJobs: activeJobs.length,
      draftQuotes: draftQuotes.length,
      issuedUnpaidCount: issuedUnpaid.length,
      outstandingFaceValueCents,
      recentEnquiries: [...enquiries].sort((a,b)=>String(b.created_at??"").localeCompare(String(a.created_at??""))).slice(0,5),
      recentJobs: [...jobs].sort((a,b)=>String(b.created_at??"").localeCompare(String(a.created_at??""))).slice(0,5),
    };
  }, [state]);

  const apiIsReady = state.status === "ready";
  const metricValue = (value: number | string | undefined) => apiIsReady && value !== undefined ? value : "—";
  const recentEnquiries = metrics?.recentEnquiries ?? [];
  const recentJobs = metrics?.recentJobs ?? [];

  return <div className="admin-page">
    <div className="admin-headline">
      <div><p className="eyebrow">NGMS / OPERATIONS OVERVIEW</p><h1>GOOD WORK<br/><span>STARTS HERE.</span></h1><p>One workspace for the enquiry-to-invoice lifecycle.</p></div>
      <div className="admin-head-actions"><Link className="button button-orange" href="/admin/enquiries">Review enquiries ↗</Link><button className="button button-outline button-dark-outline" type="button" onClick={() => setRefreshVersion(v=>v+1)} disabled={state.status==="loading"}>Refresh data</button></div>
    </div>

    <div className="api-notice" role="status"><span className="notice-dot" aria-hidden="true"/><div><strong>{state.status==="ready"?"Cloudflare API connected":state.status==="loading"?"Connecting to Cloudflare API":state.status==="error"?"Live data unavailable":"Preview integration pending"}</strong><p>{state.message}</p></div></div>

    <section className="metric-grid" aria-label="Business metrics">
      <article className="metric-card"><span className="metric-label">Enquiries</span><strong>{metricValue(metrics?.enquiries)}</strong><small>{apiIsReady ? `${metrics?.newEnquiries ?? 0} new to review` : "API data not confirmed"}</small></article>
      <article className="metric-card"><span className="metric-label">Active jobs</span><strong>{metricValue(metrics?.activeJobs)}</strong><small>{apiIsReady ? "Excludes completed and cancelled jobs" : "API data not confirmed"}</small></article>
      <article className="metric-card"><span className="metric-label">Draft quotations</span><strong>{metricValue(metrics?.draftQuotes)}</strong><small>{apiIsReady ? "Quotation documents marked Draft" : "API data not confirmed"}</small></article>
      <article className="metric-card"><span className="metric-label">Issued unpaid invoices</span><strong>{metricValue(metrics ? zar(metrics.outstandingFaceValueCents) : undefined)}</strong><small>{apiIsReady ? `${metrics?.issuedUnpaidCount ?? 0} invoices · status-based face value` : "API data not confirmed"}</small></article>
    </section>
    {apiIsReady && <p className="module-footnote">Invoice figures use document status and face value. The verified database schema has no partial-payment ledger, so this is not a reconciled balance due.</p>}

    <section className="admin-section">
      <div className="admin-section-heading"><div><p className="eyebrow">WORKSPACE</p><h2>CORE OPERATIONS</h2></div><span className="section-id">01 — 04</span></div>
      <div className="admin-shortcuts">
        <Link href="/admin/enquiries" className="admin-shortcut"><span className="shortcut-num">01</span><h3>Review enquiries</h3><p>Qualify requests, identify missing information and review customer details.</p><b aria-hidden="true">↗</b></Link>
        <Link href="/admin/jobs" className="admin-shortcut"><span className="shortcut-num">02</span><h3>Manage jobs</h3><p>Review recorded progress and completion details.</p><b aria-hidden="true">↗</b></Link>
        <Link href="/admin/quotes" className="admin-shortcut"><span className="shortcut-num">03</span><h3>Prepare quotations</h3><p>Review quote documents and current recorded status.</p><b aria-hidden="true">↗</b></Link>
        <Link href="/admin/media" className="admin-shortcut"><span className="shortcut-num">04</span><h3>Manage media</h3><p>Review approved imagery stored in the media library.</p><b aria-hidden="true">↗</b></Link>
      </div>
    </section>

    <section className="admin-lower-grid">
      <div className="data-panel"><div className="admin-list-heading"><div><strong>Recent enquiries</strong><small>Latest records returned by the API</small></div><Link className="text-link" href="/admin/enquiries">OPEN ENQUIRIES ↗</Link></div>
        {state.status==="loading" ? <p className="admin-list-message">Loading enquiries…</p> : state.status!=="ready" ? <p className="admin-list-message">Recent records are hidden until the API successfully responds.</p> : recentEnquiries.length===0 ? <p className="admin-list-message">The API returned no enquiry records.</p> : <ul className="recent-list">{recentEnquiries.map((item,i)=><li key={String(item.id??i)}><div><strong>{String(item.customer_name??"Enquiry")}</strong><span>{String(item.service??"Service not set")} · {String(item.area??"Area not set")}</span></div><div className="recent-meta"><b>{String(item.status??"—")}</b><time>{dateLabel(item.created_at)}</time></div></li>)}</ul>}
      </div>
      <div className="data-panel"><div className="admin-list-heading"><div><strong>Jobs overview</strong><small>Operational progress from live records</small></div><Link className="text-link" href="/admin/jobs">OPEN JOBS ↗</Link></div>
        {state.status==="loading" ? <p className="admin-list-message">Loading jobs…</p> : state.status!=="ready" ? <p className="admin-list-message">Job records are hidden until the API successfully responds.</p> : recentJobs.length===0 ? <p className="admin-list-message">The API returned no job records.</p> : <ul className="recent-list">{recentJobs.map((item,i)=><li key={String(item.id??i)}><div><strong>{String(item.service??"Job")}</strong><span>{String(item.customer_name??"Customer not set")} · {String(item.area??"Area not set")}</span></div><div className="recent-meta"><b>{String(item.status??"—")}</b><time>{dateLabel(item.created_at)}</time></div></li>)}</ul>}
      </div>
    </section>

    <div className="admin-callout"><span className="callout-mark" aria-hidden="true">!</span><div><strong>Write operations are still disabled in this rebuild.</strong><p>Read-only API mapping is based on the verified Worker contract. Enquiry creation, status changes, quotation/invoice edits and R2 uploads remain off until preview-origin access, authorisation and write tests are completed.</p></div></div>
  </div>;
}
