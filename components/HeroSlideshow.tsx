"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroSlide } from "@/lib/queries";

export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const usable = slides.filter((s) => s.image_url);

  useEffect(() => {
    if (usable.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % usable.length), 5000);
    return () => clearInterval(t);
  }, [usable.length]);

  if (usable.length === 0) {
    return (
      <div className="relative min-h-[50vh] bg-card grid place-items-center">
        <p className="font-display uppercase text-mist tracking-widest">NextGen Solar &amp; Maintenance Solutions</p>
      </div>
    );
  }

  const slide = usable[i];

  return (
    <div className="relative min-h-[50vh]">
      {usable.map((s, idx) => (
        <Image
          key={s.image_url}
          src={s.image_url}
          alt={s.alt_text || "Completed NGSMS project"}
          fill
          priority={idx === 0}
          sizes="(max-width: 900px) 100vw, 50vw"
          className={`object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-jet/85 to-transparent" style={{ backgroundImage: "linear-gradient(to top, rgba(5,6,8,.8), transparent 55%)" }} />
      {slide.caption && (
        <p className="absolute bottom-6 left-6 right-6 font-display uppercase text-xl">{slide.caption}</p>
      )}
    </div>
  );
}
