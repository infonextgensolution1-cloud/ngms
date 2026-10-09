import Link from "next/link";
import Image from "next/image";
import type { Service } from "@/lib/services";
import NgmsIcon from "@/components/NgmsIcon";

export default function ServiceCard({
  s,
  price,
  image,
  index = 0,
}: {
  s: Service;
  price?: string;
  image?: string;
  index?: number;
}) {
  return (
    <Link
      href={`/services/${s.slug}`}
      className="group block bg-cardgrey border border-darkgrey rounded-card overflow-hidden hover:border-orange transition"
    >
      {image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
          <Image
            src={image}
            alt={s.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            quality={70}
            unoptimized
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <NgmsIcon name={s.slug} index={index} className="h-11 w-11 shrink-0" />
          <h3 className="font-heading font-bold text-lg text-paper">{s.name}</h3>
        </div>
        <p className="text-orange text-sm font-semibold mt-3">{s.tagline}</p>
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
