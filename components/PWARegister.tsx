"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/app-sw.js").catch(() => {});
  }, []);

  return null;
}
