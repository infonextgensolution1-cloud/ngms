import type { Metadata } from "next";
import SeasonalBanner from "@/components/SeasonalBanner";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Helderberg`,
    template: `%s | ${SITE.shortName}`,
  },
  description:
    "Solar panel cleaning, painting, waterproofing, paving, plumbing, electrical, pool fibre lining, high-pressure cleaning, rubble removal, steelwork and handyman services in Strand, Gordon's Bay & Somerset West. Free quotes.",
  openGraph: {
    title: `${SITE.name} | Helderberg`,
    description: "One call, all solutions — multi-trade property maintenance across the Helderberg Basin.",
    url: SITE.url,
    siteName: SITE.shortName,
    locale: "en_ZA",
    type: "website",
  },
};

// This layout only wraps routes inside app/(marketing)/ — services, prices, packages.
// The ROOT layout (app/layout.tsx) already renders the real site header, footer and
// floating WhatsApp button for every route, including these. This layout previously
// ALSO rendered its own Header/Footer/WhatsAppFab, which stacked a second, unstyled
// header and footer on top of the real ones on every page in this group. Do not add
// them back here — anything global belongs in the root layout only.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeasonalBanner />
      {children}
    </>
  );
}
