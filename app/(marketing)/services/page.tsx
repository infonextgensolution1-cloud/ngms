import type { Metadata } from "next";
import ServiceCard from "@/components/ServiceCard";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description: "12 trade services, one team — solar, painting, waterproofing, paving, plumbing, electrical and more.",
};

export default function ServicesPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">What we do</p>
        <h1 className="text-3xl md:text-5xl">12 trade services, one team</h1>
        <p className="text-mist mt-3">Solar, painting, waterproofing, paving, plumbing, electrical and more.</p>
      </div>
      <div className="wrap py-10">
        <div className="grid sm:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} s={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
