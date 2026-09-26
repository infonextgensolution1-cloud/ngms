import { waLink } from "@/lib/site";

export default function WhatsAppQuoteCTA() {
  return (
    <div className="card !bg-wa/10 !border-wa/40 max-w-[520px] mx-auto text-center">
      <p className="tag !text-wa">Fastest way to get a price</p>
      <h3 className="text-xl mt-1">Send us a photo on WhatsApp</h3>
      <p className="text-mist text-sm mt-2">
        Snap a photo of the panels, wall, leak or job — whatever it is — and send it straight through. Most jobs get
        a price back the same day, often within the hour.
      </p>
      <a
        href={waLink("Hi NextGen, I'd like a quote — sending a photo of the job now.")}
        target="_blank"
        rel="noreferrer"
        className="btn btn-wa mt-4 inline-block"
      >
        Send a Photo on WhatsApp
      </a>
    </div>
  );
}
