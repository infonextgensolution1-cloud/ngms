"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AdminRow, adminApiErrorMessage, createCommercialDocument, shareCommercialQuote } from "@/lib/admin-api";

type QuoteLineDraft = { description: string; quantity: string; unit: string; unitPrice: string };
type SavedQuote = { id: string; reference: string };
type SharedQuote = { url: string; expires_at: string; reference: string };

function zar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

export default function EnquiryQuoteBuilder({
  enquiry, onClose, onComplete,
}: {
  enquiry: AdminRow;
  onClose: () => void;
  onComplete: () => void;
}) {
  const initialDescription = [String(enquiry.service ?? "Quoted work"), String(enquiry.details ?? "").trim()].filter(Boolean).join(" — ");
  const [lines, setLines] = useState<QuoteLineDraft[]>([{ description: initialDescription.slice(0, 500), quantity: "1", unit: "job", unitPrice: "" }]);
  const [discount, setDiscount] = useState("0");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<SavedQuote | null>(null);
  const [shared, setShared] = useState<SharedQuote | null>(null);

  const subtotalCents = useMemo(() => lines.reduce((sum, line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum;
    return sum + Math.round(quantity * Math.round(unitPrice * 100));
  }, 0), [lines]);
  const discountCents = Math.round(Number(discount || 0) * 100);
  const taxableCents = Math.max(0, subtotalCents - Math.max(0, discountCents));
  const vatCents = vatEnabled ? Math.round(taxableCents * 0.15) : 0;
  const totalCents = taxableCents + vatCents;

  function updateLine(index: number, patch: Partial<QuoteLineDraft>) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saved || saving) return;
    setError("");
    setMessage("");
    const validLines = lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unit: line.unit.trim(),
      unit_price_cents: Math.round(Number(line.unitPrice) * 100),
    }));
    if (!enquiry.id || typeof enquiry.customer_id !== "string") {
      setError("Link this enquiry to a CRM customer before preparing a quotation.");
      return;
    }
    if (!validLines.length || validLines.some((line) =>
      !line.description || line.description.length > 500 ||
      !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 100000 ||
      !line.unit || line.unit.length > 40 ||
      !Number.isSafeInteger(line.unit_price_cents) || line.unit_price_cents < 0 || line.unit_price_cents > 10000000000
    )) {
      setError("Check each line: provide a description, positive quantity, unit and valid ZAR unit price.");
      return;
    }
    if (validLines.length > 100 || !Number.isSafeInteger(discountCents) || discountCents < 0 || discountCents > subtotalCents) {
      setError("Check the line count and discount. The discount cannot exceed the subtotal.");
      return;
    }
    setSaving(true);
    try {
      const result = await createCommercialDocument({
        kind: "Quotation",
        customer_id: enquiry.customer_id,
        lines: validLines,
        discount_cents: discountCents,
        vat_enabled: vatEnabled,
        vat_rate_basis_points: vatEnabled ? 1500 : 0,
        notes: notes.trim(),
      });
      if (typeof result.item.id !== "string" || typeof result.item.reference !== "string") {
        throw new Error("The quotation was created but the Worker response did not include its ID and reference. Refresh the Quotations module before retrying.");
      }
      setSaved({ id: result.item.id, reference: result.item.reference });
      setMessage(`Draft ${result.item.reference} saved. Review the line items and total before issuing the customer link.`);
    } catch (cause) {
      setError(adminApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function issueLink() {
    if (!saved || shared || sharing || !enquiry.id) return;
    setSharing(true);
    setError("");
    try {
      const result = await shareCommercialQuote(saved.id, String(enquiry.id));
      setShared(result);
      setMessage(`${result.reference} has been issued. The customer link is ready for you to send through an approved channel.`);
      onComplete();
    } catch (cause) {
      setError(adminApiErrorMessage(cause));
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    if (!shared?.url) return;
    try {
      await navigator.clipboard.writeText(shared.url);
      setMessage("Quotation link copied. Send it to the customer using your approved communication channel.");
    } catch {
      setMessage("Copy is unavailable in this browser. Select and copy the quotation link below.");
    }
  }

  const phone = String(enquiry.phone ?? "").replace(/\D/g, "");
  const whatsappPhone = phone.startsWith("0") ? "27" + phone.slice(1) : phone.startsWith("27") ? phone : "";
  const whatsappHref = shared && whatsappPhone
    ? "https://wa.me/" + whatsappPhone + "?text=" + encodeURIComponent(`NGMS quotation ${shared.reference}: ${shared.url}`)
    : "";

  return <section className="action-panel">
    <div className="action-panel-head">
      <div><strong>Prepare quotation for {String(enquiry.customer_name ?? "customer")}</strong><small>{String(enquiry.service ?? "Service")} · {String(enquiry.area ?? "Area not supplied")} · Enquiry {String(enquiry.id ?? "")}</small></div>
      <button type="button" className="button button-outline button-dark-outline" onClick={onClose}>Close</button>
    </div>
    {!saved ? <form className="admin-form-grid" onSubmit={saveDraft}>
      {lines.map((line, index) => <div className="admin-form-wide" key={index}>
        <div className="admin-form-grid">
          <label>Work description<input value={line.description} onChange={(e)=>updateLine(index,{description:e.target.value})} maxLength={500} required/></label>
          <label>Quantity<input type="number" value={line.quantity} onChange={(e)=>updateLine(index,{quantity:e.target.value})} min="0.001" max="100000" step="0.001" required/></label>
          <label>Unit<input value={line.unit} onChange={(e)=>updateLine(index,{unit:e.target.value})} maxLength={40} required/></label>
          <label>Unit price (ZAR)<input type="number" value={line.unitPrice} onChange={(e)=>updateLine(index,{unitPrice:e.target.value})} min="0" max="100000000" step="0.01" required/></label>
        </div>
        {lines.length > 1 && <button type="button" className="button button-small" onClick={()=>setLines(current=>current.filter((_,i)=>i!==index))}>Remove line</button>}
      </div>)}
      <div className="admin-form-wide form-actions"><button type="button" className="button button-outline button-dark-outline" onClick={()=>setLines(current=>current.length<100?[...current,{description:"",quantity:"1",unit:"job",unitPrice:""}]:current)} disabled={lines.length>=100}>+ Add line</button></div>
      <label>Discount (ZAR)<input type="number" min="0" step="0.01" max={subtotalCents/100} value={discount} onChange={(e)=>setDiscount(e.target.value)}/></label>
      <label className="checkbox-field"><input type="checkbox" checked={vatEnabled} onChange={(e)=>setVatEnabled(e.target.checked)}/> Apply VAT at 15%</label>
      <label className="admin-form-wide">Quotation notes / terms<textarea rows={3} maxLength={4000} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Scope exclusions, validity period, payment terms…"/></label>
      <div className="admin-form-wide">
        <p>Subtotal: <strong>{zar(subtotalCents)}</strong> · Discount: <strong>{zar(discountCents)}</strong> · VAT: <strong>{zar(vatCents)}</strong></p>
        <p>Quotation total: <strong>{zar(totalCents)}</strong></p>
      </div>
      <div className="admin-form-wide form-actions"><button className="button button-orange" type="submit" disabled={saving}>{saving?"Saving draft…":"Save draft quotation"}</button><span>Drafts are private. Saving does not send anything to the customer.</span></div>
    </form> : <div>
      <h3>{saved.reference} · {zar(totalCents)}</h3>
      <p>{message}</p>
      {!shared ? <button type="button" className="button button-orange" onClick={()=>void issueLink()} disabled={sharing}>{sharing?"Issuing…":"Approve & create customer link"}</button> : <div>
        <p><strong>Customer quotation link</strong></p>
        <p><a className="text-link" href={shared.url} target="_blank" rel="noopener noreferrer">{shared.url}</a></p>
        <p>Expires: {new Date(shared.expires_at).toLocaleString("en-ZA")}. One customer decision is allowed.</p>
        <div className="contact-actions">
          <button type="button" className="button button-outline button-dark-outline" onClick={()=>void copyLink()}>Copy link</button>
          {whatsappHref && <a className="button button-orange" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp message ↗</a>}
        </div>
        <p className="module-footnote">No email or WhatsApp message was sent automatically. Review the pre-filled message and send it yourself.</p>
      </div>}
    </div>}
    {error && <p className="action-result action-result-error" role="alert">{error}</p>}
    {message && !shared && <p className="inline-feedback" role="status">{message}</p>}
  </section>;
}
