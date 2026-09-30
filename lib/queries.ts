import { supabase } from "./ngms-public-supabase";

export type HeroSlide = {
  image_url: string;
  alt_text: string;
  caption: string | null;
};

export type GalleryPhoto = {
  image_url: string;
  caption: string | null;
  service_slug: string | null;
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

// Fallback content used only if the live Supabase fetch fails
// (e.g. a transient network hiccup) so the page never renders empty.
const FALLBACK_HERO: HeroSlide[] = [
  {
    image_url: "",
    alt_text: "NGSMS completed project",
    caption: "Another Project Successfully Completed",
  },
];

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("image_url, alt_text, caption")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return FALLBACK_HERO;
  return data as HeroSlide[];
}

export async function getGalleryPhotos(limit = 24): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("image_url, caption, service_slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as GalleryPhoto[];
}

// Photos pinned to a fixed homepage spot from Admin → Media (e.g. the two Mission
// section tiles), keyed by slot. Falls back to {} so the caller can use its usual
// auto-picked photo when nothing has been pinned yet.
export async function getSlotPhotos(slots: string[]): Promise<Record<string, GalleryPhoto>> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("image_url, caption, service_slug, slot")
    .eq("is_active", true)
    .in("slot", slots);
  if (error || !data) return {};
  const map: Record<string, GalleryPhoto> = {};
  for (const row of data as (GalleryPhoto & { slot: string })[]) {
    map[row.slot] = row;
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
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as { slug: string; hero_image: string | null }[]) {
    if (row.hero_image) map[row.slug] = row.hero_image;
  }
  return map;
}
