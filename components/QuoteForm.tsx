"use client";

import { useState } from "react";
import { supabase } from "@/lib/ngms-public-supabase";
import { SITE, waLink } from "@/lib/site";
import { SERVICES } from "@/lib/services";

type Status = "idle" | "sending" | "done" | "error";

export default function QuoteForm({ initialService }: { initialService?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const email = String(data.get("email") || "") || null;
    const suburb = String(data.get("area") || "");
    const serviceName = String(data.get("service") || "");
    const service = SERVICES.find((s) => s.name === serviceName);
    const size = String(data.get("size") || "");
    const pref = String(data.get("pref") || "");
    const notes = String(data.get("notes") || "");

    const message = [size && `Size/details: ${size}`, pref && `Preferred contact: ${pref}`, notes]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("leads").insert({
      name,
      phone,
      email,
      suburb,
      service: serviceName,
      service_slug: service?.slug ?? null,
      message,
      status: "new",
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("done");
    const waMsg = `Hi NGSMS, quote request from ${name}.\nPhone: ${phone}\nArea: ${suburb}\nService: ${serviceName}`;
    window.open(waLink(waMsg), "_blank");
  }

  if (status === "done") {
    return (
      <div className="card max-w-[520px] mx-auto text-center">
        <h3 className="text-xl">Thanks — request sent!</h3>
        <p className="text-mist mt-2">
          We&rsquo;ve logged your request and will reply the same day. If WhatsApp didn&rsquo;t open automatically,
          you can message us directly.
        </p>
        <a href={waLink("Hi NGSMS, following up on my quote request.")} className="btn btn-wa mt-4 inline-block" target="_blank" rel="noreferrer">
          Message on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="grid gap-3.5 max-w-[520px] mx-auto" onSubmit={onSubmit}>
      <div className="bg-orange rounded-lg text-white text-center font-bold text-sm py-2.5 px-3">
        10% OFF your first booking (excludes solar) · Solar panel cleaning from R550
      </div>
      <Field label="Full name">
        <input required name="name" placeholder="Your name" className="field" />
      </Field>
      <Field label="Phone / WhatsApp">
        <input required name="phone" placeholder={SITE.phoneDisplay} className="field" />
      </Field>
      <Field label="Email (optional)">
        <input type="email" name="email" placeholder="you@example.com" className="field" />
      </Field>
      <Field label="Area">
        <select name="area" className="field">
          <option>Strand</option>
          <option>Gordon&rsquo;s Bay</option>
          <option>Somerset West</option>
          <option>Overberg (Kleinmond / Grabouw / Elgin / Bot River)</option>
          <option>Other Helderberg area</option>
        </select>
      </Field>
      <Field label="Service">
        <select name="service" defaultValue={initialService} className="field">
          {SERVICES.map((s) => (
            <option key={s.slug}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Size / details">
        <input name="size" placeholder="e.g. 20 panels, 3-bed exterior" className="field" />
      </Field>
      <Field label="Preferred contact">
        <select name="pref" className="field">
          <option>WhatsApp</option>
          <option>Phone call</option>
          <option>Email</option>
        </select>
      </Field>
      <Field label="Notes">
        <textarea name="notes" className="field min-h-[110px]" />
      </Field>
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send quote request"}
      </button>
      {status === "error" && (
        <p className="text-orange text-sm text-center">
          Something went wrong sending that — please WhatsApp us directly on {SITE.phoneDisplay}.
        </p>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="block text-mist text-sm font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
