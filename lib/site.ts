// lib/site.ts — central business details for NGSMS

export const site = {
  name: "NextGen Solar Clean & Maintenance Solutions",
  shortName: "NGSMS",
  domain: "nextgensolarmaintenance.co.za",
  url: "https://www.nextgensolarmaintenance.co.za",
  phone: "+27631387945",
  phoneDisplay: "063 138 7945",
  whatsapp: "27631387945",
  email: "info.nextgensolution1@gmail.com",
  region: "Helderberg Basin, Western Cape",
  serviceAreas: [
    "Strand",
    "Gordon's Bay",
    "Somerset West",
    "Kleinmond",
    "Grabouw",
    "Elgin",
    "Bot River",
    "Overberg",
    "Stellenbosch",
    "Paarl",
    "Worcester",
    "Cape Town",
  ],
};

export function whatsappLink(
  message = "Hi NextGen, I'd like a quote please."
): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Aliases so common import names all work
export const SITE = site;
export const siteConfig = site;
export const WHATSAPP_URL = whatsappLink();
export const waLink = whatsappLink;
export default site;
