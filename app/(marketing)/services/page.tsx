import type { Metadata } from "next";
import ServiceCard from "@/components/ServiceCard";
import { SERVICES } from "@/lib/services";
import { getServiceImages } from "@/lib/queries";

// Re-check Supabase for new service photos at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Services",
  description: "12 trade services, one team — solar, painting, waterproofing, paving, plumbing, electrical and more.",
};

const PRICING: Record<string, string> = {
  "solar-panel-cleaning": "From R550",
  painting: "From R75/m²",
  waterproofing: "From R180/m²",
  paving: "From R280/m²",
  plumbing: "From R850",
  electrical: "From R950",
  "pool-fibre-lining": "From R450/m²",
  "high-pressure-cleaning": "From R25/m²",
  "rubble-removal": "From R1 800/load",
  "steelwork-welding": "From R650/hour",
  handyman: "From R380/hour",
  "subcontractor-work": "Custom quote",
};

// Fallback photos, used only when a service has no image set in
// Admin → Media → Service images.
const FALLBACK_IMAGES: Record<string, string> = {
  "solar-panel-cleaning":
    "https://dfwwpqtsbaytfqptancj.supabase.co/storage/v1/object/public/gallery-photos/1788906733722-ig0pgfcjwv.jpg",
};

export default async function ServicesPage() {
  const dbImages = await getServiceImages();
  const images = { ...FALLBACK_IMAGES, ...dbImages };
  return (
    <section>
      <div className="bg-graphite border-b border-darkgrey py-16 px-4 text-center">
        <p className="text-orange text-xs tracking-[0.2em] uppercase font-bold mb-3 font-heading">What we do</p>
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-paper uppercase">
          12 trade services, one team
        </h1>
        <p className="text-mist mt-3 max-w-xl mx-auto">
          Solar, painting, waterproofing, paving, plumbing, electrical and more — coordinated by one
          Helderberg-based crew.
        </p>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-5">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} s={s} price={PRICING[s.slug]} image={images[s.slug]} />
          ))}
        </div>
      </div>
    </section>
  );
}
