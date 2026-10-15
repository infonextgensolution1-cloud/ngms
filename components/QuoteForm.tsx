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
  const [step, setStep] = useState(1);
  const [phoneErr, setPhoneErr] = useState("");
  const [fallbackWa, setFallbackWa] = useState("");
  // Only accept a ?service= value that is a real service, otherwise the select and the saved lead disagree.
  const [serviceName, setServiceName] = useState(
    SERVICES.find((s) => [s.name.toLowerCase(), s.slug].includes(initialService?.toLowerCase() ?? ""))?.name ?? SERVICES[0]?.name ?? ""
  );
  const [sizeText, setSizeText] = useState(initialSize ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [photoUploadState, setPhotoUploadState] = useState<"idle" | "uploading" | "uploaded" | "failed">("idle");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [preferredContact, setPreferredContact] = useState("WhatsApp");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [area, setArea] = useState(matchArea(initialArea) ?? "");
  const [propertyType, setPropertyType] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{ width: number; height: number; size: number } | null>(null);
  const [prefDate, setPrefDate] = useState("");
  const [notes, setNotes] = useState("");
  const days = useForecast();

  const svc = SERVICES.find((x) => x.name === serviceName);
  const estimate = useMemo(() => instantEstimate(svc?.slug, sizeText), [svc?.slug, sizeText]);
  const leadScore = useMemo(() => Math.min(100, 25 + (serviceName ? 15 : 0) + (sizeText.trim() ? 20 : 0) + (photo ? 20 : 0) + (prefDate ? 10 : 0) + (notes.trim().length >= 30 ? 10 : 0)), [serviceName, sizeText, photo, prefDate, notes]);
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
    // Disable browser-wide native validation: hidden wizard steps must not block submission.
    if (step < 5) {
      const fields = Array.from(form.querySelectorAll(`[data-quote-step="${step}"] input, [data-quote-step="${step}"] select, [data-quote-step="${step}"] textarea`));
      const invalid = fields.find((field) => field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement ? !field.checkValidity() : false);
      if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement || invalid instanceof HTMLTextAreaElement) { invalid.reportValidity(); invalid.focus(); return; }
      setStep((current) => Math.min(5, current + 1));
      return;
    }
    if (!area) { setStep(2); return; }
    const consentInput = form.querySelector<HTMLInputElement>('input[name="consent"]');
    const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
    if (!contactName.trim() || !isValidPhone(contactPhone) || !consentInput?.checked || (emailInput?.value && !emailInput.checkValidity())) {
      setStep(4);
      if (!isValidPhone(contactPhone)) setPhoneErr("Please enter a valid phone number, e.g. 063 138 7945.");
      return;
    }
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

    // Do not silently drop a selected photo. Preserve the form if upload fails,
    // allowing the customer to retry or remove the optional attachment.
    let uploadedPhotoUrl = photoUrl;
    if (photo && !uploadedPhotoUrl) {
      setPhotoUploadState("uploading");
      try {
        const blob = await compressImage(photo);
        const fd = new FormData();
        fd.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const r = await fetch("/api/quote-photo", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.url) throw new Error(j?.error || "Upload failed");
        uploadedPhotoUrl = j.url;
        setPhotoUrl(j.url);
        setPhotoUploadState("uploaded");
        setPhotoErr("");
      } catch {
        setPhotoUploadState("failed");
        setPhotoErr("We couldn’t upload this photo. Retry the upload, or remove the photo and submit without it.");
        setStatus("idle");
        setStep(3);
        return;
      }
    }

    const message = [
      propertyType && `Property type: ${propertyType}`,
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
        photo_url: uploadedPhotoUrl,
      },
      {
        name,
        phone,
        email,
        suburb,
        service: serviceName,
        propertyType: propertyType || undefined,
        sizeDetails: size,
        preferredContact: pref,
        preferredDate: prefDate || undefined,
        estimate: estimate ?? undefined,
        photoUrl: uploadedPhotoUrl ?? undefined,
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
    <form data-quote-step={step} noValidate className="grid grid-cols-1 gap-3.5 w-full max-w-[520px] mx-auto" onSubmit={onSubmit}>
      <div className="rounded-panel border border-darkgrey bg-cardgrey/60 p-3" aria-label="Quote progress">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-mist"><span>Step {step} of 5</span><span className="text-paper">{["Job","Property","Photos","Contact","Review"][step - 1]}</span></div>
        <ol className="mt-2 grid grid-cols-5 gap-1" aria-label="Quote steps">
          {["Job","Property","Photos","Contact","Review"].map((label, i) => <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={`h-1.5 rounded-full ${i < step ? "bg-orange" : "bg-darkgrey"}`}><span className="sr-only">{label}</span></li>)}
        </ol>
        <p className="text-xs text-mist mt-2">Your details stay in the form as you move between steps. Photo upload is optional.</p>
      </div>
      <p className="rounded-panel border border-blue/30 bg-blue/10 text-paper text-center text-xs sm:text-sm py-2.5 px-3">
        Solar panel cleaning from R550 (up to 10 panels) · 10% off your first booking on all other services
      </p>
      <Field step={4} label="Full name">
        <input required={step === 4} name="name" value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" maxLength={120} placeholder="Your name" className="field" />
      </Field>
      <Field step={4} label="Phone / WhatsApp">
        <input
          required={step === 4}
          type="tel"
          name="phone"
          value={contactPhone}
          onChange={(e) => { setContactPhone(e.target.value); if (phoneErr) setPhoneErr(""); }}
          inputMode="tel"
          autoComplete="tel"
          pattern={PHONE_PATTERN}
          maxLength={20}
          placeholder={SITE.phoneDisplay}
          aria-invalid={phoneErr ? true : undefined}
          aria-describedby={phoneErr ? "phone-err" : undefined}
          className="field"
        />
        {phoneErr && (
          <span id="phone-err" role="alert" className="block text-orange text-xs mt-1.5">
            {phoneErr}
          </span>
        )}
      </Field>
      <Field step={4} label="Email (optional)">
        <input type="email" name="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" className="field" />
      </Field>
      <Field step={2} label="Area">
        <select required={step === 2} name="area" value={area} onChange={(e) => setArea(e.target.value)} className="field">
          <option value="" disabled>Choose your area</option>
          {AREA_OPTIONS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Field>
      <Field step={1} label="Service">
        <select name="service" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="field">
          {SERVICES.map((s) => (
            <option key={s.slug}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field step={1} label="Size / details">
        <input name="size" value={sizeText} onChange={(e) => setSizeText(e.target.value)} placeholder="e.g. 20 panels, 60 m²" className="field" />
      </Field>
      {estimate && (
        <div className="rounded-panel border border-blue/30 bg-blue/10 px-3 py-2.5 text-sm" role="status">
          <strong>Instant guide:</strong> {estimate}
          <span className="block text-mist text-xs mt-1">A guide only. Your firm quote follows once we&rsquo;ve seen the job.</span>
        </div>
      )}
      <Field step={3} label="Add a photo of the job (optional, but speeds up your quote)">
        <span className="block text-mist text-xs mb-1.5">
          A clear photo or two lets us give a firm price without a site visit first. Stand back so the whole area
          (roof, wall, paving, pool) is in the shot. Photos are private; only our team sees them (
          <a href="/privacy" className="text-blue hover:underline">privacy</a>).
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (photoPreview) URL.revokeObjectURL(photoPreview);
            setPhotoUrl(null);
            setPhotoUploadState("idle");
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
        {photo && !photoErr && <span className="block text-xs text-mist mt-1.5" role="status">Photo selected: {photo.name} · {(photo.size / (1024 * 1024)).toFixed(1)} MB</span>}
        {photoUploadState === "uploading" && <div className="mt-2" role="status" aria-live="polite"><span className="block text-xs text-paper mb-1">Preparing and uploading photo…</span><div className="h-1.5 rounded-full bg-darkgrey overflow-hidden"><div className="h-full w-2/3 bg-orange animate-pulse rounded-full" /></div></div>}
        {photoUploadState === "uploaded" && <span className="block text-xs text-paper mt-1.5" role="status">Photo uploaded securely and ready to attach.</span>}
        {photoErr && <span role="alert" className="block text-orange text-xs mt-1.5">{photoErr}</span>}
        {photoUploadState === "failed" && photo && <div className="flex flex-wrap gap-2 mt-2"><button type="button" className="btn-outline" onClick={() => { setPhotoErr(""); setPhotoUploadState("idle"); setStatus("idle"); setStep(5); }}>Retry upload on submit</button><button type="button" className="btn-outline" onClick={() => { setPhoto(null); setPhotoUrl(null); setPhotoUploadState("idle"); setPhotoErr(""); }}>Remove photo and continue</button></div>}
      </Field>
      <Field step={2} label="Property type (optional)">
        <select name="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="field">
          <option value="">Select property type (optional)</option>
          <option>House / residential</option>
          <option>Body corporate / complex</option>
          <option>Commercial property</option>
          <option>Other</option>
        </select>
      </Field>
      <Field step={2} label="Preferred date (optional)">
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
      <Field step={4} label="Preferred contact">
        <select name="pref" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)} className="field">
          <option>WhatsApp</option>
          <option>Phone call</option>
          <option>Email</option>
        </select>
      </Field>
      <Field step={3} label="Notes">
        <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="What needs doing? Access, timing, anything we should know." className="field min-h-[110px]" />
      </Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label data-quote-step={4} className="flex items-start gap-2 text-xs text-mist">
        <input required={step === 4} type="checkbox" name="consent" className="mt-0.5" />
        <span>
          I agree that NextGen may store my details and contact me about this quote and related service reminders, as
          set out in our <a href="/privacy" className="underline">privacy policy</a> (POPIA).
        </span>
      </label>
      {step === 5 && <div data-quote-step={5} className="rounded-panel border border-darkgrey bg-cardgrey/60 p-4">
        <h3 className="font-semibold text-paper">Review your request</h3>
        <p className="text-xs text-mist mt-1 mb-3">Check your details before sending. Go back to make changes.</p>
        <dl className="grid gap-2 text-sm">
          <div><dt className="text-mist text-xs">Contact name</dt><dd className="text-paper">{contactName || "Not provided"}</dd></div>
          <div><dt className="text-mist text-xs">Phone / WhatsApp</dt><dd className="text-paper">{contactPhone || "Not provided"}</dd></div>
          <div><dt className="text-mist text-xs">Email</dt><dd className="text-paper">{contactEmail || "Not provided"}</dd></div>
          <div><dt className="text-mist text-xs">Service</dt><dd className="text-paper">{serviceName || "Not selected"}</dd></div>
          <div><dt className="text-mist text-xs">Property area</dt><dd className="text-paper">{area || "Not selected"}</dd></div>
          <div><dt className="text-mist text-xs">Property type</dt><dd className="text-paper">{propertyType || "Not provided"}</dd></div>
          <div><dt className="text-mist text-xs">Size / details</dt><dd className="text-paper">{sizeText || "Not provided"}</dd></div>
          <div><dt className="text-mist text-xs">Photo</dt><dd className="text-paper">{photo ? (photoUrl ? "Uploaded and attached" : "Selected; upload pending") : "No photo attached"}</dd></div>
          <div><dt className="text-mist text-xs">Preferred date</dt><dd className="text-paper">{prefDate || "Flexible"}</dd></div>
          <div><dt className="text-mist text-xs">Preferred contact</dt><dd className="text-paper">{preferredContact}</dd></div>
          <div><dt className="text-mist text-xs">Notes</dt><dd className="text-paper whitespace-pre-wrap">{notes || "No additional notes"}</dd></div>
        </dl>
        <p className="text-xs text-mist mt-3">Your details are handled according to our <a href="/privacy" className="underline">privacy policy</a>. We’ll confirm whether your request was received.</p>
      </div>}
      {step === 5 && <button data-quote-submit className="btn btn-quote" type="submit" disabled={status === "sending" || photoUploadState === "uploading"}>
        {status === "sending" ? "Sending..." : "Confirm and send request"}
      </button>}
      {step < 5 && <div className="flex gap-2 pt-1" data-quote-navigation>
        {step > 1 && <button type="button" className="btn-outline flex-1" onClick={() => setStep((s) => s - 1)}>Back</button>}
        <button type="button" className="btn-quote flex-1" onClick={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          const fields = Array.from(form.querySelectorAll(`[data-quote-step="${step}"] input, [data-quote-step="${step}"] select, [data-quote-step="${step}"] textarea`));
          const invalid = fields.find((field) => field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement ? !field.checkValidity() : false);
          if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement || invalid instanceof HTMLTextAreaElement) { invalid.reportValidity(); invalid.focus(); return; }
          setStep((s) => Math.min(5, s + 1));
        }}>Continue</button>
      </div>}
      {step === 5 && <button type="button" className="btn-outline w-full" onClick={() => setStep(4)}>Back to contact details</button>}
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

function Field({ label, children, step }: { label: string; children: React.ReactNode; step?: number }) {
  return (
    <label data-quote-step={step}>
      <span className="block text-mist text-sm font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
