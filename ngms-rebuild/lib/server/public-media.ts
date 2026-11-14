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


export type PublishedProject = {
  id: string;
  title: string;
  service: string;
  location: string;
  description: string;
  completed_at: string | null;
  before: PublishedMedia[];
  after: PublishedMedia[];
  general: PublishedMedia[];
};

export async function getPublishedProjects(): Promise<PublishedProject[]> {
  try {
    const projects = await rows(
      "SELECT id,title,service,location,description,completed_at FROM projects WHERE status='Published' ORDER BY completed_at DESC,created_at DESC LIMIT 60",
    );
    const output: PublishedProject[] = [];
    for (const project of projects) {
      const photos = await rows(
        "SELECT pp.media_id,pp.stage,m.original_name,m.category,m.alt_text FROM project_photos pp JOIN media_assets m ON m.id=pp.media_id WHERE pp.project_id=? AND m.is_published=1 AND m.content_type LIKE 'image/%' ORDER BY pp.sort_order",
        [project.id],
      );
      const convert = (items: typeof photos): PublishedMedia[] => items.map(item => ({
        id: String(item.media_id),
        original_name: String(item.original_name),
        category: String(item.category),
        alt_text: String(item.alt_text || item.original_name),
        url: "/api/media/" + encodeURIComponent(String(item.media_id)),
      }));
      output.push({
        id: String(project.id),
        title: String(project.title),
        service: String(project.service),
        location: String(project.location || ""),
        description: String(project.description || ""),
        completed_at: project.completed_at ? String(project.completed_at) : null,
        before: convert(photos.filter(item => item.stage === "before")),
        after: convert(photos.filter(item => item.stage === "after")),
        general: convert(photos.filter(item => item.stage === "general")),
      });
    }
    return output;
  } catch {
    return [];
  }
}

export type PublishedHeroSlide = {
  id:string;
  eyebrow:string;
  title:string;
  description:string;
  button_label:string;
  button_url:string;
  sort_order:number;
  url:string;
  alt_text:string;
};

export async function getPublishedHeroSlides():Promise<PublishedHeroSlide[]> {
  try {
    const items=await rows(
      "SELECT s.id,s.eyebrow,s.title,s.description,s.button_label,s.button_url,s.sort_order,m.id AS media_id,m.alt_text,m.original_name FROM homepage_slides s JOIN media_assets m ON m.id=s.media_id WHERE s.is_active=1 AND m.is_published=1 AND m.content_type LIKE 'image/%' ORDER BY s.sort_order,s.created_at LIMIT 12",
    );
    return items.map(item=>({
      id:String(item.id),
      eyebrow:String(item.eyebrow||"NEXTGEN MAINTENANCE SOLUTIONS"),
      title:String(item.title),
      description:String(item.description||""),
      button_label:String(item.button_label||"Get a quote"),
      button_url:String(item.button_url||"/quote"),
      sort_order:Number(item.sort_order||0),
      url:"/api/media/"+encodeURIComponent(String(item.media_id)),
      alt_text:String(item.alt_text||item.original_name||item.title),
    }));
  } catch {
    return [];
  }
}
