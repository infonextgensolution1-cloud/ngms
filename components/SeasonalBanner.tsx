"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSeasonalMessage } from "@/lib/seasonal";

const STORAGE_PREFIX = "ngsms-banner-dismissed-";

export default function SeasonalBanner() {
  const [dismissed, setDismissed] = useState(true); // hidden until we check storage, avoids flash
  const msg = getSeasonalMessage();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_PREFIX + msg.key);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, [msg.key]);

  if (dismissed) return null;

  function onDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + msg.key, "1");
    } catch {
      // ignore — dismiss still works for this page view
    }
  }

  return (
    <div className="bg-blue text-white text-sm">
      <div className="wrap flex items-center justify-between gap-3 py-2.5">
        <p className="flex-1">
          {msg.text}{" "}
          <Link href={msg.ctaHref} className="inline-block py-2 -my-2 underline font-semibold whitespace-nowrap">
            {msg.ctaLabel} →
          </Link>
        </p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 w-11 h-11 -my-2 -mr-3 grid place-items-center rounded hover:bg-white/15 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
