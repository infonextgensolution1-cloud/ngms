"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const SERVICE_OPTIONS = [
  "Solar Panel Cleaning","Painting","Waterproofing","Paving","Plumbing","Electrical",
  "Pool Fibre Lining","High-Pressure Cleaning","Rubble Removal","Steelwork & Welding",
  "Handyman Services","Subcontractor Work","Body Corporate / Complex Maintenance",
  "General Property Maintenance","Other / Not Sure Yet",
];

export default function QuoteRequestForm() {
  const [submitting,setSubmitting]=useState(false);
  const [feedback,setFeedback]=useState<{kind:"success"|"error";message:string;reference?:string}|null>(null);

  async function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const form=event.currentTarget;
    const data=new FormData(form);
    const phone=String(data.get("phone")??"").trim();
    const email=String(data.get("email")??"").trim();
    const details=String(data.get("details")??"").trim();
    if(!phone&&!email) {
      setFeedback({kind:"error",message:"Please provide a contact number or email address."});
      return;
    }
    if(details.length<10) {
      setFeedback({kind:"error",message:"Please describe the work in at least 10 characters."});
      return;
    }
    const preferredDate=String(data.get("preferred_date")??"").trim();
    const finalDetails=[details,preferredDate?`Preferred date: ${preferredDate}`:""].filter(Boolean).join("\n\n");
    setSubmitting(true);
    try {
      const response=await fetch("/api/public/enquiries",{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        cache:"no-store",
        body:JSON.stringify({
          customer_name:String(data.get("customer_name")??"").trim(),
          phone,email,
          service:String(data.get("service")??""),
          area:String(data.get("area")??"").trim(),
          details:finalDetails,
          submissionKey:crypto.randomUUID(),
          website:String(data.get("website")??""),
        }),
      });
      const result=await response.json().catch(()=>null) as {ok?:boolean;error?:string;reference?:string;duplicate?:boolean}|null;
      if(!response.ok||!result?.ok) throw new Error(result?.error||"Your request could not be submitted. Please try again or contact NGMS on WhatsApp.");
      setFeedback({
        kind:"success",
        message:result.duplicate?"This request was already received. NGMS has your details.":"Thank you. Your quote request has been sent to NGMS for review.",
        reference:result.reference,
      });
      form.reset();
    } catch(error) {
      setFeedback({kind:"error",message:error instanceof Error?error.message:"The request could not be submitted. Please try again."});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting}>
          <legend>Request details</legend>
          <label htmlFor="quote-service">Service required
            <select id="quote-service" name="service" defaultValue="" required>
              <option value="" disabled>Choose a service</option>
              {SERVICE_OPTIONS.map(service=><option key={service} value={service}>{service}</option>)}
            </select>
          </label>
          <label htmlFor="quote-customer">Your name
            <input id="quote-customer" name="customer_name" placeholder="Full name or company" autoComplete="name" minLength={2} maxLength={160} required />
          </label>
          <label htmlFor="quote-phone">Contact number
            <input id="quote-phone" name="phone" type="tel" placeholder="e.g. 063 138 7945" autoComplete="tel" maxLength={40} />
          </label>
          <label htmlFor="quote-email">Email address
            <input id="quote-email" name="email" type="email" placeholder="name@example.co.za" autoComplete="email" maxLength={254} />
          </label>
          <label htmlFor="quote-area">Property or site area
            <input id="quote-area" name="area" placeholder="Suburb or town" autoComplete="address-level2" minLength={2} maxLength={160} required />
          </label>
          <label htmlFor="quote-date">Preferred date (optional)
            <input id="quote-date" name="preferred_date" type="date" />
          </label>
          <label htmlFor="quote-details">Describe the work
            <textarea id="quote-details" name="details" placeholder="Include the issue, approximate size, access requirements and preferred timing." rows={5} minLength={10} maxLength={3500} required />
          </label>
          <div className="quote-honeypot" aria-hidden="true">
            <label htmlFor="quote-website">Leave this field empty</label>
            <input id="quote-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button className="button button-orange" type="submit" disabled={submitting}>
            {submitting?"Sending request…":"Submit quote request ↗"}
          </button>
          <p className="form-help">Your enquiry is recorded securely for the NGMS team to review. A formal quotation is prepared after the job requirements have been checked.</p>
        </fieldset>
      </form>
      {feedback&&<div className={feedback.kind==="success"?"form-success":"form-error"} role="status">
        <strong>{feedback.message}</strong>
        {feedback.reference&&<p>Enquiry reference: <b>{feedback.reference}</b></p>}
      </div>}
    </div>
  );
}
