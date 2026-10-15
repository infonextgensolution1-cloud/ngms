import type { Service } from "@/lib/services";

export type CampaignSlug = "painting" | "solar" | "waterproofing" | "paving" | "plumbing";

export type CampaignConfig = {
  slug: CampaignSlug;
  serviceSlug: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  proof: string[];
  painPoints: string[];
  outcomes: string[];
  process: string[];
  audience: string[];
  offer?: {
    label: string;
    detail: string;
  };
};

export const campaignConfigs: Record<CampaignSlug, CampaignConfig> = {
  painting: {
    slug: "painting",
    serviceSlug: "painting",
    eyebrow: "Helderberg painting service",
    headline: "Interior & exterior painting, done properly.",
    subheadline:
      "Proper preparation, quality paint systems and weather-aware scheduling for homes, complexes and commercial units across Strand, Gordon’s Bay and Somerset West.",
    primaryCta: "Get a painting quote",
    secondaryCta: "WhatsApp photos",
    proof: ["Surface preparation first", "Interior & exterior work", "Weather-aware scheduling"],
    painPoints: ["Peeling or tired exterior paint", "Cracks, marks and uneven finishes", "A job that needs proper preparation before paint goes on"],
    outcomes: ["Cleaner, more even finishes", "A paint system suited to the surface and exposure", "One accountable point of contact"],
    process: ["Send photos or request a site assessment", "Confirm the scope and written quote", "Prepare, paint and keep the site tidy", "Walk through the completed work"],
    audience: ["Homeowners", "Body corporates", "Security complexes", "Light commercial"],
    offer: { label: "First booking offer", detail: "10% off eligible first bookings with code NGX10. Solar is excluded." },
  },
  solar: {
    slug: "solar",
    serviceSlug: "solar-panel-cleaning",
    eyebrow: "Flagship solar service",
    headline: "Keep every panel earning its keep.",
    subheadline:
      "Professional solar panel cleaning across the Helderberg Basin using gentle, non-abrasive methods, with visual checks and before-and-after photos.",
    primaryCta: "Get a solar quote",
    secondaryCta: "WhatsApp panel photos",
    proof: ["Soft-wash cleaning", "No abrasive pads or harsh chemicals", "Before-and-after photos"],
    painPoints: ["Dust and pollen build-up", "Salt air and coastal soiling", "Bird droppings and surface grime"],
    outcomes: ["Cleaner panel surfaces", "A visual check while we clean", "A recommended cleaning frequency for your property"],
    process: ["Send panel count and a roof photo", "Confirm the fixed price", "Clean with the appropriate method", "Receive before-and-after photos"],
    audience: ["Homeowners", "Body corporates", "Security complexes"],
  },
  waterproofing: {
    slug: "waterproofing",
    serviceSlug: "waterproofing",
    eyebrow: "Roof & building protection",
    headline: "Stop leaks before they start.",
    subheadline:
      "Roof, flat roof, balcony, wall and parapet waterproofing with leak diagnosis and a system selected for the surface and exposure.",
    primaryCta: "Get a waterproofing quote",
    secondaryCta: "WhatsApp leak photos",
    proof: ["Leak diagnosis", "Roof, balcony, wall & parapet systems", "Written guarantee confirmed on quote"],
    painPoints: ["Recurring leaks", "Ceiling stains and damp patches", "Cracked or ageing waterproofing systems"],
    outcomes: ["The actual entry point investigated", "A system matched to the surface", "A written scope before work starts"],
    process: ["Send photos of the leak or damage", "Assess the surface and likely entry point", "Quote the correct system", "Complete and document the work"],
    audience: ["Homeowners", "Body corporates", "Security complexes", "Light commercial"],
    offer: { label: "First booking offer", detail: "10% off eligible first bookings with code NGX10. Solar is excluded." },
  },
  paving: {
    slug: "paving",
    serviceSlug: "paving",
    eyebrow: "Driveways, patios & walkways",
    headline: "Paving built on the right base.",
    subheadline:
      "New paving, repairs and re-levelling with attention to base preparation, compaction and drainage falls across the Helderberg Basin.",
    primaryCta: "Get a paving quote",
    secondaryCta: "WhatsApp paving photos",
    proof: ["Base preparation", "Correct drainage falls", "New installs & repairs"],
    painPoints: ["Sunken or shifted paving", "Pooling water", "Cracked or uneven driveways and patios"],
    outcomes: ["A properly prepared base", "Neater levels and falls", "A surface planned for the actual site"],
    process: ["Send measurements and photos", "Assess the ground and existing surface", "Confirm the written scope", "Install, repair or re-level"],
    audience: ["Homeowners", "Body corporates", "Security complexes", "Light commercial"],
    offer: { label: "First booking offer", detail: "10% off eligible first bookings with code NGX10. Solar is excluded." },
  },
  plumbing: {
    slug: "plumbing",
    serviceSlug: "plumbing",
    eyebrow: "Local Helderberg plumbing",
    headline: "Leaks, geysers, installations and repairs.",
    subheadline:
      "Reliable plumbing for homes, body corporates and complexes, from everyday leaks and blocked drains to geyser repairs and installations.",
    primaryCta: "Get a plumbing quote",
    secondaryCta: "WhatsApp the problem",
    proof: ["Leak detection & repairs", "Geyser repairs & installations", "Complex & body corporate maintenance"],
    painPoints: ["Leaks and dripping fixtures", "Burst or faulty geysers", "Blocked drains and recurring plumbing issues"],
    outcomes: ["The cause investigated", "A clear scope before work", "One point of contact for related maintenance"],
    process: ["WhatsApp the problem or call", "Confirm urgency and scope", "Complete the repair or installation", "Walk through the result"],
    audience: ["Homeowners", "Body corporates", "Security complexes", "Light commercial"],
    offer: { label: "First booking offer", detail: "10% off eligible first bookings with code NGX10. Solar is excluded." },
  },
};

export function getCampaignConfig(slug: string) {
  return campaignConfigs[slug as CampaignSlug];
}

export function getCampaignService(slug: CampaignSlug, services: Service[]) {
  const config = campaignConfigs[slug];
  return services.find((service) => service.slug === config.serviceSlug);
}

export function campaignPathForService(serviceSlug?: string | null) {
  const match = Object.values(campaignConfigs).find((campaign) => campaign.serviceSlug === serviceSlug);
  return match ? `/campaign/${match.slug}` : "/";
}
