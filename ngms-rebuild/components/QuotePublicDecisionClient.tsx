"use client";

import { useEffect, useState } from "react";
import { readPublicQuotation, submitPublicQuotationDecision, type PublicQuotationResponse } from "@/lib/admin-api";

function money(cents: unknown): string {
  const value = typeof cents === "number" ? cents : Number(cents ?? 0);
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value / 100);
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-ZA", { day:"numeric", month:"long", year:"numeric" });
}

export default function QuotePublicDecisionClient({ token }: { token: string }) {
  const [result,setResult] = useState<PublicQuotationResponse | null>(null);
  const [loading,setLoading] = useState(true);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [decision,setDecision] = useState<"Accepted"|"Declined"|null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    readPublicQuotation(token,controller.signal)
      .then((value)=>{if(!controller.signal.aborted)setResult(value);})
      .catch((e)=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"This quotation link is unavailable.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[token]);

  async function decide(next: "Accepted"|"Declined") {
    if (!result || result.quote.status !== "Sent" || result.quote.used_at || submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response=await submitPublicQuotationDecision(token,next);
      setDecision(next);
      setMessage(response.decision==="Accepted"
        ? (response.job_id
          ? "Thank you. Your acceptance has been recorded and a job has been created for NGMS. Your job reference is " + response.job_id + ". Our team will contact you to arrange the work."
          : "Thank you. Your acceptance has been recorded. NGMS can now arrange the next steps.")
        : "Your response has been recorded. Contact NGMS if you would like to discuss changes.");
      setResult((current)=>current?{...current,quote:{...current.quote,status:response.decision,decision:response.decision as "Accepted"|"Declined",job_id:response.job_id ?? null,used_at:new Date().toISOString()}}:current);
    } catch(e) {
      setError(e instanceof Error?e.message:"Your response could not be saved. Please contact NGMS.");
    } finally {
      setSubmitting(false);
    }
  }

  const quote=result?.quote;
  const canDecide=Boolean(quote && quote.status==="Sent" && !quote.used_at && !decision);

  return <section className="page-section">
    <div className="container">
      <div className="prose-panel max-w-4xl mx-auto">
        {loading ? <div role="status"><p className="eyebrow">NGMS / SECURE QUOTATION</p><h2>LOADING YOUR QUOTATION…</h2><p>Please wait while the secure link is checked.</p></div>
        : error && !result ? <div role="alert"><p className="eyebrow">NGMS / QUOTATION</p><h2>THIS QUOTATION LINK IS UNAVAILABLE.</h2><p>{error}</p><p>Contact NGMS to request a fresh quotation link.</p></div>
        : quote && <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="eyebrow">NGMS / CUSTOMER QUOTATION</p><h2 className="text-2xl sm:text-3xl">{quote.reference}</h2><p className="mt-2">Prepared for <strong>{quote.customer_name}</strong></p></div>
            <div className="text-left sm:text-right"><span className="preview-pill">{quote.status.toUpperCase()}</span><p className="text-xs text-mist mt-2">Issued {dateLabel(quote.issue_date)}</p></div>
          </div>
          {quote.notes && <div className="mt-5"><h3 className="font-semibold">Scope and notes</h3><p className="whitespace-pre-wrap mt-1">{quote.notes}</p></div>}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-darkgrey text-left"><th className="py-2 pr-3">Description</th><th className="py-2 px-2 text-right">Qty</th><th className="py-2 px-2 text-right">Unit price</th><th className="py-2 pl-2 text-right">Total</th></tr></thead>
              <tbody>{result.lines.map((line,index)=><tr key={index} className="border-b border-darkgrey/60"><td className="py-3 pr-3">{line.description}</td><td className="py-3 px-2 text-right">{line.quantity} {line.unit}</td><td className="py-3 px-2 text-right">{money(line.unit_price_cents)}</td><td className="py-3 pl-2 text-right">{money(line.line_total_cents)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="ml-auto mt-5 max-w-sm space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span>Subtotal</span><strong>{money(quote.subtotal_cents)}</strong></div>
            {quote.discount_cents>0 && <div className="flex justify-between gap-4"><span>Discount</span><strong>−{money(quote.discount_cents)}</strong></div>}
            {quote.vat_enabled===1 && <div className="flex justify-between gap-4"><span>VAT ({(quote.vat_rate_basis_points/100).toFixed(2)}%)</span><strong>{money(quote.vat_cents)}</strong></div>}
            <div className="flex justify-between gap-4 border-t border-darkgrey pt-3 text-lg"><span>Total</span><strong>{money(quote.amount_cents)}</strong></div>
          </div>
          {error && <p className="mt-5 text-orange" role="alert">{error}</p>}
          {message && <div className="mt-5 action-result" role="status"><strong>{decision==="Accepted"?"Quotation accepted":"Response recorded"}</strong><p>{message}</p></div>}
          {canDecide ? <div className="mt-7 border-t border-darkgrey pt-5">
            <h3 className="font-semibold">Your decision</h3>
            <p className="text-sm text-mist mt-1">Review the scope and total above, then record your decision.</p>
            <div className="contact-actions mt-4">
              <button type="button" className="button button-orange" onClick={()=>decide("Accepted")} disabled={submitting}>{submitting?"Submitting…":"Accept quotation"}</button>
              <button type="button" className="button button-outline button-dark-outline" onClick={()=>decide("Declined")} disabled={submitting}>{submitting?"Submitting…":"Decline quotation"}</button>
            </div>
            <p className="text-xs text-mist mt-3">This secure link can record one customer decision and expires after 30 days.</p>
          </div> : <div className="mt-7 border-t border-darkgrey pt-5"><p className="text-sm font-semibold">This quotation is no longer awaiting a customer decision.</p><p className="text-sm text-mist mt-1">Contact NGMS if you need an updated quotation or have questions about the recorded response.</p></div>}
        </>}
      </div>
    </div>
  </section>;
}
