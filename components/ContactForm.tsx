"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { isValidPhone, PHONE_PATTERN, submitLead } from "@/lib/lead-submit";
import { SITE, waLink } from "@/lib/site";
import { SERVICES } from "@/lib/services";

type Status = "idle" | "sending" | "done" | "error";

const AREA_OPTIONS = [
  "Strand",
  "Gordon's Bay",
  "Somerset West",
  "Overberg (Kleinmond / Grabouw / Elgin / Bot River)",
  "Other Helderberg area",
];

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [phoneErr, setPhoneErr] = useState("");
  const [waHref, setWaHref] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields, people don't.
    if (String(data.get("website") || "")) {
      setStatus("done");
      return;
    }

    const first = String(data.get("first") || "").trim();
    const last = String(data.get("last") || "").trim();
    const name = [first, last].filter(Boolean).join(" ");
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim() || null;
    const suburb = String(data.get("area") || "");
    const serviceName = String(data.get("service") || "");
    const service = SERVICES.find((s) => s.name === serviceName);
    const notes = String(data.get("notes") || "").trim();
    const consent = Boolean(data.get("consent"));

    if (!isValidPhone(phone)) {
      setPhoneErr("Please enter a valid phone number, e.g. 063 138 7945.");
      (form.elements.namedItem("phone") as HTMLInputElement | null)?.focus();
      return;
    }
    setPhoneErr("");
    setStatus("sending");

    // Same lead table + email ping as the quote form, so contact-page
    // enquiries land in the admin lead inbox alongside quote requests.
    const result = await submitLead(
      {
        name,
        phone,
        email,
        suburb,
        service: serviceName,
        service_slug: service?.slug ?? null,
        message: `${notes}${consent ? `\nPOPIA consent given: ${new Date().toISOString()}` : ""}`,
      },
      { name, phone, email, suburb, service: serviceName, message: notes, consent }
    );

    const waMsg = [`Hi NextGen, enquiry from ${name}.`, `Phone: ${phone}`, `Area: ${suburb}`, `Service: ${serviceName}`, notes && `Message: ${notes}`]
      .filter(Boolean)
      .join("\n");
    setWaHref(waLink(waMsg));
    setStatus(result.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="py-6 text-center">
        <p role="status" className="font-heading text-3xl font-bold uppercase text-paper">Thanks &mdash; message received</p>
        <p className="mx-auto mt-3 max-w-sm text-mist">
          We&rsquo;ll get back to you, usually the same day (Mon&ndash;Sat). Photos help us quote faster.
        </p>
        <a
          href={waHref || waLink("Hi NextGen, following up on my enquiry.")}
          className="btn-wa mt-5"
          target="_blank"
          rel="noopener noreferrer"
        >
          Send photos on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input required name="first" autoComplete="given-name" maxLength={60} placeholder="First name" className="w-full" />
        </Field>
        <Field label="Last name">
          <input name="last" autoComplete="family-name" placeholder="Last name" className="w-full" />
        </Field>
      </div>
      <Field label="Mobile / WhatsApp number">
        <input
          required
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          pattern={PHONE_PATTERN}
          maxLength={20}
          placeholder={SITE.phoneDisplay}
          aria-invalid={phoneErr ? true : undefined}
          aria-describedby={phoneErr ? "contact-phone-err" : undefined}
          onChange={() => phoneErr && setPhoneErr("")}
          className="w-full"
        />
        {phoneErr && (
          <span id="contact-phone-err" role="alert" className="mt-1.5 block text-xs text-orange">
            {phoneErr}
          </span>
        )}
      </Field>
      <Field label="Email (optional)">
        <input type="email" name="email" autoComplete="email" placeholder="you@example.com" className="w-full" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area">
          <select name="area" className="w-full">
            {AREA_OPTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Service">
          <select name="service" className="w-full">
            {SERVICES.map((s) => (
              <option key={s.slug}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Message">
        <textarea
          name="notes"
          placeholder="Tell us what needs doing"
          maxLength={2000}
          className="min-h-[130px] w-full"
        />
      </Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-mist">
        <input required type="checkbox" name="consent" className="mt-0.5" />
        <span>
          I agree that NextGen may store my details and contact me about this enquiry and related service reminders, as
          set out in our <a href="/privacy" className="underline">privacy policy</a> (POPIA).
        </span>
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-quote justify-self-start !px-9 disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      {status === "error" && (
        <div role="alert" className="rounded-panel border border-orange/50 bg-orange/10 p-4 text-sm">
          <p className="font-semibold text-paper">We couldn&rsquo;t send that from here.</p>
          <p className="mt-1 text-mist">Tap below to send the same message on WhatsApp, or call {SITE.phoneDisplay}.</p>
          <a href={waHref || waLink()} target="_blank" rel="noopener noreferrer" className="btn-wa mt-3">
            Send on WhatsApp
          </a>
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-heading text-sm font-bold uppercase tracking-wider text-paper">
        {label}
      </span>
      {children}
    </label>
  );
}
