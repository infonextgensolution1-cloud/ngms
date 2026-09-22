import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-graphite border-t border-line text-mist pt-14 pb-6">
      <div className="wrap grid gap-8 md:grid-cols-4 mb-8">
        <div>
          <Image src="/logo.png" alt={SITE.name} width={64} height={56} />
          <p className="mt-3 text-sm leading-relaxed">
            Professional property maintenance across the Helderberg Basin. Quality work, done safely and properly.
          </p>
        </div>
        <div>
          <p className="text-paper font-display uppercase mb-3">Our Services</p>
          <ul className="space-y-1 text-sm">
            <li><Link href="/services/solar-panel-cleaning" className="hover:text-orange">Solar Panel Cleaning</Link></li>
            <li><Link href="/services/painting" className="hover:text-orange">Painting</Link></li>
            <li><Link href="/services/waterproofing" className="hover:text-orange">Waterproofing</Link></li>
            <li><Link href="/services/paving" className="hover:text-orange">Paving</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-paper font-display uppercase mb-3">Quick Links</p>
          <ul className="space-y-1 text-sm">
            <li><Link href="/prices" className="hover:text-orange">Catalog</Link></li>
            <li><Link href="/packages" className="hover:text-orange">Maintenance Packages</Link></li>
            <li><Link href="/faq" className="hover:text-orange">FAQ</Link></li>
            <li><Link href="/about" className="hover:text-orange">About</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-paper font-display uppercase mb-3">Contact Us</p>
          <ul className="space-y-1 text-sm">
            <li><a href={`tel:${SITE.phone}`} className="hover:text-orange">{SITE.phoneDisplay}</a></li>
            <li><a href={`mailto:${SITE.email}`} className="hover:text-orange break-all">{SITE.email}</a></li>
            <li>{SITE.serviceAreas.slice(0, 3).join(" · ")}</li>
            <li>Also serving the Overberg — R350 out-of-basin callout</li>
            <li>Mon – Sat: 07:00 – 18:00</li>
          </ul>
        </div>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-3 border-t border-line pt-4 text-xs">
        <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        <p className="text-mist/70">One Call. All Solutions.</p>
      </div>
    </footer>
  );
}
