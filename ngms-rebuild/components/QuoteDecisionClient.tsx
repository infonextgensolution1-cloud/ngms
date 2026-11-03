"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type QuoteLine = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

type QuoteResponse = {
  quote: {
    document_id: string;
    reference: string;
    customer_name: string;
    crm_customer_name?: string | null;
    service?: string | null;
    area?: string | null;
    kind: string;
    status: string;
    decision?: "Accepted" | "Declined" | null;
    job_id?: string | null;
    used_at?: string | null;
    expires_at: string;
    amount_cents: number;
    subtotal_cents?: number;
    discount_cents?: number;
    vat_enabled?: number;
    vat_rate_basis_points?: number;
    vat_cents?: number;
    issue_date?: string;
    notes?: string;
  };
  lines: QuoteLine[];
};

const API_BASE = (process.env.NEXT_PUBLIC_NGMS_API_BASE ?? "").replace(/\/$/, "");

function zar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

export default function QuoteDecisionClient({ token }: { token: string }) {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Declined" | null>(null);

  const load = useCallback(async () => {
    if (!API_BASE || !/^[a-f0-9]{64}$/i.test(token)) {
      setError("This quotation link is invalid or unavailable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/public/quotes/${encodeURIComponent(token)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "This quotation could not be loaded.");
      if (!body?.quote || !Array.isArray(body.lines)) throw new Error("The quotation response was incomplete.");
      setData(body as QuoteResponse);
      if (body.quote.decision === "Accepted" || body.quote.decision === "Declined") setDecision(body.quote.decision);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This quotation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const canDecide = Boolean(data && data.quote.status === "Sent" && !data.quote.used_at && !decision);
  const total = useMemo(() => data?.quote.amount_cents ?? 0, [data]);

  async function submitChoice(choice: "Accepted" | "Declined") {
    if (!canDecide || busy) return;
    const prompt = choice === "Accepted"
      ? "Accept this NGMS quotation? Acceptance creates a job record and NGMS will contact you to arrange the work."
      : "Decline this NGMS quotation?";
    if (!window.confirm(prompt)) return;

    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/public/quotes/${encodeURIComponent(token)}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ decision: choice }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Your decision could not be recorded.");
      setDecision(choice);
      setData((current) => current ? { ...current, quote: { ...current.quote, status: choice, used_at: new Date().toISOString() } } : current);
      setMessage(choice === "Accepted"
        ? `Thank you. Your acceptance has been recorded. NGMS job reference: ${body.job_id ?? "created"}. Our team will contact you to arrange the work.`
        : "Your decision has been recorded. No job was created from this quotation.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your decision could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <section className="page-section"><div className="container prose-panel" role="status"><h2>LOADING YOUR QUOTATION</h2><p>Retrieving the private quotation securely…</p></div></section>;
  if (error && !data) return <section className="page-section"><div className="container prose-panel"><h2>QUOTATION UNAVAILABLE</h2><p role="alert">{error}</p><p>Contact NGMS for assistance. Do not forward this private quotation link to anyone else.</p></div></section>;
  if (!data) return null;

  const quote = data.quote;
  return <section className="page-section">
    <div className="container prose-panel">
      <p className="eyebrow">NGMS / PRIVATE QUOTATION</p>
      <h2>{quote.reference}</h2>
      <p>Prepared for <strong>{quote.crm_customer_name || quote.customer_name}</strong></p>
      <p>{quote.service || "Property maintenance"}{quote.area ? ` · ${quote.area}` : ""}</p>
      <p>Quotation date: {quote.issue_date || "As issued"} · Status: <strong>{decision || quote.status}</strong></p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Work description</th><th>Qty</th><th>Unit</th><th>Unit price</th><th>Total</th></tr></thead>
          <tbody>{data.lines.map((line, index) => <tr key={index}>
            <td>{line.description}</td><td>{line.quantity}</td><td>{line.unit}</td>
            <td>{zar(line.unit_price_cents)}</td><td>{zar(line.line_total_cents)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="quote-total">
        <p>Subtotal: <strong>{zar(Number(quote.subtotal_cents ?? total))}</strong></p>
        {Number(quote.discount_cents ?? 0) > 0 && <p>Discount: <strong>−{zar(Number(quote.discount_cents))}</strong></p>}
        {quote.vat_enabled === 1 && <p>VAT ({(Number(quote.vat_rate_basis_points ?? 0) / 100).toFixed(2)}%): <strong>{zar(Number(quote.vat_cents ?? 0))}</strong></p>}
        <p><strong>Total: {zar(total)}</strong></p>
      </div>
      {quote.notes && <div><h3>Quotation notes and terms</h3><p>{quote.notes}</p></div>}
      {error && <p role="alert" className="inline-feedback">{error}</p>}
      {message && <div className="action-result" role="status"><strong>{decision === "Accepted" ? "ACCEPTANCE RECORDED" : "DECISION RECORDED"}</strong><p>{message}</p></div>}
      {canDecide
        ? <div className="contact-actions">
            <button className="button button-orange" type="button" onClick={() => void submitChoice("Accepted")} disabled={busy}>{busy ? "Submitting…" : "Accept quotation"}</button>
            <button className="button button-outline button-dark-outline" type="button" onClick={() => void submitChoice("Declined")} disabled={busy}>Decline quotation</button>
          </div>
        : !message && <p>This quotation is no longer awaiting a customer decision. Contact NGMS if you need assistance.</p>}
      <p className="module-footnote">This private link expires after 30 days and can be used for one customer decision only.</p>
    </div>
  </section>;
}
