export type Suburb = {
  slug: string;
  name: string;
  region: "Helderberg Basin" | "Overberg";
  blurb: string;
  calloutNote: string;
};

// Helderberg Basin = free callout. Overberg = standard R350 out-of-basin callout (per SITE.outOfBasinFee).
export const SUBURBS: Suburb[] = [
  {
    slug: "strand",
    name: "Strand",
    region: "Helderberg Basin",
    blurb:
      "Strand's sea air is hard on painted surfaces, solar panels and exposed steel — salt residue builds up faster here than further inland, so regular maintenance keeps ahead of it instead of playing catch-up.",
    calloutNote: "Free callout — Strand is inside our home base.",
  },
  {
    slug: "gordons-bay",
    name: "Gordon's Bay",
    region: "Helderberg Basin",
    blurb:
      "Gordon's Bay's steep stands and sea-facing homes mean a lot of our work here is height-access — roofs, gables and solar arrays that need a crew comfortable working on a slope.",
    calloutNote: "Free callout — Gordon's Bay is inside our home base.",
  },
  {
    slug: "somerset-west",
    name: "Somerset West",
    region: "Helderberg Basin",
    blurb:
      "From freestanding family homes to security complexes and body corporates, Somerset West is where most of our body-corporate and estate maintenance contracts sit.",
    calloutNote: "Free callout — Somerset West is inside our home base.",
  },
  {
    slug: "kleinmond",
    name: "Kleinmond",
    region: "Overberg",
    blurb:
      "We cover Kleinmond on our regular Overberg run — same crew, same pricing and same workmanship guarantee as in the Helderberg Basin.",
    calloutNote: "R350 out-of-basin callout applies (Overberg run).",
  },
  {
    slug: "grabouw",
    name: "Grabouw",
    region: "Overberg",
    blurb:
      "Grabouw and the surrounding farms and estates call on us for everything from steelwork to waterproofing — we schedule the Overberg run to fit alongside Helderberg jobs.",
    calloutNote: "R350 out-of-basin callout applies (Overberg run).",
  },
  {
    slug: "elgin",
    name: "Elgin",
    region: "Overberg",
    blurb:
      "Elgin's wine and apple farms are part of our regular Overberg route, with the same multi-trade team that works the Helderberg Basin.",
    calloutNote: "R350 out-of-basin callout applies (Overberg run).",
  },
  {
    slug: "bot-river",
    name: "Bot River",
    region: "Overberg",
    blurb:
      "Bot River is on our Overberg run — the same trusted team, pricing and workmanship guarantee as clients in Strand or Somerset West.",
    calloutNote: "R350 out-of-basin callout applies (Overberg run).",
  },
];

export function getSuburb(slug: string) {
  return SUBURBS.find((s) => s.slug === slug);
}
