// Public service-image fallbacks keep pages presentable when media storage is unavailable.
// These are generic service illustrations, not project records.

const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const FALLBACK_SERVICE_IMAGES: Record<string, string> = {
  "solar-panel-cleaning": unsplash("photo-1509391366360-2e959784a276"),
  painting: unsplash("photo-1562259949-e8e7689d7828"),
  waterproofing: unsplash("photo-1600585154340-be6161a56a0c"),
  paving: unsplash("photo-1558618666-fcd25c85cd64"),
  plumbing: unsplash("photo-1607472586893-edb57bdc0e39"),
  electrical: unsplash("photo-1621905251189-08b45d6a269e"),
  "pool-fibre-lining": unsplash("photo-1572331165267-854da2b10ccc"),
  "high-pressure-cleaning": unsplash("photo-1523413651479-597eb2da0ad6"),
  "rubble-removal": unsplash("photo-1504307651254-35680f356dfd"),
  "steelwork-welding": unsplash("photo-1504917595217-d4dc5ebe6122"),
  handyman: unsplash("photo-1621905251918-48416bd8575a"),
  "subcontractor-work": unsplash("photo-1504307651254-35680f356dfd"),
};

export type StockGalleryPhoto = {
  image_url: string;
  caption: string;
  service_slug: string;
  is_stock: true;
};

export const FALLBACK_HERO_SLIDES = [
  {
    image_url: unsplash("photo-1509391366360-2e959784a276"),
    alt_text: "Solar panels in sunlight",
    caption: "Solar panel cleaning",
  },
  {
    image_url: unsplash("photo-1600585154340-be6161a56a0c"),
    alt_text: "Residential property exterior",
    caption: "Property maintenance",
  },
  {
    image_url: unsplash("photo-1504307651254-35680f356dfd"),
    alt_text: "Construction and repair work",
    caption: "Maintenance and repairs",
  },
];

export const FALLBACK_SLOT_PHOTOS: Record<string, StockGalleryPhoto> = {
  hero_solar: {
    image_url: FALLBACK_SERVICE_IMAGES["solar-panel-cleaning"],
    caption: "Service imagery",
    service_slug: "solar-panel-cleaning",
    is_stock: true,
  },
  hero_feature: {
    image_url: FALLBACK_SERVICE_IMAGES["waterproofing"],
    caption: "Service imagery",
    service_slug: "waterproofing",
    is_stock: true,
  },
  mission_left: {
    image_url: FALLBACK_SERVICE_IMAGES.painting,
    caption: "Service imagery",
    service_slug: "painting",
    is_stock: true,
  },
  mission_right: {
    image_url: FALLBACK_SERVICE_IMAGES.handyman,
    caption: "Service imagery",
    service_slug: "handyman",
    is_stock: true,
  },
  solar_service_feature: {
    image_url: FALLBACK_SERVICE_IMAGES["solar-panel-cleaning"],
    caption: "Service imagery",
    service_slug: "solar-panel-cleaning",
    is_stock: true,
  },
  maintenance_high_pressure: {
    image_url: FALLBACK_SERVICE_IMAGES["high-pressure-cleaning"],
    caption: "Service imagery",
    service_slug: "high-pressure-cleaning",
    is_stock: true,
  },
  maintenance_painting: {
    image_url: FALLBACK_SERVICE_IMAGES.painting,
    caption: "Service imagery",
    service_slug: "painting",
    is_stock: true,
  },
  maintenance_paving: {
    image_url: FALLBACK_SERVICE_IMAGES.paving,
    caption: "Service imagery",
    service_slug: "paving",
    is_stock: true,
  },
  body_corporate_hero: {
    image_url: FALLBACK_SERVICE_IMAGES.waterproofing,
    caption: "Service imagery",
    service_slug: "waterproofing",
    is_stock: true,
  },
  body_corporate_cleaning: {
    image_url: FALLBACK_SERVICE_IMAGES["high-pressure-cleaning"],
    caption: "Service imagery",
    service_slug: "high-pressure-cleaning",
    is_stock: true,
  },
  body_corporate_painting: {
    image_url: FALLBACK_SERVICE_IMAGES.painting,
    caption: "Service imagery",
    service_slug: "painting",
    is_stock: true,
  },
  body_corporate_paving: {
    image_url: FALLBACK_SERVICE_IMAGES.paving,
    caption: "Service imagery",
    service_slug: "paving",
    is_stock: true,
  },
};

const galleryServices = [
  "solar-panel-cleaning",
  "painting",
  "waterproofing",
  "paving",
  "plumbing",
  "high-pressure-cleaning",
] as const;

export const FALLBACK_GALLERY_PHOTOS: StockGalleryPhoto[] = galleryServices.map((slug) => ({
  image_url: FALLBACK_SERVICE_IMAGES[slug],
  caption: "Service imagery",
  service_slug: slug,
  is_stock: true,
}));
