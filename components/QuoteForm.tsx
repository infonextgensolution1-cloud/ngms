"use client";

import { useMemo, useState } from "react";
import { instantEstimate } from "@/lib/instant-estimate";
import { useForecast, jobWeather } from "@/lib/job-weather";
import { tradeConditions } from "@/lib/helderberg";
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

// Maps an incoming suburb name (e.g. from a suburb-specific service page)
// onto the fixed set of options this select offers.
function matchArea(initialArea?: string) {
  if (!initialArea) return undefined;
  const exact = AREA_OPTIONS.find((a) => a === initialArea);
  if (exact) return exact;
  const overbergTowns = ["Kleinmond", "Grabouw", "Elgin", "Bot River"];
  if (overbergTowns.some((t) => initialArea.includes(t))) {
    return "Overberg (Kleinmond / Grabouw / Elgin / Bot River)";
  }
  return undefined;
}

// Downscale + re-encode in the browser so uploads stay well under Vercel's 4.5MB body limit.
async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/jpeg", quality)
  );
}

const WEATHER_TRADES: Record<string, string> = {
  "solar-panel-cleaning": "Solar panel cleaning",
  painting: "Painting",
  waterproofing: "Waterproofing",
  paving: "Paving",
};

export default function QuoteForm({
  initialService,
  initialArea,
  initialSize,
}: {
  initialService?: string;
  initialArea?: string;
  initialSize?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [serviceName, setServiceName] = useState(initialService ?? SERVICES[0]?.name ?? "");
  const [sizeText, setSizeText] = useState(initialSize ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [prefDate, setPrefDate] = useState("");
  const days = useForecast();

  const svc = SERVICES.find((x) => x.name === serviceName);
  const estimate = useMemo(() => instantEstimate(svc?.slug, sizeText), [svc?.slug, sizeText]);
  const wxTrade = svc ? WEATHER_TRADES[svc.slug] : undefined;
  const dateWarning = useMemo(
    () => (prefDate && svc ? jobWeather(svc.name, prefDate, days)?.note ?? null : null),
    [prefDate, svc, days]
  );
  const goodDays = useMemo(
    () =>
      wxTrade
        ? days.filter((d) => tradeConditions(d).find((c) => c.trade === wxTrade)?.go).slice(0, 5)
        : [],
    [days, wxTrade]
  );
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const email = String(data.get("email") || "") || null;
    const suburb = String(data.get("area") || "");
    // Honeypot: bots fill hidden fields, people don't.
    if (String(data.get("website") || "")) {
      setStatus("done");
      return;
    }
    const service = SERVICES.find((s) => s.name === serviceName);
    const size = String(data.get("size") || "");
    const pref = String(data.get("pref") || "");
    const notes = String(data.get("notes") || "");

    // Photo upload is best-effort: the lead is never blocked by it.
    let photoUrl: string | null = null;
    if (photo) {
      try {
        const blob = await compressImage(photo);
        const fd = new FormData();
        fd.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const r = await fetch("/api/quote-photo", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (j?.url) photoUrl = j.url;
      } catch {
        /* continue without the photo */
      }
    }

    const message = [
      size && `Size/details: ${size}`,
      prefDate && `Preferred date: ${prefDate}`,
      pref && `Preferred contact: ${pref}`,
      `POPIA consent given: ${new Date().toISOString()}`,
      notes,
    ]
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
      photo_url: photoUrl,
      status: "new",
    });

    if (error) {
      setStatus("error");
      return;
    }

    // Email ping to Jacques via Resend (/api/notify). Fire-and-forget: the
    // lead is already saved, so a failed email must never block the customer.
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
        sizeDetails: size,
        preferredContact: pref,
        preferredDate: prefDate || undefined,
        estimate: estimate ?? undefined,
        photoUrl: photoUrl ?? undefined,
        consent: true,
        message: notes,
      }),
    }).catch(() => {});

    setStatus("done");
    const waMsg = `Hi NextGen, quote request from ${name}.\nPhone: ${phone}\nArea: ${suburb}\nService: ${serviceName}`;
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
        <a href={waLink("Hi NextGen, following up on my quote request.")} className="btn btn-wa mt-4 inline-block" target="_blank" rel="noreferrer">
          Message on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="grid grid-cols-1 gap-3.5 w-full max-w-[520px] mx-auto" onSubmit={onSubmit}>
      <div className="bg-orange rounded-lg text-white text-center font-bold text-xs sm:text-sm py-2.5 px-3">
        Solar panel cleaning from R550 (up to 10 panels) · 10% off your first booking on all other services
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
        <select name="area" defaultValue={matchArea(initialArea)} className="field">
          {AREA_OPTIONS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Field>
      <Field label="Service">
        <select name="service" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="field">
          {SERVICES.map((s) => (
            <option key={s.slug}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Size / details">
        <input name="size" value={sizeText} onChange={(e) => setSizeText(e.target.value)} placeholder="e.g. 20 panels, 60 m²" className="field" />
      </Field>
      {estimate && (
        <div className="rounded-lg border border-orange/40 bg-orange/10 px-3 py-2.5 text-sm" role="status">
          <strong>Instant guide:</strong> {estimate}
          <span className="block text-mist text-xs mt-1">A guide only. Your firm quote follows once we&rsquo;ve seen the job.</span>
        </div>
      )}
      <Field label="Photo of the job (optional)">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 15 * 1024 * 1024) {
              setPhotoErr("That photo is over 15MB. Please pick a smaller one.");
              setPhoto(null);
              e.target.value = "";
            } else {
              setPhotoErr("");
              setPhoto(f);
            }
          }}
        />
        {photoErr && <span className="text-orange text-xs">{photoErr}</span>}
      </Field>
      <Field label="Preferred date (optional)">
        <input type="date" min={today} value={prefDate} onChange={(e) => setPrefDate(e.target.value)} className="field" />
        {dateWarning && <span className="block text-orange text-xs mt-1.5" role="alert">Weather heads-up: {dateWarning}</span>}
        {goodDays.length > 0 && (
          <span className="flex flex-wrap gap-1.5 mt-2 items-center text-xs text-mist">
            Good weather for this job:
            {goodDays.map((d) => (
              <button
                type="button"
                key={d.date}
                onClick={() => setPrefDate(d.date)}
                className="rounded-full border border-orange/50 px-2.5 py-1 font-semibold text-jet hover:bg-orange/10"
              >
                {new Date(d.date + "T12:00:00").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
              </button>
            ))}
          </span>
        )}
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
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-mist">
        <input required type="checkbox" name="consent" className="mt-0.5" />
        <span>
          I agree that NextGen may store my details and contact me about this quote and related service reminders, as
          set out in our <a href="/terms" className="underline">terms</a> (POPIA).
        </span>
      </label>
      <button className="btn btn-quote" type="submit" disabled={status === "sending"}>
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
