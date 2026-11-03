"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type TurnstileOptions = {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};
type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_NGMS_TURNSTILE_SITE_KEY ?? "";
const INTAKE_URL = process.env.NEXT_PUBLIC_NGMS_PUBLIC_INTAKE_URL ?? "";
const INTAKE_HOST = "ngms-public-intake-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";

const SERVICE_OPTIONS = [
  { label: "Solar Panel Cleaning", value: "Solar panel cleaning" },
  { label: "Painting", value: "Painting & finishes" },
  { label: "Waterproofing", value: "Waterproofing" },
  { label: "Paving", value: "Paving" },
  { label: "Plumbing", value: "Plumbing" },
  { label: "Electrical", value: "Electrical" },
  { label: "Pool Fibre Lining", value: "Pool fibre lining" },
  { label: "High-Pressure Cleaning", value: "High-pressure cleaning" },
  { label: "Rubble Removal", value: "Other", note: "Rubble Removal" },
  { label: "Steelwork & Welding", value: "Other", note: "Steelwork & Welding" },
  { label: "Handyman Services", value: "General property maintenance", note: "Handyman Services" },
  { label: "Subcontractor Work", value: "Other", note: "Subcontractor Work" },
  { label: "Body Corporate / Complex Maintenance", value: "Body corporate / complex maintenance" },
  { label: "General Property Maintenance", value: "General property maintenance" },
  { label: "Other / Not Sure Yet", value: "Other / not sure yet" },
] as const;

function getIntakeEndpoint(): string {
  try {
    const url = new URL(INTAKE_URL);
    if (url.protocol !== "https:" || url.hostname !== INTAKE_HOST || url.pathname !== "/" || url.search || url.hash) return "";
    return url.origin + "/api/public/enquiries";
  } catch {
    return "";
  }
}

export default function QuoteRequestForm() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string; reference?: string } | null>(null);
  const endpoint = getIntakeEndpoint();
  const configured = Boolean(SITE_KEY && endpoint);

  useEffect(() => {
    if (!configured || !widgetRef.current) return;
    let cancelled = false;
    let script: HTMLScriptElement | null = document.getElementById("ngms-turnstile-script") as HTMLScriptElement | null;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !widgetRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: SITE_KEY,
        action: "ngms_enquiry",
        callback: (token) => {
          setTurnstileToken(token);
          setSecurityError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setSecurityError("The security check expired. Please complete it again.");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setSecurityError("The security check could not load. Refresh the page and try again.");
        },
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => setSecurityError("The security check could not load. Check your connection and refresh."));
    } else {
      script = document.createElement("script");
      script.id = "ngms-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => setSecurityError("The security check could not load. Check your connection and refresh."));
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      script?.removeEventListener("load", renderWidget);
    };
  }, [configured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!phone && !email) {
      setFeedback({ kind: "error", message: "Please provide a contact number or email address." });
      return;
    }
    if (!turnstileToken) {
      setSecurityError("Please complete the security check before submitting.");
      return;
    }
    if (!endpoint) {
      setFeedback({ kind: "error", message: "The preview enquiry service is not configured. Please use the WhatsApp contact option." });
      return;
    }

    const selected = SERVICE_OPTIONS.find((item) => item.value === String(data.get("service")));
    const description = String(data.get("details") ?? "").trim();
    const preferredDate = String(data.get("preferred_date") ?? "").trim();
    const requestedService = selected?.note ?? selected?.label ?? "General property maintenance";
    const details = [
      `Requested service: ${requestedService}`,
      description,
      preferredDate ? `Preferred date: ${preferredDate}` : "",
    ].filter(Boolean).join("\n\n");

    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          customer_name: String(data.get("customer_name") ?? "").trim(),
          phone,
          email,
          service: String(data.get("service") ?? ""),
          area: String(data.get("area") ?? "").trim(),
          details,
          turnstileToken,
          submissionKey: crypto.randomUUID(),
          website: String(data.get("website") ?? ""),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || (result as { ok?: unknown }).ok !== true) {
        const message = result && typeof result === "object" && "error" in result && typeof (result as { error?: unknown }).error === "string"
          ? (result as { error: string }).error
          : "Your request could not be submitted. Please try again or contact NGMS on WhatsApp.";
        throw new Error(message);
      }
      const record = result as { reference?: string; duplicate?: boolean };
      setFeedback({
        kind: "success",
        message: record.duplicate
          ? "This request was already received. NGMS has your details."
          : "Thank you. Your quote request has been sent to NGMS for review.",
        reference: record.reference,
      });
      form.reset();
      setTurnstileToken("");
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "The request could not be submitted. Please try again." });
      setTurnstileToken("");
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      {!configured && (
        <div className="form-preview-alert" role="status">
          <strong>Preview enquiry form is not configured</strong>
          <p>Please use WhatsApp or call NGMS while the preview configuration is checked.</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <fieldset disabled={!configured || submitting}>
          <legend>Request details</legend>
          <label htmlFor="quote-service">Service required
            <select id="quote-service" name="service" defaultValue="" required>
              <option value="" disabled>Choose a service</option>
              {SERVICE_OPTIONS.map((service, index) => <option key={service.label + index} value={service.value}>{service.label}</option>)}
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
          <div className="quote-security">
            <span className="form-help">Security check</span>
            <div ref={widgetRef} />
            {securityError && <p className="form-error" role="alert">{securityError}</p>}
          </div>
          <button className="button button-orange" type="submit" disabled={submitting || !turnstileToken}>
            {submitting ? "Sending request…" : "Submit quote request ↗"}
          </button>
          <p className="form-help">Your request is recorded in the isolated NGMS preview system. A quotation is prepared only after an NGMS administrator reviews the scope.</p>
        </fieldset>
      </form>
      {feedback && (
        <div className={feedback.kind === "success" ? "form-success" : "form-error-panel"} role="status">
          <strong>{feedback.kind === "success" ? "Request received" : "Submission not completed"}</strong>
          <p>{feedback.message}</p>
          {feedback.reference && <p><strong>Reference:</strong> {feedback.reference}</p>}
          {feedback.kind === "success" && <p>Please keep this reference for your records. NGMS will review the request before preparing a quotation.</p>}
        </div>
      )}
    </div>
  );
}
