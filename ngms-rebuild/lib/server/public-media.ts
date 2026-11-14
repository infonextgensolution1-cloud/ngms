import "server-only";
import { rows } from "@/lib/server/db";

export type PublishedMedia = {
  id: string;
  original_name: string;
  category: string;
  alt_text: string;
  url: string;
};

export async function getPublishedMedia(): Promise<PublishedMedia[]> {
  try {
    const items = await rows(
      "SELECT id,original_name,category,alt_text FROM media_assets WHERE is_published=1 AND content_type LIKE 'image/%' ORDER BY created_at DESC LIMIT 120",
    );
    return items.map(item => ({
      id:String(item.id),
      original_name:String(item.original_name),
      category:String(item.category),
      alt_text:String(item.alt_text || item.original_name),
      url:"/api/media/"+encodeURIComponent(String(item.id)),
    }));
  } catch {
    return [];
  }
}
