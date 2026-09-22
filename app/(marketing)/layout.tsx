import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import SeasonalBanner from "@/components/SeasonalBanner";
import { SITE } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-oswald", display: "swap" });

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

// This layout only wraps routes inside app/(marketing)/ — the folder name in
// parentheses is a Next.js "route group": it groups pages under one layout
// without adding anything to the URL. It does NOT touch app/layout.tsx (the
// true root layout), so anything outside this group — including /admin — is
// completely unaffected by the header, footer, fonts and WhatsApp button below.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${oswald.variable} font-sans bg-jet text-paper min-h-screen flex flex-col`}>
      <Header />
      <SeasonalBanner />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
