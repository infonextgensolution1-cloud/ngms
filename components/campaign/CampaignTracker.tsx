'use client'

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export default function CampaignTracker({ campaign }: { campaign: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || "direct";
    const medium = params.get("utm_medium") || "none";
    const campaignParam = params.get("utm_campaign") || campaign;
    const content = params.get("utm_content") || "";

    track("campaign_landing_view", {
      campaign,
      source,
      medium,
      campaign_name: campaignParam,
      content,
    });

    const handleClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement)?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.includes("wa.me")) {
        track("campaign_whatsapp_click", { campaign, source, medium });
      } else if (href.startsWith("/quote")) {
        track("campaign_quote_click", { campaign, source, medium });
      } else if (href.startsWith("tel:")) {
        track("campaign_call_click", { campaign, source, medium });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [campaign]);

  return null;
}
