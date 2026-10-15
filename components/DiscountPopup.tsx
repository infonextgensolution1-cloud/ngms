"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ngsms-discount-popup-dismissed";
const SHOW_AFTER_MS = 12000;

// 10% first-booking offer. A small, non-blocking card in the bottom-left corner
// (the WhatsApp button owns the bottom-right), shown once per visit after the
// visitor has had time to read the page. It never locks scrolling or covers content.
export default function DiscountPopup() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // storage blocked: just show it
    }
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore: it still closes for this page view
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <aside
      role="complementary"
      aria-labelledby="discount-popup-title"
      className="fixed z-[60] left-3 right-20 sm:right-auto sm:left-5 sm:w-[340px] panel p-4 pr-12 animate-fade-up"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Close offer"
        className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-btn text-mist hover:text-paper hover:bg-white/5"
      >
        ✕
      </button>
      <p className="text-[11px] uppercase tracking-[0.18em] text-blue font-semibold">First booking</p>
      <p id="discount-popup-title" className="font-heading font-semibold text-paper text-lg leading-snug mt-1">
        10% off your first booking
      </p>
      <p className="text-mist text-sm mt-1">
        Painting, waterproofing, paving, plumbing, electrical and more. Code <strong className="text-paper">NGX10</strong>.
        Excludes solar panel cleaning.
      </p>
      <Link href="/quote" onClick={close} className="btn-quote mt-3 !py-2.5 !text-xs">
        Claim it with a free quote
      </Link>
    </aside>
  );
}
