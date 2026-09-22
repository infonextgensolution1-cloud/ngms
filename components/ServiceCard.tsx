import Link from "next/link";
import type { Service } from "@/lib/services";

export default function ServiceCard({
  s,
  price,
  image,
}: {
  s: Service;
  price?: string;
  image?: string;
}) {
  return (
    <Link
      href={`/services/${s.slug}`}
      className="group block bg-cardgrey border border-darkgrey rounded-card overflow-hidden hover:border-orange transition"
    >
      {image && (
        <div className="aspect-[16/10] overflow-hidden bg-graphite">
          <img
            src={image}
            alt={s.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-heading font-bold text-lg text-paper">{s.name}</h3>
        <p className="text-orange text-sm font-semibold mt-1">{s.tagline}</p>
        <p className="text-mist text-sm mt-3 line-clamp-2">{s.description}</p>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-darkgrey">
          {price ? (
            <span className="text-paper font-heading font-bold text-sm">{price}</span>
          ) : (
            <span />
          )}
          <span className="text-blue text-sm font-semibold group-hover:text-orange transition">Learn more →</span>
        </div>
      </div>
    </Link>
  );
}
