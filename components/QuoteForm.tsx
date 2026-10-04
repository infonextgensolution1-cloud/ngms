"use client";

import { useMemo, useState } from "react";
import { instantEstimate } from "@/lib/instant-estimate";
import { useForecast, jobWeather } from "@/lib/job-weather";
import { tradeConditions } from "@/lib/helderberg";
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
  const [phoneErr, setPhoneErr] = useState("");
  const [fallbackWa, setFallbackWa] = useState("");
  // Only accept a ?service= value that is a real service, otherwise the select and the saved lead disagree.
  const [serviceName, setServiceName] = useState(
    SERVICES.find((s) => [s.name.toLowerCase(), s.slug].includes(initialService?.toLowerCase() ?? ""))?.name ?? SERVICES[0]?.name ?? ""
  );
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
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim() || null;
    if (!isValidPhone(phone)) {
      setPhoneErr("Please enter a valid phone number, e.g. 063 138 7945.");
      (form.elements.namedItem("phone") as HTMLInputElement | null)?.focus();
      return;
    }
    setPhoneErr("");
    setStatus("sending");
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

    const result = await submitLead(
      {
        name,
        phone,
        email,
        suburb,
        service: serviceName,
        service_slug: service?.slug ?? null,
        message,
        photo_url: photoUrl,
      },
      {
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
      }
    );

    const waMsg = [
      `Hi NextGen, quote request from ${name}.`,
      `Phone: ${phone}`,
      `Area: ${suburb}`,
      `Service: ${serviceName}`,
      size && `Size/details: ${size}`,
      notes && `Notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    setFallbackWa(waLink(waMsg));
    if (!result.ok) {
      // Neither the database nor the email went through: give the customer a one-tap way to send it themselves.
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="card max-w-[520px] mx-auto text-center">
        <h3 className="text-xl" role="status">Thanks — request received</h3>
        <p className="text-mist mt-2">
          We&rsquo;ll come back to you on your preferred channel, usually the same day (Mon&ndash;Sat). Want to send
          photos now? WhatsApp is quickest.
        </p>
        <a href={fallbackWa || waLink("Hi NextGen, following up on my quote request.")} className="btn-wa mt-4" target="_blank" rel="noopener noreferrer">
          Send photos on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="grid grid-cols-1 gap-3.5 w-full max-w-[520px] mx-auto" onSubmit={onSubmit}>
      <p className="rounded-panel border border-blue/30 bg-blue/10 text-paper text-center text-xs sm:text-sm py-2.5 px-3">
        Solar panel cleaning from R550 (up to 10 panels) · 10% off your first booking on all other services
      </p>
      <Field label="Full name">
        <input required name="name" autoComplete="name" maxLength={120} placeholder="Your name" className="field" />
      </Field>
      <Field label="Phone / WhatsApp">
        <input
          required
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          pattern={PHONE_PATTERN}
          maxLength={20}
          placeholder={SITE.phoneDisplay}
          aria-invalid={phoneErr ? true : undefined}
          aria-describedby={phoneErr ? "phone-err" : undefined}
          onChange={() => phoneErr && setPhoneErr("")}
          className="field"
        />
        {phoneErr && (
          <span id="phone-err" role="alert" className="block text-orange text-xs mt-1.5">
            {phoneErr}
          </span>
        )}
      </Field>
      <Field label="Email (optional)">
        <input type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@example.com" className="field" />
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
        <div className="rounded-panel border border-blue/30 bg-blue/10 px-3 py-2.5 text-sm" role="status">
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
                className="rounded-full border border-blue/50 px-3 py-1.5 font-semibold text-paper hover:bg-blue/15"
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
        <textarea name="notes" maxLength={2000} placeholder="What needs doing? Access, timing, anything we should know." className="field min-h-[110px]" />
      </Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-mist">
        <input required type="checkbox" name="consent" className="mt-0.5" />
        <span>
          I agree that NextGen may store my details and contact me about this quote and related service reminders, as
          set out in our <a href="/privacy" className="underline">privacy policy</a> (POPIA).
        </span>
      </label>
      <button className="btn btn-quote" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send quote request"}
      </button>
      {status === "error" && (
        <div role="alert" className="rounded-panel border border-orange/50 bg-orange/10 p-4 text-sm text-center">
          <p className="text-paper font-semibold">We couldn&rsquo;t send that from here.</p>
          <p className="text-mist mt-1">Your details are ready to go — tap below to send them to us on WhatsApp, or call {SITE.phoneDisplay}.</p>
          <a href={fallbackWa || waLink()} target="_blank" rel="noopener noreferrer" className="btn-wa mt-3">
            Send on WhatsApp
          </a>
        </div>
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
