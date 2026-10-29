import { supabase } from "./ngms-public-supabase";
import {
  FALLBACK_GALLERY_PHOTOS,
  FALLBACK_HERO_SLIDES,
  FALLBACK_SERVICE_IMAGES,
  FALLBACK_SLOT_PHOTOS,
} from "./fallback-images";

export type HeroSlide = {
  image_url: string;
  alt_text: string;
  caption: string | null;
};

export type GalleryPhoto = {
  image_url: string;
  caption: string | null;
  service_slug: string | null;
  is_stock?: boolean;
};

export type BeforeAfter = {
  service_slug: string | null;
  location: string;
  caption: string | null;
  before_image_url: string;
  after_image_url: string;
};

export type Post = {
  title: string;
  slug: string;
  type: string | null;
  excerpt: string | null;
  content: string | null;
};



export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("image_url, alt_text, caption")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return FALLBACK_HERO_SLIDES;
  const usable = (data as HeroSlide[]).filter((slide) => Boolean(slide.image_url));
  return usable.length ? usable : FALLBACK_HERO_SLIDES;
}

export async function getGalleryPhotos(limit = 24): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("image_url, caption, service_slug")
    .eq("is_active", true)
    // Images assigned to a fixed page slot belong only to that slot.
    // Keep them out of the general project/gallery feed to prevent cross-placement.
    .is("slot", null)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error || !data) return FALLBACK_GALLERY_PHOTOS.slice(0, limit);
  const usable = (data as GalleryPhoto[]).filter((photo) => Boolean(photo.image_url));
  return usable.length ? usable : FALLBACK_GALLERY_PHOTOS.slice(0, limit);
}

// Photos pinned to fixed homepage positions in Admin → Media → Homepage photos.
// This function intentionally returns only explicitly assigned slots. It must not
// select or substitute photos from the general gallery, jobs, or hero slideshow.
// Photos pinned to fixed, named page positions in Admin → Media → Homepage photos.
// This returns only explicitly assigned active slots. Never substitute photos from
// the general gallery, job uploads, or the landing-page hero slideshow.
export async function getSlotPhotos(slots: string[]): Promise<Record<string, GalleryPhoto>> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("image_url, caption, service_slug, slot")
    .eq("is_active", true)
    .in("slot", slots);
  const map: Record<string, GalleryPhoto> = {};
  if (!error && data) {
    for (const row of data as (GalleryPhoto & { slot: string })[]) {
      if (row.image_url) map[row.slot] = { ...row, is_stock: false };
    }
  }
  for (const slot of slots) {
    if (!map[slot] && FALLBACK_SLOT_PHOTOS[slot]) map[slot] = FALLBACK_SLOT_PHOTOS[slot];
  }
  return map;
}

export async function getBeforeAfter(): Promise<BeforeAfter[]> {
  const { data, error } = await supabase
    .from("before_after_photos")
    .select("service_slug, location, caption, before_image_url, after_image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as BeforeAfter[];
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, type, excerpt, content")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Post[];
}

export async function getPost(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, type, excerpt, content")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Post;
}

// Service card photos, set per service in Admin → Media → Service images.
// Returns { slug: imageUrl } for every service that has one.
export async function getServiceImages(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("services")
    .select("slug, hero_image")
    .not("hero_image", "is", null);
  const map: Record<string, string> = { ...FALLBACK_SERVICE_IMAGES };
  if (error || !data) return map;
  for (const row of data as { slug: string; hero_image: string | null }[]) {
    if (row.hero_image) map[row.slug] = row.hero_image;
  }
  return map;
}
