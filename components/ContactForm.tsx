"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/ngms-public-supabase";
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);

    const first = String(data.get("first") || "").trim();
    const last = String(data.get("last") || "").trim();
    const name = [first, last].filter(Boolean).join(" ");
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim() || null;
    const suburb = String(data.get("area") || "");
    const serviceName = String(data.get("service") || "");
    const service = SERVICES.find((s) => s.name === serviceName);
    const notes = String(data.get("notes") || "").trim();

    // Same lead table + email ping as the quote form, so contact-page
    // enquiries land in the admin lead inbox alongside quote requests.
    const { error } = await supabase.from("leads").insert({
      name,
      phone,
      email,
      suburb,
      service: serviceName,
      service_slug: service?.slug ?? null,
      message: notes,
      status: "new",
    });

    if (error) {
      setStatus("error");
      return;
    }

    // Fire-and-forget: the lead is already saved, so a failed email must
    // never block the customer.
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name,
        phone,
        email,
        suburb,
        service: serviceName,
        message: notes,
      }),
    }).catch(() => {});

    setStatus("done");
    const waMsg = `Hi NextGen, enquiry from ${name}.\nPhone: ${phone}\nArea: ${suburb}\nService: ${serviceName}`;
    window.open(waLink(waMsg), "_blank");
  }

  if (status === "done") {
    return (
      <div className="py-6 text-center">
        <p className="font-heading text-3xl font-bold uppercase text-paper">Thanks &mdash; message sent!</p>
        <p className="mx-auto mt-3 max-w-sm text-mist">
          We&rsquo;ve logged your enquiry and will reply the same day. If WhatsApp didn&rsquo;t open
          automatically, you can message us directly.
        </p>
        <a
          href={waLink("Hi NextGen, following up on my enquiry.")}
          className="btn btn-wa mt-5 inline-flex"
          target="_blank"
          rel="noreferrer"
        >
          Message on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input required name="first" autoComplete="given-name" placeholder="First name" className="w-full" />
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
          autoComplete="tel"
          placeholder={SITE.phoneDisplay}
          className="w-full"
        />
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
          className="min-h-[130px] w-full"
        />
      </Field>
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-orange px-9 py-3 font-heading text-base font-bold uppercase tracking-wide text-jet transition hover:bg-orange-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      {status === "error" && (
        <p className="text-sm text-orange">
          Something went wrong sending that &mdash; please WhatsApp us directly on {SITE.phoneDisplay}.
        </p>
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
