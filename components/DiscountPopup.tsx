"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ngsms-discount-popup-dismissed";
const SHOW_AFTER_MS = 3500;

// 10% first-booking offer, shown once per visit as a pop-up on the homepage.
// Closes with the X button, "No thanks", a tap outside the card, or Escape.
export default function DiscountPopup() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Show after a short delay, unless already closed during this visit.
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

  // While open: Escape closes, page behind doesn't scroll, focus lands on the close button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-jet/80 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discount-popup-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-orange text-jet shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(-55deg, transparent 0 14px, rgba(255,255,255,0.55) 14px 16px)" }}
        />

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close offer"
          className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-jet text-paper text-lg transition-colors hover:bg-jet/80"
        >
          ✕
        </button>

        <div className="relative px-6 pb-6 pt-10 text-center">
          <p className="font-heading font-bold uppercase tracking-[0.2em] text-xs">First booking</p>
          <p id="discount-popup-title" className="font-heading font-extrabold leading-none text-8xl mt-2">
            10%
            <span className="block text-4xl mt-1">OFF</span>
          </p>
          <p className="mt-3 text-base font-semibold">
            your first booking on all other services
          </p>
          <p className="mt-1 text-sm text-jet/80">
            Painting, waterproofing, paving, plumbing, electrical and more. Use code <strong>NGX10</strong>.
            Excludes solar panel cleaning.
          </p>

          <Link href="/quote" onClick={close} className="btn-quote mt-5 w-full">
            Claim 10% off &rarr; get a free quote
          </Link>
          <button
            type="button"
            onClick={close}
            className="mt-2 inline-flex min-h-11 items-center justify-center text-sm font-semibold underline underline-offset-4 text-jet/80 hover:text-jet"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
